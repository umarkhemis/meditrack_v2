from rest_framework import serializers
from django.contrib.auth.models import User
from .models import DoctorProfile, Patient, CheckIn, SMSLog, CheckInSchedule, SchedulerLog, DoctorAlert


class DoctorProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = DoctorProfile
        fields = ['phone', 'specialization', 'hospital']


class UserSerializer(serializers.ModelSerializer):
    doctor_profile = DoctorProfileSerializer(read_only=True)
    patient_count = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ['id', 'username', 'first_name', 'last_name', 'email', 'is_staff', 'doctor_profile', 'patient_count']

    def get_patient_count(self, obj):
        return obj.patients.filter(is_active=True).count()


class CreateDoctorSerializer(serializers.Serializer):
    username = serializers.CharField()
    first_name = serializers.CharField()
    last_name = serializers.CharField()
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)
    phone = serializers.CharField(required=False, default='')
    specialization = serializers.CharField(required=False, default='')
    hospital = serializers.CharField(required=False, default='')

    def create(self, validated_data):
        phone = validated_data.pop('phone', '')
        specialization = validated_data.pop('specialization', '')
        hospital = validated_data.pop('hospital', '')
        password = validated_data.pop('password')
        user = User.objects.create_user(password=password, **validated_data)
        DoctorProfile.objects.create(user=user, phone=phone, specialization=specialization, hospital=hospital)
        return user


class CheckInSerializer(serializers.ModelSerializer):
    class Meta:
        model = CheckIn
        fields = '__all__'
        read_only_fields = ['status', 'submitted_at']


class CheckInCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = CheckIn
        fields = ['patient', 'fever', 'pain', 'difficulty_breathing', 'wound_issues',
                  'nausea_vomiting', 'dizziness', 'feeling_well', 'additional_notes', 'channel']


class SMSLogSerializer(serializers.ModelSerializer):
    patient_name = serializers.SerializerMethodField()

    class Meta:
        model = SMSLog
        fields = '__all__'

    def get_patient_name(self, obj):
        return obj.patient.full_name


class CheckInScheduleSerializer(serializers.ModelSerializer):
    next_send = serializers.SerializerMethodField()
    monitoring_ends = serializers.SerializerMethodField()

    class Meta:
        model = CheckInSchedule
        fields = '__all__'

    def get_next_send(self, obj):
        """Return ISO datetime string of when the next message will be sent."""
        if not obj.is_active:
            return None
        from datetime import timedelta
        from django.utils import timezone

        now = timezone.localtime()
        candidate = now.replace(hour=obj.send_hour, minute=obj.send_minute, second=0, microsecond=0)
        if candidate <= now:
            candidate += timedelta(days=1)

        # Factor in frequency
        if obj.last_sent_at:
            from core.scheduler import _frequency_to_days
            interval = _frequency_to_days(obj.frequency)
            last_local = timezone.localtime(obj.last_sent_at)
            days_since = (now.date() - last_local.date()).days
            if days_since < interval:
                gap = interval - days_since
                candidate = now.replace(hour=obj.send_hour, minute=obj.send_minute, second=0, microsecond=0)
                candidate += timedelta(days=gap)
                if candidate.date() == now.date() and candidate <= now:
                    candidate += timedelta(days=interval)

        return candidate.isoformat()

    def get_monitoring_ends(self, obj):
        if obj.monitoring_duration_days == 0:
            return None
        from datetime import timedelta
        return str(obj.patient.discharge_date + timedelta(days=obj.monitoring_duration_days))


class SchedulerLogSerializer(serializers.ModelSerializer):
    class Meta:
        model = SchedulerLog
        fields = '__all__'


class PatientSerializer(serializers.ModelSerializer):
    latest_status = serializers.ReadOnlyField()
    assigned_doctor_name = serializers.SerializerMethodField()
    added_by_name = serializers.SerializerMethodField()
    checkin_count = serializers.SerializerMethodField()
    last_checkin = serializers.SerializerMethodField()
    schedule = CheckInScheduleSerializer(read_only=True)

    class Meta:
        model = Patient
        fields = '__all__'

    def get_assigned_doctor_name(self, obj):
        if obj.assigned_doctor:
            return f"Dr. {obj.assigned_doctor.get_full_name() or obj.assigned_doctor.username}"
        return None

    def get_added_by_name(self, obj):
        if obj.added_by:
            name = obj.added_by.get_full_name()
            return name if name else obj.added_by.username
        return None

    def get_checkin_count(self, obj):
        return obj.checkins.count()

    def get_last_checkin(self, obj):
        last = obj.checkins.order_by('-submitted_at').first()
        if last:
            return last.submitted_at
        return None


class PatientCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Patient
        fields = ['full_name', 'phone_number', 'age', 'gender', 'condition_type',
                  'diagnosis', 'discharge_date', 'assigned_doctor', 'notes']


class DoctorAlertSerializer(serializers.ModelSerializer):
    patient_name     = serializers.SerializerMethodField()
    patient_id       = serializers.SerializerMethodField()
    doctor_name      = serializers.SerializerMethodField()
    checkin_symptoms = serializers.SerializerMethodField()

    class Meta:
        model  = DoctorAlert
        fields = ['id', 'severity', 'message', 'is_read', 'created_at',
                  'patient_name', 'patient_id', 'doctor_name', 'checkin_symptoms']

    def get_patient_name(self, obj):  return obj.patient.full_name
    def get_patient_id(self, obj):    return obj.patient.id
    def get_doctor_name(self, obj):   return f"Dr. {obj.doctor.get_full_name() or obj.doctor.username}"
    def get_checkin_symptoms(self, obj):
        c = obj.checkin
        symptoms = []
        if c.fever:                symptoms.append('Fever')
        if c.pain:                 symptoms.append('Pain')
        if c.difficulty_breathing: symptoms.append('Breathing Difficulty')
        if c.wound_issues:         symptoms.append('Wound Issues')
        if c.nausea_vomiting:      symptoms.append('Nausea / Vomiting')
        if c.dizziness:            symptoms.append('Dizziness')
        if c.feeling_well:         symptoms.append('Feeling Well')
        return symptoms

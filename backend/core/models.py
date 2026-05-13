import secrets
from django.db import models
from django.contrib.auth.models import User


class DoctorProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='doctor_profile')
    phone = models.CharField(max_length=20, blank=True)
    specialization = models.CharField(max_length=100, blank=True)
    hospital = models.CharField(max_length=200, default='')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Dr. {self.user.get_full_name() or self.user.username}"


class Patient(models.Model):
    CONDITION_CHOICES = [
        ('chronic', 'Chronic Illness'),
        ('post_surgical', 'Post-Surgical'),
        ('acute', 'Acute Illness'),
        ('other', 'Other'),
    ]
    full_name = models.CharField(max_length=200)
    phone_number = models.CharField(max_length=20)
    age = models.IntegerField()
    gender = models.CharField(max_length=10, choices=[('male', 'Male'), ('female', 'Female'), ('other', 'Other')])
    condition_type = models.CharField(max_length=20, choices=CONDITION_CHOICES)
    diagnosis = models.TextField()
    discharge_date = models.DateField()
    assigned_doctor = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='patients')
    added_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='added_patients')
    is_active = models.BooleanField(default=True)
    notes = models.TextField(blank=True)
    checkin_token = models.CharField(max_length=48, unique=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def save(self, *args, **kwargs):
        if not self.checkin_token:
            self.checkin_token = secrets.token_urlsafe(32)
        super().save(*args, **kwargs)

    def __str__(self):
        return self.full_name

    @property
    def latest_status(self):
        checkin = self.checkins.order_by('-submitted_at').first()
        if not checkin:
            return 'pending'
        return checkin.status


class DoctorAlert(models.Model):
    """
    In-app notification created whenever a patient submits a yellow or red check-in.
    Each alert is targeted at the patient's assigned doctor (and visible to admins).
    Doctors dismiss alerts from the dashboard — no personal phone numbers involved.
    """
    SEVERITY_CHOICES = [
        ('yellow', 'Needs Attention'),
        ('red',    'Critical'),
    ]
    doctor   = models.ForeignKey(User, on_delete=models.CASCADE, related_name='alerts')
    patient  = models.ForeignKey(Patient, on_delete=models.CASCADE, related_name='alerts')
    checkin  = models.ForeignKey('CheckIn', on_delete=models.CASCADE, related_name='alerts')
    severity = models.CharField(max_length=10, choices=SEVERITY_CHOICES)
    message  = models.TextField()
    is_read  = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"Alert [{self.severity}] — {self.patient.full_name} → Dr. {self.doctor.get_full_name()}"


class CheckInSchedule(models.Model):
    FREQUENCY_CHOICES = [
        ('daily',        'Every day'),
        ('every_2_days', 'Every 2 days'),
        ('every_3_days', 'Every 3 days'),
        ('weekly',       'Once a week'),
    ]
    patient = models.OneToOneField(Patient, on_delete=models.CASCADE, related_name='schedule')
    is_active = models.BooleanField(default=True)
    frequency = models.CharField(max_length=20, choices=FREQUENCY_CHOICES, default='daily')
    send_hour   = models.IntegerField(default=8)
    send_minute = models.IntegerField(default=0)
    monitoring_duration_days = models.IntegerField(default=30)
    last_sent_at = models.DateTimeField(null=True, blank=True)
    total_sent   = models.IntegerField(default=0)
    created_at   = models.DateTimeField(auto_now_add=True)
    updated_at   = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Schedule for {self.patient.full_name} ({self.frequency})"


class SchedulerLog(models.Model):
    ran_at            = models.DateTimeField(auto_now_add=True)
    patients_checked  = models.IntegerField(default=0)
    messages_sent     = models.IntegerField(default=0)
    messages_skipped  = models.IntegerField(default=0)
    errors            = models.IntegerField(default=0)
    detail            = models.TextField(blank=True)

    class Meta:
        ordering = ['-ran_at']

    def __str__(self):
        return f"Scheduler run at {self.ran_at} — {self.messages_sent} sent"


class CheckIn(models.Model):
    STATUS_CHOICES = [
        ('green',  'Stable'),
        ('yellow', 'Needs Attention'),
        ('red',    'Critical'),
    ]
    patient              = models.ForeignKey(Patient, on_delete=models.CASCADE, related_name='checkins')
    fever                = models.BooleanField(default=False)
    pain                 = models.BooleanField(default=False)
    difficulty_breathing = models.BooleanField(default=False)
    wound_issues         = models.BooleanField(default=False)
    nausea_vomiting      = models.BooleanField(default=False)
    dizziness            = models.BooleanField(default=False)
    feeling_well         = models.BooleanField(default=False)
    additional_notes     = models.TextField(blank=True)
    status               = models.CharField(max_length=10, choices=STATUS_CHOICES)
    submitted_at         = models.DateTimeField(auto_now_add=True)
    channel              = models.CharField(max_length=10, default='sms')

    def save(self, *args, **kwargs):
        critical    = self.fever and self.difficulty_breathing
        severe      = self.difficulty_breathing and self.pain
        any_symptom = any([self.fever, self.pain, self.difficulty_breathing,
                           self.wound_issues, self.nausea_vomiting, self.dizziness])
        if critical or severe:
            self.status = 'red'
        elif any_symptom:
            self.status = 'yellow'
        else:
            self.status = 'green'
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.patient.full_name} - {self.status} - {self.submitted_at}"


class SMSLog(models.Model):
    patient    = models.ForeignKey(Patient, on_delete=models.CASCADE, related_name='sms_logs')
    message    = models.TextField()
    direction  = models.CharField(max_length=10, choices=[('out', 'Outbound'), ('in', 'Inbound')])
    status     = models.CharField(max_length=20, default='delivered')
    channel    = models.CharField(max_length=20, default='sms')
    twilio_sid = models.CharField(max_length=100, blank=True)
    sent_at    = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"SMS to {self.patient.full_name} [{self.status}]"

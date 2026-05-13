from rest_framework import status, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.views import APIView
from django.contrib.auth.models import User
from django.db.models import Prefetch
from django.http import HttpResponse
from django.views.decorators.csrf import csrf_exempt
from .models import DoctorProfile, Patient, CheckIn, SMSLog, CheckInSchedule, SchedulerLog, DoctorAlert
from .serializers import (
    UserSerializer, CreateDoctorSerializer, PatientSerializer,
    PatientCreateSerializer, CheckInSerializer, CheckInCreateSerializer,
    SMSLogSerializer, CheckInScheduleSerializer, SchedulerLogSerializer,
    DoctorAlertSerializer,
)
from . import sms_service


class IsAdminUser(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user and request.user.is_staff


# ── Auth / Profile ─────────────────────────────────────────────────────────────

@api_view(['GET'])
def me(request):
    return Response(UserSerializer(request.user).data)


# ── Doctors ────────────────────────────────────────────────────────────────────

class DoctorListCreateView(APIView):
    permission_classes = [IsAdminUser]

    def get(self, request):
        doctors = User.objects.filter(is_staff=False).select_related('doctor_profile')
        return Response(UserSerializer(doctors, many=True).data)

    def post(self, request):
        s = CreateDoctorSerializer(data=request.data)
        if s.is_valid():
            user = s.save()
            return Response(UserSerializer(user).data, status=status.HTTP_201_CREATED)
        return Response(s.errors, status=status.HTTP_400_BAD_REQUEST)


class DoctorDetailView(APIView):
    permission_classes = [IsAdminUser]

    def delete(self, request, pk):
        try:
            user = User.objects.get(pk=pk, is_staff=False)
            user.delete()
            return Response(status=204)
        except User.DoesNotExist:
            return Response({'error': 'Not found'}, status=404)


# ── Patients ───────────────────────────────────────────────────────────────────

class PatientListCreateView(APIView):
    def get(self, request):
        qs = Patient.objects.filter(is_active=True).select_related('assigned_doctor', 'added_by')
        if not request.user.is_staff:
            qs = qs.filter(assigned_doctor=request.user)
        qs = qs.prefetch_related(
            Prefetch('checkins', queryset=CheckIn.objects.order_by('-submitted_at')),
            'schedule',
        )
        return Response(PatientSerializer(qs, many=True).data)

    def post(self, request):
        s = PatientCreateSerializer(data=request.data)
        if s.is_valid():
            patient = s.save(added_by=request.user)
            CheckInSchedule.objects.get_or_create(patient=patient)
            sms_service.send_checkin_prompt(patient)
            return Response(PatientSerializer(patient).data, status=201)
        return Response(s.errors, status=400)


class PatientDetailView(APIView):
    def _get(self, pk, user):
        try:
            return Patient.objects.get(pk=pk) if user.is_staff else Patient.objects.get(pk=pk, assigned_doctor=user)
        except Patient.DoesNotExist:
            return None

    def get(self, request, pk):
        p = self._get(pk, request.user)
        return Response(PatientSerializer(p).data) if p else Response({'error': 'Not found'}, status=404)

    def patch(self, request, pk):
        p = self._get(pk, request.user)
        if not p:
            return Response({'error': 'Not found'}, status=404)
        s = PatientSerializer(p, data=request.data, partial=True)
        if s.is_valid():
            s.save()
            return Response(s.data)
        return Response(s.errors, status=400)

    def delete(self, request, pk):
        p = self._get(pk, request.user)
        if not p:
            return Response({'error': 'Not found'}, status=404)
        p.is_active = False
        p.save()
        return Response(status=204)


# ── Check-ins ──────────────────────────────────────────────────────────────────

class PatientCheckInsView(APIView):
    def get(self, request, pk):
        try:
            p = Patient.objects.get(pk=pk) if request.user.is_staff \
                else Patient.objects.get(pk=pk, assigned_doctor=request.user)
        except Patient.DoesNotExist:
            return Response({'error': 'Not found'}, status=404)
        return Response(CheckInSerializer(p.checkins.order_by('-submitted_at'), many=True).data)


@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def submit_checkin(request):
    """
    Public endpoint — patient submits their check-in via the SMS link.
    1. Saves the check-in.
    2. If yellow/red → creates an in-app DoctorAlert + sends acknowledgement SMS to patient.
    3. If green → sends a simple thank-you SMS to patient.
    All messages come from the hospital number.
    """
    token      = request.data.get('token')
    patient_id = request.data.get('patient')
    if not token or not patient_id:
        return Response({'error': 'Invalid request'}, status=400)
    try:
        patient = Patient.objects.get(pk=patient_id, checkin_token=token, is_active=True)
    except Patient.DoesNotExist:
        return Response({'error': 'Invalid or expired link'}, status=403)

    s = CheckInCreateSerializer(data={**request.data, 'patient': patient.id})
    if s.is_valid():
        checkin = s.save()
        is_critical = checkin.status in ('yellow', 'red')

        if is_critical:
            # Create in-app alert for the doctor — no personal phone numbers
            sms_service.create_doctor_alert(patient, checkin)

        # Always send an acknowledgement SMS back to the patient
        sms_service.send_checkin_acknowledgement(patient, is_critical=is_critical)

        return Response(CheckInSerializer(checkin).data, status=201)
    return Response(s.errors, status=400)


# ── SMS ────────────────────────────────────────────────────────────────────────

class SendCheckinPromptView(APIView):
    def post(self, request, pk):
        try:
            patient = Patient.objects.get(pk=pk)
        except Patient.DoesNotExist:
            return Response({'error': 'Not found'}, status=404)
        result = sms_service.send_checkin_prompt(patient)
        return Response(result)


class PatientSMSLogsView(APIView):
    def get(self, request, pk):
        try:
            patient = Patient.objects.get(pk=pk)
        except Patient.DoesNotExist:
            return Response({'error': 'Not found'}, status=404)
        logs = patient.sms_logs.order_by('-sent_at')[:50]
        return Response(SMSLogSerializer(logs, many=True).data)


@csrf_exempt
@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def twilio_webhook(request):
    """
    Twilio inbound webhook.
    Set this URL in Twilio Console → Phone Numbers → Messaging → Webhook:
      POST https://medi-track-app.onrender.com/api/sms/webhook/
    """
    from_number = request.data.get('From', '')
    body        = request.data.get('Body', '').strip()
    if not from_number:
        return HttpResponse('<?xml version="1.0"?><Response/>', content_type='text/xml', status=400)
    twiml = sms_service.handle_inbound_sms(from_number, body)
    return HttpResponse(twiml, content_type='text/xml')


# ── Alerts ─────────────────────────────────────────────────────────────────────

@api_view(['GET'])
def my_alerts(request):
    """
    Returns unread (and recent read) alerts for the logged-in doctor.
    Admins see all alerts across all doctors.
    """
    if request.user.is_staff:
        alerts = DoctorAlert.objects.select_related('patient', 'doctor', 'checkin').all()[:50]
    else:
        alerts = DoctorAlert.objects.filter(
            doctor=request.user
        ).select_related('patient', 'doctor', 'checkin')[:50]
    return Response(DoctorAlertSerializer(alerts, many=True).data)


@api_view(['GET'])
def unread_alert_count(request):
    """Lightweight endpoint polled by the frontend for the notification badge."""
    if request.user.is_staff:
        count = DoctorAlert.objects.filter(is_read=False).count()
    else:
        count = DoctorAlert.objects.filter(doctor=request.user, is_read=False).count()
    return Response({'count': count})


@api_view(['POST'])
def mark_alert_read(request, pk):
    """Mark a single alert as read."""
    try:
        if request.user.is_staff:
            alert = DoctorAlert.objects.get(pk=pk)
        else:
            alert = DoctorAlert.objects.get(pk=pk, doctor=request.user)
    except DoctorAlert.DoesNotExist:
        return Response({'error': 'Not found'}, status=404)
    alert.is_read = True
    alert.save()
    return Response({'ok': True})


@api_view(['POST'])
def mark_all_alerts_read(request):
    """Mark all of the current user's alerts as read."""
    if request.user.is_staff:
        DoctorAlert.objects.filter(is_read=False).update(is_read=True)
    else:
        DoctorAlert.objects.filter(doctor=request.user, is_read=False).update(is_read=True)
    return Response({'ok': True})


# ── Schedule ───────────────────────────────────────────────────────────────────

class PatientScheduleView(APIView):
    def _get_patient(self, pk, user):
        try:
            return Patient.objects.get(pk=pk) if user.is_staff \
                else Patient.objects.get(pk=pk, assigned_doctor=user)
        except Patient.DoesNotExist:
            return None

    def get(self, request, pk):
        patient = self._get_patient(pk, request.user)
        if not patient:
            return Response({'error': 'Not found'}, status=404)
        schedule, _ = CheckInSchedule.objects.get_or_create(patient=patient)
        return Response(CheckInScheduleSerializer(schedule).data)

    def put(self, request, pk):
        patient = self._get_patient(pk, request.user)
        if not patient:
            return Response({'error': 'Not found'}, status=404)
        schedule, _ = CheckInSchedule.objects.get_or_create(patient=patient)
        s = CheckInScheduleSerializer(schedule, data=request.data, partial=True)
        if s.is_valid():
            s.save()
            return Response(s.data)
        return Response(s.errors, status=400)


# ── Scheduler ──────────────────────────────────────────────────────────────────

@api_view(['GET'])
def scheduler_logs(request):
    return Response(SchedulerLogSerializer(SchedulerLog.objects.all()[:50], many=True).data)


@api_view(['GET'])
def scheduler_status(request):
    total    = CheckInSchedule.objects.filter(is_active=True, patient__is_active=True).count()
    last_run = SchedulerLog.objects.first()
    return Response({
        'active_schedules': total,
        'last_run': SchedulerLogSerializer(last_run).data if last_run else None,
    })


# ── Dashboard Stats ────────────────────────────────────────────────────────────

@api_view(['GET'])
def dashboard_stats(request):
    qs = Patient.objects.filter(is_active=True)
    if not request.user.is_staff:
        qs = qs.filter(assigned_doctor=request.user)
    qs = qs.prefetch_related(Prefetch('checkins', queryset=CheckIn.objects.order_by('-submitted_at')))

    total = green = yellow = red = pending = 0
    for p in qs:
        total += 1
        s = p.latest_status
        if s == 'green':   green   += 1
        elif s == 'yellow': yellow += 1
        elif s == 'red':    red    += 1
        else:               pending += 1

    stats = {
        'total_patients': total, 'green': green,
        'yellow': yellow, 'red': red, 'pending': pending,
    }
    if request.user.is_staff:
        stats['total_doctors']    = User.objects.filter(is_staff=False).count()
        stats['active_schedules'] = CheckInSchedule.objects.filter(
            is_active=True, patient__is_active=True).count()

    # Always include unread alert count for badge
    if request.user.is_staff:
        stats['unread_alerts'] = DoctorAlert.objects.filter(is_read=False).count()
    else:
        stats['unread_alerts'] = DoctorAlert.objects.filter(
            doctor=request.user, is_read=False).count()

    return Response(stats)


# ── SMS Inbox ──────────────────────────────────────────────────────────────────

@api_view(['GET'])
def sms_inbox(request):
    if request.user.is_staff:
        logs = SMSLog.objects.select_related('patient').order_by('-sent_at')[:100]
    else:
        pids = Patient.objects.filter(assigned_doctor=request.user).values_list('id', flat=True)
        logs = SMSLog.objects.filter(patient__in=pids).select_related('patient').order_by('-sent_at')[:100]
    return Response(SMSLogSerializer(logs, many=True).data)


# ── Public check-in info ───────────────────────────────────────────────────────

@api_view(['GET'])
@permission_classes([permissions.AllowAny])
def patient_public_info(request, token):
    try:
        patient = Patient.objects.get(checkin_token=token, is_active=True)
        return Response({'full_name': patient.full_name, 'id': patient.id, 'token': token})
    except Patient.DoesNotExist:
        return Response({'error': 'Not found'}, status=404)

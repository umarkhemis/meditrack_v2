"""
MediTrack Messaging Service
----------------------------
All outbound SMS messages are sent from the single registered hospital number
(TWILIO_PHONE_NUMBER). No doctor personal phone numbers are used for routing.

Flow:
  Outbound  →  hospital number  →  patient's phone
  Inbound   ←  patient replies  ←  Twilio webhook  →  logged against patient
  Alerts    →  DoctorAlert DB record  (in-app, no personal numbers)
"""
import logging
from django.conf import settings

logger = logging.getLogger(__name__)


# ── Helpers ────────────────────────────────────────────────────────────────────

def _frontend_url():
    return getattr(settings, 'FRONTEND_URL', 'http://localhost:5173')


def _checkin_link(patient):
    return f"{_frontend_url()}/checkin/{patient.checkin_token}"


def _is_live():
    return bool(
        getattr(settings, 'TWILIO_ACCOUNT_SID', '') and
        getattr(settings, 'TWILIO_AUTH_TOKEN', '') and
        getattr(settings, 'TWILIO_PHONE_NUMBER', '')
    )


# ── Message templates ──────────────────────────────────────────────────────────

def get_checkin_message(patient):
    first_name = patient.full_name.split()[0]
    return (
        f"Hello {first_name},\n\n"
        f"Your care team is checking in on your recovery.\n\n"
        f"Please take a moment to report how you are feeling today:\n"
        f"{_checkin_link(patient)}\n\n"
        f"Reply STOP to opt out."
    )


def get_acknowledgement_message(patient):
    """
    Sent back to the patient after they submit a check-in.
    Always from the hospital number — clean and professional.
    """
    first_name = patient.full_name.split()[0]
    return (
        f"Thank you, {first_name}. Your response has been received "
        f"and your care team has been notified. Stay well."
    )


def get_critical_acknowledgement_message(patient):
    """Sent to patient when their check-in triggers a red/yellow alert."""
    first_name = patient.full_name.split()[0]
    return (
        f"Thank you, {first_name}. Your symptoms have been noted and your "
        f"doctor has been alerted. If you feel your condition is worsening "
        f"immediately, please go to the nearest hospital or call emergency services."
    )


# ── Core send functions ────────────────────────────────────────────────────────

def _send_via_twilio(to_number, message, patient, direction='out'):
    """Send from the hospital number via Twilio."""
    from .models import SMSLog
    try:
        from twilio.rest import Client
        client = Client(settings.TWILIO_ACCOUNT_SID, settings.TWILIO_AUTH_TOKEN)
        use_whatsapp = getattr(settings, 'TWILIO_USE_WHATSAPP', False)

        if use_whatsapp:
            from_num = settings.TWILIO_WHATSAPP_FROM
            to_num   = f"whatsapp:{to_number}"
            channel  = 'whatsapp'
        else:
            from_num = settings.TWILIO_PHONE_NUMBER   # ← always the hospital number
            to_num   = to_number
            channel  = 'sms'

        msg = client.messages.create(body=message, from_=from_num, to=to_num)
        log = SMSLog.objects.create(
            patient=patient, message=message, direction=direction,
            status='delivered', channel=channel, twilio_sid=msg.sid
        )
        logger.info(f"SMS sent to {to_number} — SID: {msg.sid}")
        return {'success': True, 'sid': msg.sid, 'log_id': log.id}
    except Exception as e:
        SMSLog.objects.create(
            patient=patient, message=message, direction=direction,
            status='failed', channel='sms'
        )
        logger.error(f"Twilio send failed for {to_number}: {e}")
        return {'success': False, 'error': str(e)}


def _log_delivery(patient, message, direction='out'):
    """Built-in delivery layer — logs without external sending."""
    from .models import SMSLog
    log = SMSLog.objects.create(
        patient=patient, message=message,
        direction=direction, status='delivered', channel='sms'
    )
    return {'success': True, 'log_id': log.id}


def send_to_patient(patient, message, direction='out'):
    """Send any message to a patient. Always from the hospital number."""
    if _is_live():
        return _send_via_twilio(patient.phone_number, message, patient, direction)
    return _log_delivery(patient, message, direction)


# ── Public API ─────────────────────────────────────────────────────────────────

def send_checkin_prompt(patient):
    """Send the daily check-in link to a patient."""
    return send_to_patient(patient, get_checkin_message(patient))


def send_checkin_acknowledgement(patient, is_critical=False):
    """
    Send a confirmation SMS back to the patient after they submit.
    Uses the critical variant if their symptoms triggered an alert.
    """
    msg = get_critical_acknowledgement_message(patient) if is_critical else get_acknowledgement_message(patient)
    return send_to_patient(patient, msg)


def create_doctor_alert(patient, checkin):
    """
    Create an in-app DoctorAlert for the patient's assigned doctor.
    No personal phone numbers are used — alert lives in the DB and
    is surfaced in the doctor's dashboard.
    """
    from .models import DoctorAlert

    if not patient.assigned_doctor:
        logger.warning(f"No assigned doctor for patient {patient.full_name} — alert not created")
        return None

    if checkin.status == 'red':
        message = (
            f"URGENT — {patient.full_name} has reported critical symptoms "
            f"(fever with breathing difficulty). Immediate follow-up required. "
            f"Contact: {patient.phone_number}."
        )
    elif checkin.status == 'yellow':
        message = (
            f"{patient.full_name} has reported symptoms that need attention. "
            f"Please review their latest check-in. "
            f"Contact: {patient.phone_number}."
        )
    else:
        return None

    alert = DoctorAlert.objects.create(
        doctor   = patient.assigned_doctor,
        patient  = patient,
        checkin  = checkin,
        severity = checkin.status,
        message  = message,
    )
    logger.info(
        f"Alert created for Dr. {patient.assigned_doctor.get_full_name()} "
        f"— patient: {patient.full_name} [{checkin.status}]"
    )
    return alert


def handle_inbound_sms(from_number, body):
    """
    Twilio webhook handler for patient replies.
    Logs the message and returns a TwiML response.
    The hospital number receives all replies — no doctor involvement.
    """
    from .models import Patient, SMSLog

    from_number = from_number.strip()
    if from_number.lower().startswith('whatsapp:'):
        from_number = from_number[9:]

    patient = None
    try:
        patient = Patient.objects.filter(phone_number=from_number, is_active=True).first()
        if not patient:
            patient = Patient.objects.filter(
                phone_number__endswith=from_number[-9:], is_active=True
            ).first()
    except Exception:
        pass

    if patient:
        SMSLog.objects.create(
            patient=patient, message=body, direction='in',
            status='received',
            channel='whatsapp' if 'whatsapp' in from_number.lower() else 'sms',
        )
        logger.info(f"Inbound from {patient.full_name}: {body[:60]}")
        reply = (
            f"Thank you for your message, {patient.full_name.split()[0]}. "
            f"Your care team has been notified."
        )
    else:
        logger.warning(f"Inbound from unknown number: {from_number}")
        reply = (
            "Thank you for your message. "
            "Please use the check-in link sent by your care team."
        )

    return (
        '<?xml version="1.0" encoding="UTF-8"?>'
        f'<Response><Message>{reply}</Message></Response>'
    )

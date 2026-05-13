"""
MediTrack Automated Check-in Scheduler
---------------------------------------
Uses APScheduler to run a check every minute.
Each minute it evaluates all active schedules and fires messages
to patients whose send time has arrived and whose frequency interval has elapsed.

No Celery, no Redis — runs entirely within the Django process.
Drop in Twilio credentials to go live; without them every message is
delivered through the built-in logging layer.
"""
import logging
from datetime import timedelta

from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.interval import IntervalTrigger
from django.utils import timezone

logger = logging.getLogger(__name__)

_scheduler = None


def _frequency_to_days(frequency):
    return {
        'daily': 1,
        'every_2_days': 2,
        'every_3_days': 3,
        'weekly': 7,
    }.get(frequency, 1)


def run_scheduled_checkins():
    """
    Called every minute by APScheduler.
    Checks all active patient schedules and sends messages where due.
    """
    # Import inside function to avoid app-not-ready errors at startup
    from .models import CheckInSchedule, SchedulerLog
    from . import sms_service

    now = timezone.localtime()  # respects settings.TIME_ZONE
    sent = 0
    skipped = 0
    errors = 0
    detail_lines = []

    schedules = (
        CheckInSchedule.objects
        .filter(is_active=True, patient__is_active=True)
        .select_related('patient', 'patient__assigned_doctor')
    )

    for schedule in schedules:
        patient = schedule.patient
        try:
            # 1. Check if monitoring window has expired
            if schedule.monitoring_duration_days > 0:
                cutoff = patient.discharge_date + timedelta(days=schedule.monitoring_duration_days)
                if now.date() > cutoff:
                    schedule.is_active = False
                    schedule.save(update_fields=['is_active'])
                    detail_lines.append(f"EXPIRED: {patient.full_name} — monitoring window ended")
                    skipped += 1
                    continue

            # 2. Check if send time matches current hour/minute
            if now.hour != schedule.send_hour or now.minute != schedule.send_minute:
                skipped += 1
                continue

            # 3. Check frequency interval
            interval_days = _frequency_to_days(schedule.frequency)
            if schedule.last_sent_at:
                last_local = timezone.localtime(schedule.last_sent_at)
                days_since = (now.date() - last_local.date()).days
                if days_since < interval_days:
                    skipped += 1
                    continue

            # 4. Send it
            result = sms_service.send_checkin_prompt(patient)
            if result.get('success'):
                schedule.last_sent_at = now
                schedule.total_sent += 1
                schedule.save(update_fields=['last_sent_at', 'total_sent'])
                sent += 1
                detail_lines.append(f"SENT: {patient.full_name}")
            else:
                errors += 1
                detail_lines.append(f"FAILED: {patient.full_name} — {result.get('error', 'unknown error')}")

        except Exception as e:
            errors += 1
            detail_lines.append(f"ERROR: {patient.full_name} — {str(e)}")
            logger.exception(f"Scheduler error for patient {patient.id}")

    # Only write a log entry if something happened
    if sent or errors:
        SchedulerLog.objects.create(
            patients_checked=schedules.count(),
            messages_sent=sent,
            messages_skipped=skipped,
            errors=errors,
            detail='\n'.join(detail_lines),
        )

    if sent or errors:
        logger.info(f"Scheduler: {sent} sent, {skipped} skipped, {errors} errors")


def start():
    global _scheduler
    if _scheduler is not None:
        return

    _scheduler = BackgroundScheduler(timezone='UTC')
    _scheduler.add_job(
        run_scheduled_checkins,
        trigger=IntervalTrigger(minutes=1),
        id='checkin_scheduler',
        name='Automated check-in sender',
        replace_existing=True,
        max_instances=1,
        coalesce=True,
    )
    _scheduler.start()
    logger.info("MediTrack check-in scheduler started.")


def stop():
    global _scheduler
    if _scheduler:
        _scheduler.shutdown(wait=False)
        _scheduler = None

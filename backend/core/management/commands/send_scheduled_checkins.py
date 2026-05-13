"""
Management command: python manage.py send_scheduled_checkins

Useful for cron-based deployment (e.g. crontab, systemd timer, Railway cron)
as an alternative to APScheduler. Can be called directly at any time.

  # Run once immediately:
  python manage.py send_scheduled_checkins

  # Crontab example — runs every minute:
  * * * * * cd /path/to/meditrack && python manage.py send_scheduled_checkins >> /var/log/meditrack_scheduler.log 2>&1
"""
from django.core.management.base import BaseCommand
from core.scheduler import run_scheduled_checkins


class Command(BaseCommand):
    help = 'Send automated check-in messages to patients whose schedule is due'

    def handle(self, *args, **options):
        self.stdout.write('Running scheduled check-ins...')
        run_scheduled_checkins()
        self.stdout.write(self.style.SUCCESS('Done.'))

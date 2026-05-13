from django.apps import AppConfig


class CoreConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'core'

    def ready(self):
        import sys
        # Don't start scheduler during migrations, tests, or management commands
        # that aren't the actual server
        is_manage_py = any('manage.py' in arg for arg in sys.argv)
        is_runserver = 'runserver' in sys.argv

        if is_manage_py and not is_runserver:
            return

        # Avoid double-start with Django's auto-reloader
        import os
        if os.environ.get('RUN_MAIN') == 'true' or not is_manage_py:
            from .scheduler import start
            start()

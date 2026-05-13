from django.db import migrations, models
import secrets


def generate_tokens(apps, schema_editor):
    Patient = apps.get_model('core', 'Patient')
    for patient in Patient.objects.filter(checkin_token=''):
        patient.checkin_token = secrets.token_urlsafe(32)
        patient.save(update_fields=['checkin_token'])


class Migration(migrations.Migration):

    dependencies = [
        ('core', '0001_initial'),
    ]

    operations = [
        # Add checkin_token to Patient
        migrations.AddField(
            model_name='patient',
            name='checkin_token',
            field=models.CharField(max_length=48, unique=False, blank=True, default=''),
        ),
        # Populate tokens for existing patients
        migrations.RunPython(generate_tokens, reverse_code=migrations.RunPython.noop),
        # Now enforce uniqueness
        migrations.AlterField(
            model_name='patient',
            name='checkin_token',
            field=models.CharField(max_length=48, unique=True, blank=True, default=''),
        ),
        # Replace 'simulated' bool with 'channel' string on CheckIn
        migrations.AddField(
            model_name='checkin',
            name='channel',
            field=models.CharField(max_length=10, default='sms'),
        ),
        migrations.RemoveField(
            model_name='checkin',
            name='simulated',
        ),
        # Replace 'simulated' bool with 'channel' string on SMSLog
        migrations.AddField(
            model_name='smslog',
            name='channel',
            field=models.CharField(max_length=20, default='sms'),
        ),
        migrations.RemoveField(
            model_name='smslog',
            name='simulated',
        ),
        # Remove hospital default from DoctorProfile
        migrations.AlterField(
            model_name='doctorprofile',
            name='hospital',
            field=models.CharField(max_length=200, default=''),
        ),
    ]

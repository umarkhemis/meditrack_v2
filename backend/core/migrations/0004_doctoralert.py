from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('core', '0003_checkinschedule_schedulerlog'),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name='DoctorAlert',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('severity', models.CharField(choices=[('yellow', 'Needs Attention'), ('red', 'Critical')], max_length=10)),
                ('message', models.TextField()),
                ('is_read', models.BooleanField(default=False)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('doctor', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE,
                    related_name='alerts', to=settings.AUTH_USER_MODEL)),
                ('patient', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE,
                    related_name='alerts', to='core.patient')),
                ('checkin', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE,
                    related_name='alerts', to='core.checkin')),
            ],
            options={'ordering': ['-created_at']},
        ),
    ]

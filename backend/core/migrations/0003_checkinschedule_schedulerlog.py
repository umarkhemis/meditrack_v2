from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('core', '0002_add_token_and_channel'),
    ]

    operations = [
        migrations.CreateModel(
            name='SchedulerLog',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('ran_at', models.DateTimeField(auto_now_add=True)),
                ('patients_checked', models.IntegerField(default=0)),
                ('messages_sent', models.IntegerField(default=0)),
                ('messages_skipped', models.IntegerField(default=0)),
                ('errors', models.IntegerField(default=0)),
                ('detail', models.TextField(blank=True)),
            ],
            options={'ordering': ['-ran_at']},
        ),
        migrations.CreateModel(
            name='CheckInSchedule',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('is_active', models.BooleanField(default=True)),
                ('frequency', models.CharField(
                    choices=[
                        ('daily', 'Every day'),
                        ('every_2_days', 'Every 2 days'),
                        ('every_3_days', 'Every 3 days'),
                        ('weekly', 'Once a week'),
                    ],
                    default='daily', max_length=20
                )),
                ('send_hour', models.IntegerField(default=8)),
                ('send_minute', models.IntegerField(default=0)),
                ('monitoring_duration_days', models.IntegerField(default=30)),
                ('last_sent_at', models.DateTimeField(blank=True, null=True)),
                ('total_sent', models.IntegerField(default=0)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('patient', models.OneToOneField(
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name='schedule',
                    to='core.patient'
                )),
            ],
        ),
    ]

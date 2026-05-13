from django.urls import path
from . import views

urlpatterns = [
    path('me/', views.me),
    path('stats/', views.dashboard_stats),

    # SMS
    path('sms/inbox/', views.sms_inbox),
    path('sms/webhook/', views.twilio_webhook),

    # Doctors
    path('doctors/', views.DoctorListCreateView.as_view()),
    path('doctors/<int:pk>/', views.DoctorDetailView.as_view()),

    # Patients
    path('patients/', views.PatientListCreateView.as_view()),
    path('patients/<int:pk>/', views.PatientDetailView.as_view()),
    path('patients/<int:pk>/checkins/', views.PatientCheckInsView.as_view()),
    path('patients/<int:pk>/send-checkin/', views.SendCheckinPromptView.as_view()),
    path('patients/<int:pk>/sms-logs/', views.PatientSMSLogsView.as_view()),
    path('patients/<int:pk>/schedule/', views.PatientScheduleView.as_view()),

    # Alerts
    path('alerts/', views.my_alerts),
    path('alerts/count/', views.unread_alert_count),
    path('alerts/<int:pk>/read/', views.mark_alert_read),
    path('alerts/read-all/', views.mark_all_alerts_read),

    # Scheduler
    path('scheduler/logs/', views.scheduler_logs),
    path('scheduler/status/', views.scheduler_status),

    # Public check-in — submit MUST be declared before <str:token>/
    path('checkin/submit/', views.submit_checkin),
    path('checkin/<str:token>/', views.patient_public_info),
]

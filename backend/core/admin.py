from django.contrib import admin
from django.utils.html import format_html
from .models import DoctorProfile, Patient, CheckIn, SMSLog, CheckInSchedule, SchedulerLog, DoctorAlert


@admin.register(DoctorProfile)
class DoctorProfileAdmin(admin.ModelAdmin):
    list_display = ('__str__', 'user', 'specialization', 'hospital', 'phone', 'created_at')
    search_fields = ('user__first_name', 'user__last_name', 'user__username', 'specialization', 'hospital')
    list_filter = ('specialization',)
    raw_id_fields = ('user',)


@admin.register(Patient)
class PatientAdmin(admin.ModelAdmin):
    list_display = ('full_name', 'phone_number', 'age', 'gender', 'condition_type',
                    'discharge_date', 'assigned_doctor', 'status_badge', 'is_active', 'created_at')
    list_filter  = ('condition_type', 'gender', 'is_active', 'discharge_date')
    search_fields = ('full_name', 'phone_number', 'diagnosis')
    raw_id_fields = ('assigned_doctor', 'added_by')
    readonly_fields = ('checkin_token', 'created_at', 'checkin_link')
    date_hierarchy = 'discharge_date'
    fieldsets = (
        ('Personal Information', {'fields': ('full_name', 'phone_number', 'age', 'gender')}),
        ('Clinical Details',     {'fields': ('condition_type', 'diagnosis', 'discharge_date', 'notes')}),
        ('Assignment',           {'fields': ('assigned_doctor', 'added_by', 'is_active')}),
        ('Check-in Link',        {'fields': ('checkin_token', 'checkin_link'), 'classes': ('collapse',)}),
        ('Timestamps',           {'fields': ('created_at',), 'classes': ('collapse',)}),
    )

    def status_badge(self, obj):
        colours = {'green': '#16a34a', 'yellow': '#ca8a04', 'red': '#dc2626', 'pending': '#94a3b8'}
        labels  = {'green': 'Stable',  'yellow': 'Needs Attention', 'red': 'Critical', 'pending': 'Awaiting'}
        s = obj.latest_status
        return format_html(
            '<span style="background:{};color:#fff;padding:2px 10px;border-radius:999px;font-size:11px;font-weight:600">{}</span>',
            colours.get(s, '#94a3b8'), labels.get(s, s)
        )
    status_badge.short_description = 'Status'

    def checkin_link(self, obj):
        from django.conf import settings
        url = f"{settings.FRONTEND_URL}/checkin/{obj.checkin_token}"
        return format_html('<a href="{}" target="_blank">{}</a>', url, url)
    checkin_link.short_description = 'Check-in URL'


@admin.register(CheckIn)
class CheckInAdmin(admin.ModelAdmin):
    list_display  = ('patient', 'status_badge', 'submitted_at', 'fever', 'pain', 'difficulty_breathing', 'channel')
    list_filter   = ('status', 'channel', 'fever', 'difficulty_breathing', 'submitted_at')
    search_fields = ('patient__full_name', 'additional_notes')
    raw_id_fields = ('patient',)
    readonly_fields = ('status', 'submitted_at')
    date_hierarchy = 'submitted_at'

    def status_badge(self, obj):
        colours = {'green': '#16a34a', 'yellow': '#ca8a04', 'red': '#dc2626'}
        labels  = {'green': 'Stable',  'yellow': 'Needs Attention', 'red': 'Critical'}
        return format_html(
            '<span style="background:{};color:#fff;padding:2px 10px;border-radius:999px;font-size:11px;font-weight:600">{}</span>',
            colours.get(obj.status, '#94a3b8'), labels.get(obj.status, obj.status)
        )
    status_badge.short_description = 'Status'


@admin.register(DoctorAlert)
class DoctorAlertAdmin(admin.ModelAdmin):
    list_display  = ('patient', 'doctor', 'severity_badge', 'is_read', 'created_at')
    list_filter   = ('severity', 'is_read', 'created_at')
    search_fields = ('patient__full_name', 'doctor__first_name', 'doctor__last_name', 'message')
    raw_id_fields = ('patient', 'doctor', 'checkin')
    readonly_fields = ('created_at',)
    date_hierarchy = 'created_at'
    actions = ['mark_read', 'mark_unread']

    def severity_badge(self, obj):
        colour = '#dc2626' if obj.severity == 'red' else '#d97706'
        label  = 'Critical' if obj.severity == 'red' else 'Needs Attention'
        return format_html(
            '<span style="background:{};color:#fff;padding:2px 10px;border-radius:999px;font-size:11px;font-weight:600">{}</span>',
            colour, label
        )
    severity_badge.short_description = 'Severity'

    @admin.action(description='Mark selected alerts as read')
    def mark_read(self, request, queryset):
        queryset.update(is_read=True)

    @admin.action(description='Mark selected alerts as unread')
    def mark_unread(self, request, queryset):
        queryset.update(is_read=False)


@admin.register(SMSLog)
class SMSLogAdmin(admin.ModelAdmin):
    list_display  = ('patient', 'direction', 'status', 'channel', 'short_message', 'sent_at', 'twilio_sid')
    list_filter   = ('direction', 'status', 'channel', 'sent_at')
    search_fields = ('patient__full_name', 'message', 'twilio_sid')
    raw_id_fields = ('patient',)
    readonly_fields = ('sent_at',)
    date_hierarchy = 'sent_at'

    def short_message(self, obj):
        return obj.message[:80] + '…' if len(obj.message) > 80 else obj.message
    short_message.short_description = 'Message'


@admin.register(CheckInSchedule)
class CheckInScheduleAdmin(admin.ModelAdmin):
    list_display  = ('patient', 'is_active', 'frequency', 'send_time_display',
                     'monitoring_duration_days', 'total_sent', 'last_sent_at')
    list_filter   = ('is_active', 'frequency')
    search_fields = ('patient__full_name',)
    raw_id_fields = ('patient',)
    readonly_fields = ('total_sent', 'last_sent_at', 'created_at', 'updated_at')

    def send_time_display(self, obj):
        h = obj.send_hour % 12 or 12
        return f"{h}:{obj.send_minute:02d} {'AM' if obj.send_hour < 12 else 'PM'}"
    send_time_display.short_description = 'Send Time'


@admin.register(SchedulerLog)
class SchedulerLogAdmin(admin.ModelAdmin):
    list_display = ('ran_at', 'patients_checked', 'messages_sent', 'messages_skipped', 'errors')
    list_filter  = ('ran_at',)
    readonly_fields = ('ran_at', 'patients_checked', 'messages_sent', 'messages_skipped', 'errors', 'detail')
    date_hierarchy = 'ran_at'

    def has_add_permission(self, request):    return False
    def has_change_permission(self, request, obj=None): return False

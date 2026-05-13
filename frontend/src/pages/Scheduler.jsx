import { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api'
import { format, parseISO, formatDistanceToNow } from 'date-fns'
import {
  CalendarClock, RefreshCw, Play, Pause, ChevronRight,
  CheckCircle, AlertTriangle, Clock, Activity
} from 'lucide-react'

const FREQ_LABEL = {
  daily: 'Every day',
  every_2_days: 'Every 2 days',
  every_3_days: 'Every 3 days',
  weekly: 'Once a week',
}

const FREQ_OPTIONS = Object.entries(FREQ_LABEL)

const HOUR_OPTIONS = Array.from({ length: 24 }, (_, i) => {
  const h = i % 12 || 12
  const ampm = i < 12 ? 'AM' : 'PM'
  return { value: i, label: `${h}:00 ${ampm}` }
})

function ScheduleRow({ schedule, onEdit }) {
  const navigate = useNavigate()
  const patient = schedule.patient_name

  const nextSend = schedule.next_send
    ? formatDistanceToNow(parseISO(schedule.next_send), { addSuffix: true })
    : '—'

  return (
    <tr style={{ cursor: 'pointer' }}>
      <td onClick={() => navigate(`/patients/${schedule.patient}`)}>
        <div style={{ fontWeight: 500 }}>{patient}</div>
      </td>
      <td>
        <span style={{
          display: 'inline-flex', alignItems: 'center', gap: 5,
          fontSize: 12, fontWeight: 600, padding: '3px 9px', borderRadius: 99,
          background: schedule.is_active ? 'var(--green-bg)' : 'var(--border)',
          color: schedule.is_active ? 'var(--green)' : 'var(--text3)'
        }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: schedule.is_active ? 'var(--green)' : '#94a3b8' }} />
          {schedule.is_active ? 'Active' : 'Paused'}
        </span>
      </td>
      <td style={{ color: 'var(--text2)', fontSize: 13 }}>{FREQ_LABEL[schedule.frequency]}</td>
      <td style={{ color: 'var(--text2)', fontSize: 13 }}>
        {HOUR_OPTIONS.find(h => h.value === schedule.send_hour)?.label || `${schedule.send_hour}:00`}
      </td>
      <td style={{ color: 'var(--text2)', fontSize: 13 }}>
        {schedule.monitoring_duration_days === 0 ? 'Indefinite' : `${schedule.monitoring_duration_days} days`}
      </td>
      <td style={{ color: 'var(--text2)', fontSize: 13 }}>
        {schedule.total_sent}
      </td>
      <td style={{ fontSize: 12, color: schedule.next_send ? 'var(--primary)' : 'var(--text3)' }}>
        {nextSend}
      </td>
      <td style={{ fontSize: 12, color: 'var(--text3)' }}>
        {schedule.last_sent_at
          ? format(parseISO(schedule.last_sent_at), 'MMM d, h:mm a')
          : '—'}
      </td>
      <td>
        <button className="btn btn-secondary btn-sm" onClick={() => onEdit(schedule)}>
          Edit
        </button>
      </td>
    </tr>
  )
}

function EditModal({ schedule, onClose, onSaved }) {
  const [form, setForm] = useState({
    is_active: schedule.is_active,
    frequency: schedule.frequency,
    send_hour: schedule.send_hour,
    monitoring_duration_days: schedule.monitoring_duration_days,
  })
  const [saving, setSaving] = useState(false)
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }))

  const save = async () => {
    setSaving(true)
    try {
      await api.put(`/patients/${schedule.patient}/schedule/`, form)
      onSaved()
    } catch { /* errors shown via alert */ }
    finally { setSaving(false) }
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: 440 }}>
        <div className="modal-header">
          <div className="modal-title">Edit Schedule — {schedule.patient_name}</div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text2)', fontSize: 18 }}>✕</button>
        </div>

        <div className="form-group">
          <label>Status</label>
          <div style={{ display: 'flex', gap: 8 }}>
            {[true, false].map(val => (
              <button key={String(val)} onClick={() => set('is_active', val)} style={{
                flex: 1, padding: '9px', borderRadius: 8, border: '2px solid',
                borderColor: form.is_active === val ? 'var(--primary)' : 'var(--border)',
                background: form.is_active === val ? 'var(--primary-light)' : 'var(--surface)',
                color: form.is_active === val ? 'var(--primary)' : 'var(--text2)',
                fontWeight: form.is_active === val ? 600 : 400, cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, fontSize: 13
              }}>
                {val ? <Play size={13} /> : <Pause size={13} />}
                {val ? 'Active' : 'Paused'}
              </button>
            ))}
          </div>
        </div>

        <div className="form-group">
          <label>Check-in Frequency</label>
          <select className="form-control" value={form.frequency} onChange={e => set('frequency', e.target.value)}>
            {FREQ_OPTIONS.map(([val, label]) => (
              <option key={val} value={val}>{label}</option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label>Time of Day</label>
          <select className="form-control" value={form.send_hour} onChange={e => set('send_hour', parseInt(e.target.value))}>
            {HOUR_OPTIONS.map(h => (
              <option key={h.value} value={h.value}>{h.label}</option>
            ))}
          </select>
          <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 4 }}>
            Messages are sent in the server's configured timezone.
          </div>
        </div>

        <div className="form-group">
          <label>Monitoring Duration</label>
          <select className="form-control"
            value={form.monitoring_duration_days}
            onChange={e => set('monitoring_duration_days', parseInt(e.target.value))}>
            <option value={7}>7 days post-discharge</option>
            <option value={14}>14 days post-discharge</option>
            <option value={30}>30 days post-discharge</option>
            <option value={60}>60 days post-discharge</option>
            <option value={90}>90 days post-discharge</option>
            <option value={0}>Indefinite</option>
          </select>
          <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 4 }}>
            Schedule pauses automatically when this window expires.
          </div>
        </div>

        {schedule.monitoring_ends && (
          <div style={{ background: 'var(--surface2)', borderRadius: 8, padding: '10px 13px', fontSize: 13, color: 'var(--text2)', marginBottom: 16 }}>
            <span style={{ fontWeight: 600 }}>Monitoring ends:</span> {schedule.monitoring_ends}
          </div>
        )}

        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={save} disabled={saving}>
            {saving ? 'Saving…' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function Scheduler() {
  const [schedules, setSchedules] = useState([])
  const [status, setStatus] = useState(null)
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(null)
  const [tab, setTab] = useState('schedules')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [pRes, statusRes, logsRes] = await Promise.all([
        api.get('/patients/'),
        api.get('/scheduler/status/'),
        api.get('/scheduler/logs/'),
      ])
      // Build schedule list from patients that have a schedule attached
      const withSchedules = pRes.data
        .filter(p => p.schedule)
        .map(p => ({ ...p.schedule, patient_name: p.full_name }))
      setSchedules(withSchedules)
      setStatus(statusRes.data)
      setLogs(logsRes.data)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const active = schedules.filter(s => s.is_active).length
  const paused = schedules.filter(s => !s.is_active).length
  const totalSent = schedules.reduce((acc, s) => acc + s.total_sent, 0)

  return (
    <div>
      <div className="page-header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h1 className="page-title">Scheduler</h1>
            <p className="page-subtitle">Automated check-in delivery for all monitored patients</p>
          </div>
          <button className="btn btn-secondary btn-sm" onClick={load}>
            <RefreshCw size={13} /> Refresh
          </button>
        </div>
      </div>

      {/* Summary cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 14, marginBottom: 28 }}>
        {[
          { label: 'Active Schedules', value: active, color: 'var(--green)', bg: 'var(--green-bg)', icon: Play },
          { label: 'Paused', value: paused, color: 'var(--text2)', bg: 'var(--border)', icon: Pause },
          { label: 'Messages Sent', value: totalSent, color: 'var(--primary)', bg: 'var(--primary-light)', icon: Activity },
          {
            label: 'Last Run',
            value: status?.last_run ? formatDistanceToNow(parseISO(status.last_run.ran_at), { addSuffix: true }) : 'Never',
            color: '#7c3aed', bg: '#ede9fe', icon: Clock,
            small: true
          },
        ].map((s, i) => (
          <div key={i} className="stat-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div className={s.small ? '' : 'stat-number'} style={{
                  fontSize: s.small ? 15 : 32, fontWeight: 700, lineHeight: 1.2, color: s.color
                }}>{s.value}</div>
                <div className="stat-label">{s.label}</div>
              </div>
              <div style={{ width: 34, height: 34, borderRadius: 9, background: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <s.icon size={15} color={s.color} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Last run summary */}
      {status?.last_run && (
        <div className="card" style={{ marginBottom: 24, padding: '14px 20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
              <CalendarClock size={14} color="var(--text3)" />
              <span style={{ fontSize: 12.5, color: 'var(--text3)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Last Scheduler Run</span>
            </div>
            <span style={{ fontSize: 13, color: 'var(--text2)' }}>
              {format(parseISO(status.last_run.ran_at), 'MMM d, yyyy · h:mm a')}
            </span>
            <span style={{ fontSize: 12.5, color: 'var(--green)', fontWeight: 600 }}>
              {status.last_run.messages_sent} sent
            </span>
            {status.last_run.errors > 0 && (
              <span style={{ fontSize: 12.5, color: 'var(--red)', fontWeight: 600 }}>
                {status.last_run.errors} errors
              </span>
            )}
          </div>
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', marginBottom: 20 }}>
        {[
          { key: 'schedules', label: 'Patient Schedules' },
          { key: 'logs', label: 'Run History' },
        ].map(t => (
          <button key={t.key} onClick={() => setTab(t.key)} style={{
            padding: '9px 18px', background: 'none', border: 'none', cursor: 'pointer',
            fontWeight: tab === t.key ? 600 : 400, fontSize: 13.5,
            color: tab === t.key ? 'var(--primary)' : 'var(--text2)',
            borderBottom: `2px solid ${tab === t.key ? 'var(--primary)' : 'transparent'}`,
            marginBottom: -1
          }}>{t.label}</button>
        ))}
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 60 }}><div className="spinner" style={{ margin: '0 auto' }} /></div>
      ) : tab === 'schedules' ? (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          {schedules.length === 0 ? (
            <div className="empty-state">
              <CalendarClock size={36} color="var(--text3)" style={{ marginBottom: 12 }} />
              <div>No schedules yet.</div>
              <div style={{ fontSize: 13, marginTop: 4 }}>Enrol a patient to create their first schedule.</div>
            </div>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>Patient</th>
                  <th>Status</th>
                  <th>Frequency</th>
                  <th>Send Time</th>
                  <th>Duration</th>
                  <th>Total Sent</th>
                  <th>Next Send</th>
                  <th>Last Sent</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {schedules.map(s => (
                  <ScheduleRow key={s.id} schedule={s} onEdit={setEditing} />
                ))}
              </tbody>
            </table>
          )}
        </div>
      ) : (
        /* Run History */
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          {logs.length === 0 ? (
            <div className="empty-state">
              <Clock size={36} color="var(--text3)" style={{ marginBottom: 12 }} />
              <div>No scheduler runs recorded yet.</div>
              <div style={{ fontSize: 13, marginTop: 4 }}>The scheduler runs automatically every minute while the server is running.</div>
            </div>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>Run Time</th>
                  <th>Sent</th>
                  <th>Skipped</th>
                  <th>Errors</th>
                  <th>Patients Checked</th>
                  <th>Detail</th>
                </tr>
              </thead>
              <tbody>
                {logs.map(log => (
                  <tr key={log.id}>
                    <td style={{ fontSize: 13 }}>{format(parseISO(log.ran_at), 'MMM d, yyyy · h:mm a')}</td>
                    <td>
                      <span style={{ fontWeight: 600, color: log.messages_sent > 0 ? 'var(--green)' : 'var(--text3)' }}>
                        {log.messages_sent}
                      </span>
                    </td>
                    <td style={{ color: 'var(--text3)', fontSize: 13 }}>{log.messages_skipped}</td>
                    <td>
                      <span style={{ fontWeight: 600, color: log.errors > 0 ? 'var(--red)' : 'var(--text3)' }}>
                        {log.errors}
                      </span>
                    </td>
                    <td style={{ color: 'var(--text2)', fontSize: 13 }}>{log.patients_checked}</td>
                    <td style={{ fontSize: 12, color: 'var(--text2)', maxWidth: 260 }}>
                      {log.detail
                        ? log.detail.split('\n').slice(0, 2).map((line, i) => (
                          <div key={i}>{line}</div>
                        ))
                        : <span style={{ color: 'var(--text3)' }}>—</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {editing && (
        <EditModal
          schedule={editing}
          onClose={() => setEditing(null)}
          onSaved={() => { setEditing(null); load() }}
        />
      )}
    </div>
  )
}

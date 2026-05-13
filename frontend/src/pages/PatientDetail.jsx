import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import api from '../api'
import { ArrowLeft, Send, MessageSquare, ClipboardList, CalendarClock, Play, Pause } from 'lucide-react'
import { format, parseISO, formatDistanceToNow } from 'date-fns'

const BADGE = { green: 'badge-green', yellow: 'badge-yellow', red: 'badge-red', pending: 'badge-gray' }
const STATUS_LABEL = { green: 'Stable', yellow: 'Needs Attention', red: 'Critical', pending: 'Awaiting Check-in' }
const DOT = { green: '#16a34a', yellow: '#ca8a04', red: '#dc2626', pending: '#94a3b8' }

const FREQ_OPTIONS = [
  { value: 'daily', label: 'Every day' },
  { value: 'every_2_days', label: 'Every 2 days' },
  { value: 'every_3_days', label: 'Every 3 days' },
  { value: 'weekly', label: 'Once a week' },
]

const HOUR_OPTIONS = Array.from({ length: 24 }, (_, i) => {
  const h = i % 12 || 12
  const ampm = i < 12 ? 'AM' : 'PM'
  return { value: i, label: `${h}:00 ${ampm}` }
})

const SymptomTag = ({ active, label }) => (
  <div style={{
    display: 'inline-flex', alignItems: 'center', gap: 6,
    padding: '5px 11px', borderRadius: 6, fontSize: 12.5,
    background: active ? 'var(--red-bg)' : 'var(--surface2)',
    color: active ? 'var(--red)' : 'var(--text3)',
    border: `1px solid ${active ? '#fecaca' : 'var(--border)'}`,
    fontWeight: active ? 600 : 400
  }}>
    <span style={{ width: 7, height: 7, borderRadius: '50%', background: active ? 'var(--red)' : '#cbd5e1', flexShrink: 0 }} />
    {label}
  </div>
)

function ScheduleTab({ patientId }) {
  const [schedule, setSchedule] = useState(null)
  const [form, setForm] = useState(null)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const load = () => {
    api.get(`/patients/${patientId}/schedule/`).then(r => {
      setSchedule(r.data)
      setForm({
        is_active: r.data.is_active,
        frequency: r.data.frequency,
        send_hour: r.data.send_hour,
        monitoring_duration_days: r.data.monitoring_duration_days,
      })
    })
  }

  useEffect(() => { load() }, [patientId])

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }))

  const save = async () => {
    setSaving(true); setSaved(false)
    try {
      await api.put(`/patients/${patientId}/schedule/`, form)
      setSaved(true)
      load()
      setTimeout(() => setSaved(false), 3000)
    } finally { setSaving(false) }
  }

  if (!schedule || !form) return (
    <div style={{ textAlign: 'center', padding: 40 }}><div className="spinner" style={{ margin: '0 auto' }} /></div>
  )

  return (
    <div>
      {saved && <div className="alert alert-success" style={{ marginBottom: 20 }}>Schedule updated successfully.</div>}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        {/* Left: settings */}
        <div className="card">
          <div style={{ fontWeight: 600, marginBottom: 16, fontSize: 14 }}>Schedule Settings</div>

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
            <label>Frequency</label>
            <select className="form-control" value={form.frequency} onChange={e => set('frequency', e.target.value)}>
              {FREQ_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>

          <div className="form-group">
            <label>Send Time</label>
            <select className="form-control" value={form.send_hour} onChange={e => set('send_hour', parseInt(e.target.value))}>
              {HOUR_OPTIONS.map(h => <option key={h.value} value={h.value}>{h.label}</option>)}
            </select>
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
          </div>

          <button className="btn btn-primary" onClick={save} disabled={saving} style={{ marginTop: 4 }}>
            {saving ? 'Saving…' : 'Save Changes'}
          </button>
        </div>

        {/* Right: current status */}
        <div className="card">
          <div style={{ fontWeight: 600, marginBottom: 16, fontSize: 14 }}>Schedule Summary</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[
              ['Status', schedule.is_active ? 'Active' : 'Paused'],
              ['Frequency', FREQ_OPTIONS.find(f => f.value === schedule.frequency)?.label],
              ['Send Time', HOUR_OPTIONS.find(h => h.value === schedule.send_hour)?.label],
              ['Total Sent', schedule.total_sent],
              ['Last Sent', schedule.last_sent_at
                ? format(parseISO(schedule.last_sent_at), 'MMM d, yyyy · h:mm a')
                : 'Not sent yet'],
              ['Next Send', schedule.next_send && schedule.is_active
                ? formatDistanceToNow(parseISO(schedule.next_send), { addSuffix: true })
                : schedule.is_active ? '—' : 'Paused'],
              ['Monitoring Ends', schedule.monitoring_ends || 'Indefinite'],
            ].map(([label, val]) => (
              <div key={label} style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border)', paddingBottom: 10 }}>
                <span style={{ fontSize: 12.5, color: 'var(--text3)', fontWeight: 500 }}>{label}</span>
                <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)' }}>{val}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default function PatientDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [patient, setPatient] = useState(null)
  const [checkins, setCheckins] = useState([])
  const [smsLogs, setSmsLogs] = useState([])
  const [tab, setTab] = useState('checkins')
  const [sending, setSending] = useState(false)
  const [sendMsg, setSendMsg] = useState(null)

  const load = () => {
    api.get(`/patients/${id}/`).then(r => setPatient(r.data))
    api.get(`/patients/${id}/checkins/`).then(r => setCheckins(r.data))
    api.get(`/patients/${id}/sms-logs/`).then(r => setSmsLogs(r.data))
  }

  useEffect(() => { load() }, [id])

  const sendCheckin = async () => {
    setSending(true); setSendMsg(null)
    try {
      await api.post(`/patients/${id}/send-checkin/`)
      setSendMsg({ ok: true })
      load()
    } catch { setSendMsg({ ok: false }) }
    finally { setSending(false) }
  }

  if (!patient) return (
    <div style={{ padding: 60, textAlign: 'center' }}>
      <div className="spinner" style={{ margin: '0 auto' }} />
    </div>
  )

  const pStatus = patient.latest_status

  return (
    <div>
      <button onClick={() => navigate('/patients')} className="btn btn-secondary btn-sm" style={{ marginBottom: 20 }}>
        <ArrowLeft size={13} /> Back to Patients
      </button>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12, marginBottom: 24 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            <h1 style={{ fontSize: 22, fontWeight: 700 }}>{patient.full_name}</h1>
            <span className={`badge ${BADGE[pStatus]}`}>
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: DOT[pStatus], display: 'inline-block' }} />
              {STATUS_LABEL[pStatus]}
            </span>
            {patient.schedule?.is_active && (
              <span style={{ fontSize: 11.5, color: 'var(--green)', background: 'var(--green-bg)', padding: '2px 9px', borderRadius: 99, fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                <CalendarClock size={11} /> Scheduled
              </span>
            )}
          </div>
          <div style={{ color: 'var(--text2)', fontSize: 13.5, marginTop: 4 }}>
            {patient.age}y · {patient.gender} · {patient.phone_number}
          </div>
          {patient.added_by_name && (
            <div style={{ color: 'var(--text3)', fontSize: 12, marginTop: 3 }}>
              Enrolled by {patient.added_by_name}
            </div>
          )}
        </div>
        <button className="btn btn-primary" onClick={sendCheckin} disabled={sending}>
          <Send size={13} /> {sending ? 'Sending…' : 'Send Check-in'}
        </button>
      </div>

      {sendMsg && (
        <div className={`alert ${sendMsg.ok ? 'alert-success' : 'alert-error'}`} style={{ marginBottom: 20 }}>
          {sendMsg.ok ? 'Check-in message sent successfully.' : 'Failed to send message. Please try again.'}
        </div>
      )}

      {/* Info Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(190px, 1fr))', gap: 12, marginBottom: 24 }}>
        {[
          ['Diagnosis', patient.diagnosis],
          ['Condition Type', patient.condition_type?.replace('_', ' ')],
          ['Discharge Date', patient.discharge_date],
          ['Assigned Doctor', patient.assigned_doctor_name || '—'],
          ['Total Check-ins', patient.checkin_count],
          ['Last Check-in', patient.last_checkin ? format(parseISO(patient.last_checkin), 'MMM d, yyyy') : '—'],
        ].map(([label, val]) => (
          <div key={label} className="card" style={{ padding: '14px 16px' }}>
            <div style={{ fontSize: 11, color: 'var(--text3)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 5 }}>{label}</div>
            <div style={{ fontWeight: 500, fontSize: 13.5 }}>{val}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', marginBottom: 20 }}>
        {[
          { key: 'checkins', label: 'Check-ins', count: checkins.length, icon: ClipboardList },
          { key: 'sms', label: 'Messages', count: smsLogs.length, icon: MessageSquare },
          { key: 'schedule', label: 'Schedule', count: null, icon: CalendarClock },
        ].map(({ key, label, count, icon: Icon }) => (
          <button key={key} onClick={() => setTab(key)} style={{
            display: 'flex', alignItems: 'center', gap: 7,
            padding: '9px 18px', background: 'none', border: 'none', cursor: 'pointer',
            fontWeight: tab === key ? 600 : 400, fontSize: 13.5,
            color: tab === key ? 'var(--primary)' : 'var(--text2)',
            borderBottom: `2px solid ${tab === key ? 'var(--primary)' : 'transparent'}`,
            marginBottom: -1
          }}>
            <Icon size={14} />
            {label}
            {count !== null && (
              <span style={{
                fontSize: 11, fontWeight: 600, padding: '1px 7px', borderRadius: 99,
                background: tab === key ? 'var(--primary-light)' : 'var(--border)',
                color: tab === key ? 'var(--primary)' : 'var(--text3)'
              }}>{count}</span>
            )}
          </button>
        ))}
      </div>

      {/* Check-ins Tab */}
      {tab === 'checkins' && (
        checkins.length === 0 ? (
          <div className="empty-state card">
            <ClipboardList size={36} color="var(--text3)" style={{ marginBottom: 12 }} />
            <div>No check-ins recorded yet.</div>
            <div style={{ fontSize: 13, marginTop: 4 }}>Send a check-in message to the patient to get started.</div>
          </div>
        ) : checkins.map(c => (
          <div key={c.id} className="card" style={{ marginBottom: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <span className={`badge ${BADGE[c.status]}`}>
                <span style={{ width: 7, height: 7, borderRadius: '50%', background: DOT[c.status], display: 'inline-block' }} />
                {STATUS_LABEL[c.status]}
              </span>
              <div style={{ fontSize: 12, color: 'var(--text3)' }}>
                {format(parseISO(c.submitted_at), 'MMM d, yyyy · h:mm a')}
              </div>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
              <SymptomTag active={c.fever} label="Fever" />
              <SymptomTag active={c.pain} label="Pain" />
              <SymptomTag active={c.difficulty_breathing} label="Breathing Difficulty" />
              <SymptomTag active={c.wound_issues} label="Wound Issues" />
              <SymptomTag active={c.nausea_vomiting} label="Nausea / Vomiting" />
              <SymptomTag active={c.dizziness} label="Dizziness" />
              <SymptomTag active={c.feeling_well} label="Feeling Well" />
            </div>
            {c.additional_notes && (
              <div style={{ marginTop: 12, padding: '9px 13px', background: 'var(--surface2)', borderRadius: 7, fontSize: 13, color: 'var(--text2)', borderLeft: '3px solid var(--border)' }}>
                {c.additional_notes}
              </div>
            )}
          </div>
        ))
      )}

      {/* Messages Tab */}
      {tab === 'sms' && (
        smsLogs.length === 0 ? (
          <div className="empty-state card">
            <MessageSquare size={36} color="var(--text3)" style={{ marginBottom: 12 }} />
            <div>No messages yet.</div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {smsLogs.map(log => (
              <div key={log.id} style={{ display: 'flex', justifyContent: log.direction === 'out' ? 'flex-end' : 'flex-start' }}>
                <div style={{
                  maxWidth: '72%', padding: '10px 14px', borderRadius: 12, fontSize: 13,
                  background: log.direction === 'out' ? 'var(--primary)' : 'var(--surface)',
                  color: log.direction === 'out' ? '#fff' : 'var(--text)',
                  border: log.direction === 'in' ? '1px solid var(--border)' : 'none',
                  borderBottomRightRadius: log.direction === 'out' ? 3 : 12,
                  borderBottomLeftRadius: log.direction === 'in' ? 3 : 12,
                  lineHeight: 1.55, whiteSpace: 'pre-line', boxShadow: 'var(--shadow)'
                }}>
                  {log.message}
                  <div style={{ fontSize: 11, opacity: 0.6, marginTop: 5, textAlign: 'right' }}>
                    {format(parseISO(log.sent_at), 'MMM d · h:mm a')}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )
      )}

      {/* Schedule Tab */}
      {tab === 'schedule' && <ScheduleTab patientId={id} />}
    </div>
  )
}

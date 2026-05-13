import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api'
import { Users, UserCog, AlertTriangle, CheckCircle, Clock, Bell, CalendarClock } from 'lucide-react'
import { format, parseISO } from 'date-fns'

const DOT_COLOR = { green: '#16a34a', yellow: '#ca8a04', red: '#dc2626', pending: '#94a3b8' }
const BADGE     = { green: 'badge-green', yellow: 'badge-yellow', red: 'badge-red', pending: 'badge-gray' }
const STATUS_LABEL = { green: 'Stable', yellow: 'Needs Attention', red: 'Critical', pending: 'Awaiting' }

export default function Dashboard() {
  const navigate = useNavigate()
  const [stats,    setStats]    = useState(null)
  const [patients, setPatients] = useState([])
  const [alerts,   setAlerts]   = useState([])
  const [user,     setUser]     = useState(null)

  useEffect(() => {
    api.get('/me/').then(r => setUser(r.data))
    api.get('/stats/').then(r => setStats(r.data))
    api.get('/patients/').then(r => setPatients(r.data.slice(0, 8)))
    api.get('/alerts/').then(r => setAlerts(r.data.filter(a => !a.is_read).slice(0, 5)))
  }, [])

  const greeting = () => {
    if (!user) return 'Dashboard'
    const h = new Date().getHours()
    const t = h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening'
    return user.is_staff ? 'System Overview' : `${t}, Dr. ${user.first_name}`
  }

  const statCards = stats ? [
    { label: 'Total Patients',     value: stats.total_patients, icon: Users,          color: 'var(--primary)', bg: 'var(--primary-light)' },
    { label: 'Stable',             value: stats.green,          icon: CheckCircle,    color: 'var(--green)',   bg: 'var(--green-bg)'  },
    { label: 'Needs Attention',    value: stats.yellow,         icon: AlertTriangle,  color: 'var(--yellow)',  bg: 'var(--yellow-bg)' },
    { label: 'Critical',           value: stats.red,            icon: AlertTriangle,  color: 'var(--red)',     bg: 'var(--red-bg)'    },
    { label: 'Awaiting Check-in',  value: stats.pending,        icon: Clock,          color: '#64748b',        bg: '#f1f5f9'          },
    ...(stats.total_doctors !== undefined
      ? [{ label: 'Doctors', value: stats.total_doctors, icon: UserCog, color: '#7c3aed', bg: '#ede9fe' }]
      : []),
    ...(stats.active_schedules !== undefined
      ? [{ label: 'Active Schedules', value: stats.active_schedules, icon: CalendarClock, color: '#0891b2', bg: '#ecfeff' }]
      : []),
  ] : []

  return (
    <div>
      {/* Header */}
      <div className="page-header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h1 className="page-title">{greeting()}</h1>
            <p className="page-subtitle">Post-discharge patient monitoring overview</p>
          </div>
          <div style={{ fontSize: 12, color: 'var(--text3)', textAlign: 'right' }}>
            {format(new Date(), 'EEEE, MMMM d, yyyy')}
          </div>
        </div>
      </div>

      {/* Unread alerts banner */}
      {stats?.unread_alerts > 0 && (
        <div onClick={() => navigate('/alerts')} style={{
          background: 'var(--red-bg)', border: '1px solid var(--red-mid)',
          borderRadius: 12, padding: '13px 18px', marginBottom: 20,
          display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer',
          transition: 'box-shadow 0.15s',
        }}
          onMouseEnter={e => e.currentTarget.style.boxShadow = 'var(--shadow)'}
          onMouseLeave={e => e.currentTarget.style.boxShadow = 'none'}
        >
          <div style={{
            width: 34, height: 34, borderRadius: 9, background: 'var(--red-mid)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>
            <Bell size={16} color="var(--red)" />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--red)' }}>
              {stats.unread_alerts} unread alert{stats.unread_alerts !== 1 ? 's' : ''}
            </div>
            <div style={{ fontSize: 12.5, color: 'var(--text2)', marginTop: 1 }}>
              Patient{stats.unread_alerts !== 1 ? 's have' : ' has'} reported symptoms that need attention.
            </div>
          </div>
          <div style={{ fontSize: 12.5, color: 'var(--red)', fontWeight: 500 }}>View →</div>
        </div>
      )}

      {/* Stat cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(160px,1fr))', gap: 14, marginBottom: 28 }}>
        {statCards.map((s, i) => (
          <div key={i} className="stat-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div className="stat-number" style={{ color: s.color }}>{s.value ?? '—'}</div>
                <div className="stat-label">{s.label}</div>
              </div>
              <div style={{
                width: 36, height: 36, borderRadius: 9, background: s.bg,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <s.icon size={17} color={s.color} />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: alerts.length > 0 ? '1fr 340px' : '1fr', gap: 20, alignItems: 'start' }}>

        {/* Recent patients */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
            <div style={{ fontWeight: 600, fontSize: 15 }}>Recent Patients</div>
            <button onClick={() => navigate('/patients')} style={{
              background: 'none', border: 'none', cursor: 'pointer',
              fontSize: 12.5, color: 'var(--primary)', fontWeight: 500,
            }}>View all →</button>
          </div>
          {patients.length === 0 ? (
            <div className="empty-state">
              <Users size={36} color="var(--text3)" style={{ marginBottom: 10 }} />
              <div>No patients enrolled yet</div>
            </div>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>Patient</th>
                  <th>Condition</th>
                  <th>Doctor</th>
                  <th>Status</th>
                  <th>Check-ins</th>
                </tr>
              </thead>
              <tbody>
                {patients.map(p => (
                  <tr key={p.id} style={{ cursor: 'pointer' }} onClick={() => navigate(`/patients/${p.id}`)}>
                    <td>
                      <div style={{ fontWeight: 500 }}>{p.full_name}</div>
                      <div style={{ fontSize: 12, color: 'var(--text3)' }}>{p.phone_number}</div>
                    </td>
                    <td style={{ color: 'var(--text2)', fontSize: 13 }}>{p.condition_type?.replace('_', ' ')}</td>
                    <td style={{ color: 'var(--text2)', fontSize: 13 }}>{p.assigned_doctor_name || '—'}</td>
                    <td>
                      <span className={`badge ${BADGE[p.latest_status] || 'badge-gray'}`}>
                        <span style={{ width: 6, height: 6, borderRadius: '50%', background: DOT_COLOR[p.latest_status], display: 'inline-block' }} />
                        {STATUS_LABEL[p.latest_status] || p.latest_status}
                      </span>
                    </td>
                    <td style={{ color: 'var(--text2)' }}>{p.checkin_count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Recent unread alerts sidebar */}
        {alerts.length > 0 && (
          <div className="card" style={{ padding: '18px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <div style={{ fontWeight: 600, fontSize: 14 }}>Recent Alerts</div>
              <button onClick={() => navigate('/alerts')} style={{
                background: 'none', border: 'none', cursor: 'pointer',
                fontSize: 12, color: 'var(--primary)', fontWeight: 500,
              }}>View all →</button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
              {alerts.map(a => (
                <div key={a.id}
                  onClick={() => navigate(`/patients/${a.patient_id}`)}
                  style={{
                    padding: '11px 13px', borderRadius: 10, cursor: 'pointer',
                    background: a.severity === 'red' ? 'var(--red-bg)' : 'var(--yellow-bg)',
                    border: `1px solid ${a.severity === 'red' ? 'var(--red-mid)' : 'var(--yellow-mid)'}`,
                  }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 3 }}>
                    <span style={{
                      width: 7, height: 7, borderRadius: '50%', flexShrink: 0,
                      background: a.severity === 'red' ? 'var(--red)' : 'var(--yellow)',
                    }} />
                    <span style={{ fontWeight: 600, fontSize: 13, color: 'var(--text)' }}>{a.patient_name}</span>
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text2)', lineHeight: 1.5 }}>
                    {a.message.length > 80 ? a.message.slice(0, 80) + '…' : a.message}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 4 }}>
                    {format(parseISO(a.created_at), 'MMM d · h:mm a')}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

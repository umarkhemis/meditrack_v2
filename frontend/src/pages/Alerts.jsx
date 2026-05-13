import { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api'
import { format, parseISO } from 'date-fns'
import { Bell, CheckCheck, AlertTriangle, XCircle, ChevronRight } from 'lucide-react'

const SEVERITY = {
  red:    { label: 'Critical',       badge: 'badge-red',    icon: XCircle,       color: 'var(--red)'    },
  yellow: { label: 'Needs Attention', badge: 'badge-yellow', icon: AlertTriangle, color: 'var(--yellow)' },
}

export default function Alerts() {
  const navigate = useNavigate()
  const [alerts,  setAlerts]  = useState([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(() => {
    setLoading(true)
    api.get('/alerts/').then(r => {
      setAlerts(r.data)
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [])

  useEffect(() => { load() }, [load])

  const markRead = async (id, e) => {
    e.stopPropagation()
    await api.post(`/alerts/${id}/read/`)
    setAlerts(prev => prev.map(a => a.id === id ? { ...a, is_read: true } : a))
  }

  const markAllRead = async () => {
    await api.post('/alerts/read-all/')
    setAlerts(prev => prev.map(a => ({ ...a, is_read: true })))
  }

  const unread = alerts.filter(a => !a.is_read).length

  return (
    <div>
      <div className="page-header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <h1 className="page-title">Alerts</h1>
              {unread > 0 && (
                <span style={{
                  background: 'var(--red)', color: '#fff', fontSize: 12, fontWeight: 700,
                  padding: '2px 10px', borderRadius: 99,
                }}>
                  {unread} unread
                </span>
              )}
            </div>
            <p className="page-subtitle">Patient check-in alerts that need your attention</p>
          </div>
          {unread > 0 && (
            <button className="btn btn-secondary btn-sm" onClick={markAllRead}>
              <CheckCheck size={13} /> Mark all read
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 60 }}>
          <div className="spinner" style={{ margin: '0 auto' }} />
        </div>
      ) : alerts.length === 0 ? (
        <div className="empty-state card">
          <Bell size={40} color="var(--text3)" style={{ marginBottom: 14 }} />
          <div style={{ fontSize: 15, fontWeight: 500 }}>No alerts</div>
          <div style={{ fontSize: 13, marginTop: 4 }}>
            Alerts appear here when patients report symptoms that need attention.
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {alerts.map(alert => {
            const cfg = SEVERITY[alert.severity] || SEVERITY.yellow
            const Icon = cfg.icon
            return (
              <div key={alert.id}
                onClick={() => navigate(`/patients/${alert.patient_id}`)}
                style={{
                  background: alert.is_read ? 'var(--surface)' : (alert.severity === 'red' ? 'var(--red-bg)' : 'var(--yellow-bg)'),
                  border: `1px solid ${alert.is_read ? 'var(--border)' : (alert.severity === 'red' ? 'var(--red-mid)' : 'var(--yellow-mid)')}`,
                  borderRadius: 14, padding: '16px 18px', cursor: 'pointer',
                  transition: 'box-shadow 0.15s, transform 0.15s',
                  opacity: alert.is_read ? 0.7 : 1,
                }}
                onMouseEnter={e => { e.currentTarget.style.boxShadow = 'var(--shadow-md)'; e.currentTarget.style.transform = 'translateY(-1px)' }}
                onMouseLeave={e => { e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.transform = 'none' }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
                  {/* Icon */}
                  <div style={{
                    width: 38, height: 38, borderRadius: 10, flexShrink: 0,
                    background: alert.is_read ? 'var(--bg2)' : (alert.severity === 'red' ? 'var(--red-mid)' : 'var(--yellow-mid)'),
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <Icon size={18} color={alert.is_read ? 'var(--text3)' : cfg.color} />
                  </div>

                  {/* Content */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 4 }}>
                      <span style={{ fontWeight: 600, fontSize: 14.5, color: 'var(--text)' }}>
                        {alert.patient_name}
                      </span>
                      <span className={`badge ${cfg.badge}`}>
                        <span style={{ width: 6, height: 6, borderRadius: '50%', background: cfg.color, display: 'inline-block' }} />
                        {cfg.label}
                      </span>
                      {!alert.is_read && (
                        <span style={{
                          width: 8, height: 8, borderRadius: '50%',
                          background: alert.severity === 'red' ? 'var(--red)' : 'var(--yellow)',
                          display: 'inline-block', flexShrink: 0,
                        }} />
                      )}
                    </div>

                    <p style={{ fontSize: 13.5, color: 'var(--text2)', lineHeight: 1.6, margin: '0 0 8px' }}>
                      {alert.message}
                    </p>

                    {/* Symptoms */}
                    {alert.checkin_symptoms?.length > 0 && (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginBottom: 8 }}>
                        {alert.checkin_symptoms.map(s => (
                          <span key={s} style={{
                            fontSize: 11.5, fontWeight: 500, padding: '2px 9px', borderRadius: 6,
                            background: alert.is_read ? 'var(--bg2)' : 'rgba(0,0,0,0.06)',
                            color: 'var(--text2)', border: '1px solid var(--border)',
                          }}>{s}</span>
                        ))}
                      </div>
                    )}

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: 12, color: 'var(--text3)' }}>
                        {format(parseISO(alert.created_at), 'MMM d, yyyy · h:mm a')}
                        {alert.doctor_name && ` · ${alert.doctor_name}`}
                      </span>
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                        {!alert.is_read && (
                          <button
                            className="btn btn-secondary btn-xs"
                            onClick={e => markRead(alert.id, e)}
                            style={{ fontSize: 11.5 }}
                          >
                            Mark read
                          </button>
                        )}
                        <ChevronRight size={14} color="var(--text3)" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useEffect, useState, useCallback } from 'react'
import api from '../api'
import {
  LayoutDashboard, Users, UserCog, MessageSquare,
  LogOut, ChevronRight, Activity, CalendarClock, Bell, X
} from 'lucide-react'

export default function Layout({ children }) {
  const location = useLocation()
  const navigate  = useNavigate()
  const [user, setUser]               = useState(null)
  const [open, setOpen]               = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => { api.get('/me/').then(r => setUser(r.data)) }, [])
  useEffect(() => { setOpen(false) }, [location.pathname])

  // Poll unread alert count every 30 seconds
  const fetchCount = useCallback(() => {
    api.get('/alerts/count/').then(r => setUnreadCount(r.data.count)).catch(() => {})
  }, [])

  useEffect(() => {
    fetchCount()
    const id = setInterval(fetchCount, 30000)
    return () => clearInterval(id)
  }, [fetchCount])

  const logout = () => { localStorage.removeItem('access_token'); navigate('/login') }

  const links = [
    { to: '/dashboard',  icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/patients',   icon: Users,            label: 'Patients' },
    ...(user?.is_staff ? [{ to: '/doctors', icon: UserCog, label: 'Doctors' }] : []),
    { to: '/sms',        icon: MessageSquare,    label: 'Messages' },
    { to: '/scheduler',  icon: CalendarClock,    label: 'Scheduler' },
    { to: '/alerts',     icon: Bell,             label: 'Alerts', badge: unreadCount },
  ]

  const isActive = to => to === '/dashboard'
    ? location.pathname === to
    : location.pathname.startsWith(to)

  const Sidebar = () => (
    <aside style={{
      width: 240,
      background: 'linear-gradient(180deg,#0f172a 0%,#1e293b 100%)',
      display: 'flex', flexDirection: 'column', flexShrink: 0,
      borderRight: '1px solid rgba(255,255,255,0.06)',
    }}>
      {/* Logo */}
      <div style={{ padding: '24px 20px 20px', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10, flexShrink: 0,
            background: 'linear-gradient(135deg,#3b82f6,#2563eb)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 4px 12px rgba(37,99,235,0.4)',
          }}>
            <Activity size={18} color="#fff" />
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 15.5, color: '#f1f5f9', letterSpacing: '-0.02em' }}>MediTrack</div>
            <div style={{ fontSize: 10.5, color: '#64748b', fontWeight: 500, letterSpacing: '0.03em' }}>CARE MONITORING</div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: '14px 10px' }}>
        {links.map(({ to, icon: Icon, label, badge }) => {
          const active = isActive(to)
          return (
            <Link key={to} to={to} style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '9px 12px', borderRadius: 8, marginBottom: 2,
              color: active ? '#fff' : '#64748b',
              background: active ? 'rgba(37,99,235,0.2)' : 'transparent',
              fontWeight: active ? 600 : 400, fontSize: 13.5,
              transition: 'all 0.15s', textDecoration: 'none',
              border: `1px solid ${active ? 'rgba(37,99,235,0.3)' : 'transparent'}`,
            }}>
              <Icon size={16} style={{ opacity: active ? 1 : 0.7, flexShrink: 0 }} />
              <span style={{ flex: 1 }}>{label}</span>
              {/* Unread badge */}
              {badge > 0 && (
                <span style={{
                  background: '#dc2626', color: '#fff', fontSize: 10,
                  fontWeight: 700, padding: '1px 6px', borderRadius: 99,
                  minWidth: 18, textAlign: 'center', lineHeight: '16px',
                }}>
                  {badge > 99 ? '99+' : badge}
                </span>
              )}
              {active && !badge && <ChevronRight size={13} style={{ opacity: 0.5 }} />}
            </Link>
          )
        })}
      </nav>

      {/* User */}
      {user && (
        <div style={{ padding: '14px 16px', borderTop: '1px solid rgba(255,255,255,0.07)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 34, height: 34, borderRadius: 99, flexShrink: 0,
              background: 'linear-gradient(135deg,#3b82f6,#8b5cf6)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 13, fontWeight: 700, color: '#fff',
            }}>
              {(user.first_name?.[0] || user.username?.[0] || 'U').toUpperCase()}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#f1f5f9', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {user.is_staff ? 'Admin' : `Dr. ${user.first_name} ${user.last_name}`}
              </div>
              <div style={{ fontSize: 11, color: '#475569' }}>{user.username}</div>
            </div>
            <button onClick={logout} title="Sign out" style={{
              background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 7, padding: 6, cursor: 'pointer', color: '#64748b',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>
              <LogOut size={14} />
            </button>
          </div>
        </div>
      )}
    </aside>
  )

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg)' }}>
      {/* Desktop sidebar — fixed */}
      <div style={{ position: 'fixed', top: 0, left: 0, height: '100vh', zIndex: 100 }}>
        <Sidebar />
      </div>

      {/* Mobile drawer overlay */}
      {open && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 200, display: 'flex' }}>
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)' }} onClick={() => setOpen(false)} />
          <div style={{ position: 'relative', zIndex: 1, display: 'flex' }}>
            <Sidebar />
            <button onClick={() => setOpen(false)} style={{
              position: 'absolute', top: 12, right: -44,
              background: 'rgba(0,0,0,0.5)', border: 'none', borderRadius: 8,
              color: '#fff', padding: 8, cursor: 'pointer',
            }}>
              <X size={18} />
            </button>
          </div>
        </div>
      )}

      {/* Main content */}
      <main style={{ marginLeft: 240, flex: 1, minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        <div style={{ flex: 1, padding: '32px 36px', maxWidth: 1320 }}>
          {children}
        </div>
      </main>
    </div>
  )
}

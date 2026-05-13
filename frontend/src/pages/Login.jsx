import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import { Lock, User, Eye, EyeOff, Activity, Shield, Bell, BarChart2 } from 'lucide-react'

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

const FEATURES = [
  { icon: Activity,  title: 'Automated Check-ins',  desc: 'Daily SMS check-ins sent to patients automatically on schedule.' },
  { icon: Bell,      title: 'Instant Alerts',        desc: 'Doctors are notified the moment a patient reports critical symptoms.' },
  { icon: BarChart2, title: 'Recovery Dashboard',    desc: 'Track every patient\'s recovery status in one clear view.' },
  { icon: Shield,    title: 'Secure & Private',       desc: 'All patient data is encrypted and access-controlled by role.' },
]

export default function Login() {
  const navigate  = useNavigate()
  const [form,    setForm]    = useState({ username: '', password: '' })
  const [showPw,  setShowPw]  = useState(false)
  const [error,   setError]   = useState('')
  const [loading, setLoading] = useState(false)
  const [focused, setFocused] = useState('')

  const submit = async e => {
    e.preventDefault()
    setLoading(true); setError('')
    try {
      const r = await axios.post(`${BASE_URL}/api/auth/login/`, form)
      localStorage.setItem('access_token', r.data.access)
      navigate('/dashboard')
    } catch {
      setError('Invalid username or password. Please try again.')
    } finally { setLoading(false) }
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', fontFamily: 'Inter, sans-serif' }}>

      {/* ── LEFT PANEL ─────────────────────────────────────────── */}
      <div style={{
        flex: '0 0 46%',
        background: 'linear-gradient(160deg, #0f172a 0%, #1e3a5f 60%, #0f2d4a 100%)',
        display: 'flex', flexDirection: 'column',
        padding: '48px 52px',
        position: 'relative', overflow: 'hidden',
      }}>
        {/* Decorative circles */}
        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
          {[
            { w: 420, h: 420, top: '-10%', left: '-8%',  opacity: 0.07 },
            { w: 300, h: 300, top: '55%',  left: '60%',  opacity: 0.05 },
            { w: 200, h: 200, top: '30%',  left: '-5%',  opacity: 0.04 },
            { w: 500, h: 500, top: '70%',  left: '-20%', opacity: 0.03 },
          ].map((c, i) => (
            <div key={i} style={{
              position: 'absolute', width: c.w, height: c.h, borderRadius: '50%',
              border: `1.5px solid rgba(99,179,237,${c.opacity})`,
              top: c.top, left: c.left,
            }} />
          ))}
          {/* Glow blob */}
          <div style={{
            position: 'absolute', width: 360, height: 360,
            borderRadius: '50%', top: '15%', left: '20%',
            background: 'radial-gradient(circle, rgba(37,99,235,0.18) 0%, transparent 70%)',
            filter: 'blur(40px)',
          }} />
        </div>

        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 'auto', position: 'relative' }}>
          <div style={{
            width: 42, height: 42, borderRadius: 12,
            background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 8px 24px rgba(37,99,235,0.5)',
            flexShrink: 0,
          }}>
            <Activity size={20} color="#fff" strokeWidth={2.2} />
          </div>
          <div>
            <div style={{ color: '#f1f5f9', fontWeight: 800, fontSize: 18, letterSpacing: '-0.02em' }}>MediTrack</div>
            <div style={{ color: '#475569', fontSize: 10.5, letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 500 }}>Care Monitoring</div>
          </div>
        </div>

        {/* Hero text */}
        <div style={{ position: 'relative', margin: '52px 0 48px' }}>
          <div style={{
            display: 'inline-block', fontSize: 10.5, fontWeight: 600,
            color: '#60a5fa', letterSpacing: '0.12em', textTransform: 'uppercase',
            background: 'rgba(37,99,235,0.15)', border: '1px solid rgba(37,99,235,0.3)',
            borderRadius: 99, padding: '4px 12px', marginBottom: 18,
          }}>
            Post-Discharge Patient Monitoring
          </div>
          <h1 style={{
            color: '#f1f5f9', fontSize: 34, fontWeight: 800,
            lineHeight: 1.2, letterSpacing: '-0.03em', marginBottom: 14,
          }}>
            Better care<br />
            <span style={{ color: '#60a5fa' }}>after discharge.</span>
          </h1>
          <p style={{ color: '#64748b', fontSize: 14.5, lineHeight: 1.75, maxWidth: 340 }}>
            A system built for healthcare teams to monitor patient recovery,
            automate follow-ups, and respond to critical symptoms - all from one dashboard.
          </p>
        </div>

        {/* Features */}
        <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', gap: 18 }}>
          {FEATURES.map(({ icon: Icon, title, desc }) => (
            <div key={title} style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
              <div style={{
                width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                background: 'rgba(37,99,235,0.18)',
                border: '1px solid rgba(37,99,235,0.3)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Icon size={16} color="#60a5fa" strokeWidth={1.8} />
              </div>
              <div>
                <div style={{ color: '#e2e8f0', fontSize: 13.5, fontWeight: 600, marginBottom: 2 }}>{title}</div>
                <div style={{ color: '#475569', fontSize: 12.5, lineHeight: 1.6 }}>{desc}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Footer line */}
        <div style={{ position: 'relative', marginTop: 48, fontSize: 11.5, color: '#334155' }}>
          Secure · Encrypted · Role-based access
        </div>
      </div>

      {/* ── RIGHT PANEL ────────────────────────────────────────── */}
      <div style={{
        flex: 1,
        background: '#f8fafc',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '48px 40px',
      }}>
        <div style={{ width: '100%', maxWidth: 400 }}>

          {/* Heading */}
          <div style={{ marginBottom: 36 }}>
            <h2 style={{
              fontSize: 26, fontWeight: 800, color: '#0f172a',
              letterSpacing: '-0.03em', marginBottom: 6,
            }}>
              Welcome back
            </h2>
            <p style={{ color: '#64748b', fontSize: 14 }}>
              Sign in to your MediTrack account
            </p>
          </div>

          {/* Error */}
          {error && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 10,
              background: '#fef2f2', border: '1px solid #fecaca',
              borderRadius: 10, padding: '12px 14px',
              color: '#dc2626', fontSize: 13.5, marginBottom: 22,
              animation: 'fadeIn 0.2s ease',
            }}>
              <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#dc2626', flexShrink: 0 }} />
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={submit}>

            {/* Username */}
            <div style={{ marginBottom: 18 }}>
              <label style={{
                display: 'block', fontSize: 12.5, fontWeight: 600,
                color: '#374151', marginBottom: 7, letterSpacing: '0.01em',
              }}>
                Username
              </label>
              <div style={{ position: 'relative' }}>
                <User size={15} style={{
                  position: 'absolute', left: 13, top: '50%',
                  transform: 'translateY(-50%)',
                  color: focused === 'username' ? '#2563eb' : '#9ca3af',
                  transition: 'color 0.15s',
                }} />
                <input
                  required autoFocus
                  value={form.username}
                  onChange={e => setForm(p => ({ ...p, username: e.target.value }))}
                  onFocus={() => setFocused('username')}
                  onBlur={() => setFocused('')}
                  placeholder="Enter your username"
                  style={{
                    width: '100%', padding: '12px 14px 12px 40px',
                    fontSize: 14, border: '1.5px solid',
                    borderColor: focused === 'username' ? '#2563eb' : '#e5e7eb',
                    borderRadius: 10, outline: 'none',
                    background: focused === 'username' ? '#fff' : '#fff',
                    color: '#0f172a', transition: 'border-color 0.15s, box-shadow 0.15s',
                    boxShadow: focused === 'username' ? '0 0 0 3px rgba(37,99,235,0.1)' : '0 1px 2px rgba(0,0,0,0.04)',
                  }}
                />
              </div>
            </div>

            {/* Password */}
            <div style={{ marginBottom: 28 }}>
              <label style={{
                display: 'block', fontSize: 12.5, fontWeight: 600,
                color: '#374151', marginBottom: 7, letterSpacing: '0.01em',
              }}>
                Password
              </label>
              <div style={{ position: 'relative' }}>
                <Lock size={15} style={{
                  position: 'absolute', left: 13, top: '50%',
                  transform: 'translateY(-50%)',
                  color: focused === 'password' ? '#2563eb' : '#9ca3af',
                  transition: 'color 0.15s',
                }} />
                <input
                  required
                  type={showPw ? 'text' : 'password'}
                  value={form.password}
                  onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                  onFocus={() => setFocused('password')}
                  onBlur={() => setFocused('')}
                  placeholder="Enter your password"
                  style={{
                    width: '100%', padding: '12px 44px 12px 40px',
                    fontSize: 14, border: '1.5px solid',
                    borderColor: focused === 'password' ? '#2563eb' : '#e5e7eb',
                    borderRadius: 10, outline: 'none',
                    background: '#fff', color: '#0f172a',
                    transition: 'border-color 0.15s, box-shadow 0.15s',
                    boxShadow: focused === 'password' ? '0 0 0 3px rgba(37,99,235,0.1)' : '0 1px 2px rgba(0,0,0,0.04)',
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPw(v => !v)}
                  style={{
                    position: 'absolute', right: 13, top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none', border: 'none', cursor: 'pointer',
                    color: '#9ca3af', padding: 2,
                    display: 'flex', alignItems: 'center',
                    transition: 'color 0.15s',
                  }}
                  onMouseEnter={e => e.currentTarget.style.color = '#4b5563'}
                  onMouseLeave={e => e.currentTarget.style.color = '#9ca3af'}
                >
                  {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%', padding: '13px',
                background: loading ? '#93c5fd' : 'linear-gradient(135deg, #3b82f6, #2563eb)',
                color: '#fff', border: 'none', borderRadius: 10,
                fontSize: 14.5, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 9,
                boxShadow: loading ? 'none' : '0 4px 14px rgba(37,99,235,0.35)',
                transition: 'all 0.15s cubic-bezier(0.4,0,0.2,1)',
                letterSpacing: '-0.01em',
              }}
              onMouseEnter={e => { if (!loading) { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(37,99,235,0.4)' } }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = loading ? 'none' : '0 4px 14px rgba(37,99,235,0.35)' }}
            >
              {loading ? (
                <>
                  <div style={{
                    width: 16, height: 16, borderRadius: '50%',
                    border: '2px solid rgba(255,255,255,0.3)',
                    borderTopColor: '#fff',
                    animation: 'spin 0.65s linear infinite',
                    flexShrink: 0,
                  }} />
                  Signing in…
                </>
              ) : 'Sign In'}
            </button>
          </form>

          {/* Divider */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 12,
            margin: '28px 0 20px',
          }}>
            <div style={{ flex: 1, height: 1, background: '#e5e7eb' }} />
            <span style={{ color: '#9ca3af', fontSize: 12, fontWeight: 500 }}>Access restricted</span>
            <div style={{ flex: 1, height: 1, background: '#e5e7eb' }} />
          </div>

          {/* Info note */}
          <div style={{
            background: '#fff', border: '1px solid #e5e7eb',
            borderRadius: 12, padding: '14px 16px',
            display: 'flex', alignItems: 'flex-start', gap: 11,
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
          }}>
            <Shield size={16} color="#2563eb" style={{ flexShrink: 0, marginTop: 1 }} />
            <div>
              <div style={{ fontSize: 12.5, fontWeight: 600, color: '#374151', marginBottom: 2 }}>
                Authorised personnel only
              </div>
              <div style={{ fontSize: 12, color: '#6b7280', lineHeight: 1.6 }}>
                This system is for registered healthcare providers. If you need access, contact your system administrator.
              </div>
            </div>
          </div>

          {/* Footer */}
          <div style={{ marginTop: 32, textAlign: 'center', fontSize: 12, color: '#9ca3af' }}>
            MediTrack &nbsp;·&nbsp; Secure Healthcare Monitoring
          </div>
        </div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(-4px); } to { opacity: 1; transform: translateY(0); } }
        @media (max-width: 768px) {
          .login-left { display: none !important; }
        }
      `}</style>
    </div>
  )
}

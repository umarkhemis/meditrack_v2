import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import axios from 'axios'
import { Activity, CheckCircle, AlertTriangle, XCircle } from 'lucide-react'

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

const SYMPTOMS = [
  { key: 'fever',               label: 'Fever',               desc: 'High temperature or feeling hot/feverish',            icon: '🌡️' },
  { key: 'pain',                label: 'Pain',                desc: 'Pain or significant discomfort anywhere in your body', icon: '⚡' },
  { key: 'difficulty_breathing',label: 'Breathing Difficulty',desc: 'Shortness of breath or trouble breathing normally',    icon: '🫁' },
  { key: 'wound_issues',        label: 'Wound Issues',        desc: 'Redness, swelling, or problems at surgical site',      icon: '🩹' },
  { key: 'nausea_vomiting',     label: 'Nausea or Vomiting',  desc: 'Feeling sick, nausea, or vomiting',                    icon: '🤢' },
  { key: 'dizziness',           label: 'Dizziness',           desc: 'Feeling faint, dizzy, or unsteady',                    icon: '💫' },
  { key: 'feeling_well',        label: 'Feeling Well',        desc: 'Generally recovering and feeling okay today',          icon: '✅' },
]

const RESULT_CONFIG = {
  green: {
    icon: <CheckCircle size={56} color="#16a34a" />,
    title: 'Response recorded.',
    subtitle: 'Thank you for checking in.',
    message: 'Your care team has received your report and will continue monitoring your recovery. Keep following your prescribed care plan.',
    bg: '#f0fdf4', border: '#bbf7d0', titleColor: '#15803d',
  },
  yellow: {
    icon: <AlertTriangle size={56} color="#d97706" />,
    title: 'Symptoms noted.',
    subtitle: 'Your care team has been notified.',
    message: 'A member of your care team will follow up with you soon. In the meantime, rest and continue your prescribed medication.',
    bg: '#fffbeb', border: '#fde68a', titleColor: '#b45309',
  },
  red: {
    icon: <XCircle size={56} color="#dc2626" />,
    title: 'Your doctor has been urgently notified.',
    subtitle: 'Please do not ignore this.',
    message: 'The symptoms you reported require prompt medical attention. Your doctor has been alerted. If your condition worsens immediately, go to the nearest hospital or call emergency services.',
    bg: '#fef2f2', border: '#fecaca', titleColor: '#b91c1c',
  },
}

export default function CheckInPublic() {
  const { token } = useParams()
  const [patientInfo, setPatientInfo] = useState(null)
  const [notFound, setNotFound] = useState(false)
  const [form, setForm] = useState({
    fever: false, pain: false, difficulty_breathing: false,
    wound_issues: false, nausea_vomiting: false, dizziness: false,
    feeling_well: false, additional_notes: ''
  })
  const [submitted, setSubmitted] = useState(false)
  const [resultStatus, setResultStatus] = useState(null)
  const [loading, setLoading] = useState(false)
  const [submitError, setSubmitError] = useState('')

  useEffect(() => {
    axios.get(`${BASE_URL}/api/checkin/${token}/`)
      .then(r => setPatientInfo(r.data))
      .catch(() => setNotFound(true))
  }, [token])

  const toggle = key => setForm(p => ({ ...p, [key]: !p[key] }))

  const submit = async () => {
    setLoading(true); setSubmitError('')
    try {
      const r = await axios.post(`${BASE_URL}/api/checkin/submit/`, {
        patient: patientInfo.id, token, ...form
      })
      setResultStatus(r.data.status)
      setSubmitted(true)
    } catch (err) {
      setSubmitError(
        err.response?.status === 403
          ? 'This check-in link is invalid or has expired.'
          : 'Unable to submit. Please check your connection and try again.'
      )
    } finally { setLoading(false) }
  }

  /* ── Loading ── */
  if (!notFound && !patientInfo) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc' }}>
        <div className="spinner" style={{ width: 32, height: 32, borderWidth: 3 }} />
      </div>
    )
  }

  /* ── Not found ── */
  if (notFound) {
    return (
      <div style={{ minHeight: '100vh', background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
        <div style={{ maxWidth: 400, width: '100%', textAlign: 'center' }}>
          <AlertTriangle size={52} color="#d97706" style={{ marginBottom: 16 }} />
          <div style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>Link Not Found</div>
          <div style={{ color: '#64748b', fontSize: 14, lineHeight: 1.7 }}>
            This check-in link is invalid or has expired. Please contact your care team for a new link.
          </div>
        </div>
      </div>
    )
  }

  /* ── Success screen ── */
  if (submitted && resultStatus) {
    const c = RESULT_CONFIG[resultStatus] || RESULT_CONFIG.green
    return (
      <div style={{ minHeight: '100vh', background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
        <div style={{ maxWidth: 440, width: '100%' }}>
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 28 }}>
            <div style={{ width: 32, height: 32, borderRadius: 9, background: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Activity size={16} color="#fff" />
            </div>
            <span style={{ fontWeight: 700, color: '#2563eb', fontSize: 15 }}>MediTrack</span>
          </div>

          <div style={{ textAlign: 'center', marginBottom: 20 }}>{c.icon}</div>

          <div style={{ background: c.bg, border: `1.5px solid ${c.border}`, borderRadius: 18, padding: '26px 24px', textAlign: 'center' }}>
            <div style={{ fontSize: 19, fontWeight: 700, color: c.titleColor, marginBottom: 4 }}>{c.title}</div>
            <div style={{ fontSize: 14, fontWeight: 500, color: c.titleColor, opacity: 0.8, marginBottom: 12 }}>{c.subtitle}</div>
            <div style={{ color: '#374151', fontSize: 13.5, lineHeight: 1.8 }}>{c.message}</div>
          </div>

          <div style={{ marginTop: 20, textAlign: 'center', fontSize: 12, color: '#94a3b8' }}>
            MediTrack · Secure & Confidential
          </div>
        </div>
      </div>
    )
  }

  const firstName = patientInfo?.full_name?.split(' ')[0] || ''

  /* ── Check-in form ── */
  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', padding: '32px 16px 56px' }}>
      <div style={{ maxWidth: 500, margin: '0 auto' }}>

        {/* Branding */}
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 9, marginBottom: 14,
            background: '#fff', border: '1px solid #e2e8f0', borderRadius: 99, padding: '8px 16px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.06)'
          }}>
            <div style={{ width: 28, height: 28, borderRadius: 8, background: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Activity size={14} color="#fff" />
            </div>
            <span style={{ fontWeight: 700, color: '#2563eb', fontSize: 14 }}>MediTrack</span>
          </div>
          <h1 style={{ fontSize: 22, fontWeight: 800, marginBottom: 6, color: '#0f172a', letterSpacing: '-0.02em' }}>
            Daily Health Check-in
          </h1>
          <p style={{ color: '#64748b', fontSize: 14 }}>
            Hello <strong style={{ color: '#0f172a' }}>{firstName}</strong>, how are you feeling today?
          </p>
        </div>

        <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 18, padding: '24px 20px', boxShadow: '0 4px 12px rgba(0,0,0,0.04)' }}>
          <div style={{ marginBottom: 18 }}>
            <div style={{ fontWeight: 600, fontSize: 15, color: '#0f172a', marginBottom: 3 }}>
              Select any symptoms you are experiencing
            </div>
            <div style={{ fontSize: 12.5, color: '#94a3b8' }}>
              Tap all that apply — your care team reviews every response.
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20 }}>
            {SYMPTOMS.map(s => (
              <button key={s.key} onClick={() => toggle(s.key)} style={{
                display: 'flex', alignItems: 'center', gap: 13,
                padding: '13px 15px', borderRadius: 12,
                border: `2px solid ${form[s.key] ? '#2563eb' : '#e2e8f0'}`,
                background: form[s.key] ? '#eff6ff' : '#fafafa',
                cursor: 'pointer', textAlign: 'left',
                transition: 'all 0.15s cubic-bezier(0.4,0,0.2,1)',
                boxShadow: form[s.key] ? '0 0 0 3px rgba(37,99,235,0.08)' : 'none',
              }}>
                {/* Checkbox */}
                <div style={{
                  width: 22, height: 22, borderRadius: 6, flexShrink: 0,
                  border: `2px solid ${form[s.key] ? '#2563eb' : '#cbd5e1'}`,
                  background: form[s.key] ? '#2563eb' : 'transparent',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'all 0.15s',
                }}>
                  {form[s.key] && (
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                      <path d="M2 6l3 3 5-5" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  )}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: 14, color: form[s.key] ? '#1d4ed8' : '#0f172a' }}>
                    {s.label}
                  </div>
                  <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 1 }}>{s.desc}</div>
                </div>
                <span style={{ fontSize: 18, flexShrink: 0 }}>{s.icon}</span>
              </button>
            ))}
          </div>

          {/* Notes */}
          <div className="form-group">
            <label style={{ fontSize: 13, fontWeight: 500, color: '#475569' }}>
              Additional notes <span style={{ color: '#94a3b8', fontWeight: 400 }}>(optional)</span>
            </label>
            <textarea className="form-control" rows={3}
              placeholder="Anything else your care team should know…"
              value={form.additional_notes}
              onChange={e => setForm(p => ({...p, additional_notes: e.target.value}))}
              style={{ borderRadius: 10, resize: 'none' }} />
          </div>

          {submitError && (
            <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: '10px 13px', color: '#dc2626', fontSize: 13, marginBottom: 14 }}>
              {submitError}
            </div>
          )}

          <button onClick={submit} disabled={loading}
            style={{
              width: '100%', padding: '14px',
              background: loading ? '#93c5fd' : '#2563eb',
              color: '#fff', border: 'none', borderRadius: 12,
              fontSize: 15, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              transition: 'all 0.15s',
              boxShadow: '0 4px 12px rgba(37,99,235,0.25)',
            }}>
            {loading && <div className="spinner spinner-sm" style={{ borderTopColor: '#fff', borderColor: 'rgba(255,255,255,0.3)' }} />}
            {loading ? 'Submitting…' : 'Submit Check-in'}
          </button>

          <div style={{ marginTop: 12, textAlign: 'center', fontSize: 12, color: '#94a3b8' }}>
            If you have no symptoms, tap Submit to confirm you are feeling well.
          </div>
        </div>

        <div style={{ textAlign: 'center', marginTop: 20, fontSize: 11.5, color: '#94a3b8' }}>
          MediTrack · Secure & Confidential
        </div>
      </div>
    </div>
  )
}

import { useEffect, useState } from 'react'
import api from '../api'
import { Plus, Trash2, X, UserCog } from 'lucide-react'

function AddDoctorModal({ onClose, onSaved }) {
  const [form, setForm] = useState({
    username: '', first_name: '', last_name: '', email: '',
    password: '', phone: '', specialization: '', hospital: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }))

  const submit = async e => {
    e.preventDefault(); setLoading(true); setError('')
    try { await api.post('/doctors/', form); onSaved() }
    catch (err) {
      const data = err.response?.data
      setError(typeof data === 'object' ? Object.values(data).flat().join(' ') : 'Failed to register doctor.')
    }
    finally { setLoading(false) }
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <div className="modal-title">Register New Doctor</div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text2)' }}><X size={18} /></button>
        </div>
        {error && <div className="alert alert-error">{error}</div>}
        <form onSubmit={submit}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 14px' }}>
            <div className="form-group">
              <label>First Name *</label>
              <input className="form-control" required value={form.first_name} onChange={e => set('first_name', e.target.value)} />
            </div>
            <div className="form-group">
              <label>Last Name *</label>
              <input className="form-control" required value={form.last_name} onChange={e => set('last_name', e.target.value)} />
            </div>
            <div className="form-group">
              <label>Username *</label>
              <input className="form-control" required value={form.username} onChange={e => set('username', e.target.value)} placeholder="e.g. dr.nakato" />
            </div>
            <div className="form-group">
              <label>Password *</label>
              <input className="form-control" required type="password" value={form.password} onChange={e => set('password', e.target.value)} />
            </div>
            <div className="form-group" style={{ gridColumn: '1/-1' }}>
              <label>Email *</label>
              <input className="form-control" required type="email" value={form.email} onChange={e => set('email', e.target.value)} />
            </div>
            <div className="form-group">
              <label>Phone</label>
              <input className="form-control" value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="+256700000000" />
            </div>
            <div className="form-group">
              <label>Specialization</label>
              <input className="form-control" value={form.specialization} onChange={e => set('specialization', e.target.value)} placeholder="e.g. Internal Medicine" />
            </div>
            <div className="form-group" style={{ gridColumn: '1/-1' }}>
              <label>Hospital / Facility</label>
              <input className="form-control" value={form.hospital} onChange={e => set('hospital', e.target.value)} placeholder="e.g. Regional Referral Hospital" />
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 4 }}>
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>{loading ? 'Registering…' : 'Register Doctor'}</button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function Doctors() {
  const [doctors, setDoctors] = useState([])
  const [showModal, setShowModal] = useState(false)
  const [loading, setLoading] = useState(true)

  const load = () => {
    setLoading(true)
    api.get('/doctors/').then(r => { setDoctors(r.data); setLoading(false) })
  }

  useEffect(() => { load() }, [])

  const deleteDoctor = async id => {
    if (!confirm('Remove this doctor from the system? Their patients will become unassigned.')) return
    await api.delete(`/doctors/${id}/`)
    load()
  }

  return (
    <div>
      <div className="page-header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h1 className="page-title">Doctors</h1>
            <p className="page-subtitle">{doctors.length} registered healthcare provider{doctors.length !== 1 ? 's' : ''}</p>
          </div>
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>
            <Plus size={15} /> Register Doctor
          </button>
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 40 }}><div className="spinner" style={{ margin: '0 auto' }} /></div>
      ) : doctors.length === 0 ? (
        <div className="empty-state card">
          <UserCog size={36} color="var(--text3)" style={{ marginBottom: 12 }} />
          <div>No doctors registered yet.</div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
          {doctors.map(d => (
            <div key={d.id} className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                  <div style={{
                    width: 42, height: 42, borderRadius: 12, background: 'var(--primary-light)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                  }}>
                    <UserCog size={18} color="var(--primary)" />
                  </div>
                  <div>
                    <div style={{ fontWeight: 600 }}>Dr. {d.first_name} {d.last_name}</div>
                    <div style={{ fontSize: 12, color: 'var(--text3)' }}>@{d.username}</div>
                  </div>
                </div>
                <button className="btn btn-danger btn-sm" onClick={() => deleteDoctor(d.id)}>
                  <Trash2 size={12} />
                </button>
              </div>
              <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 6 }}>
                {[
                  ['Specialization', d.doctor_profile?.specialization || '—'],
                  ['Facility', d.doctor_profile?.hospital || '—'],
                  ['Phone', d.doctor_profile?.phone || '—'],
                  ['Email', d.email],
                  ['Active Patients', d.patient_count],
                ].map(([label, val]) => (
                  <div key={label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5 }}>
                    <span style={{ color: 'var(--text3)' }}>{label}</span>
                    <span style={{ fontWeight: 500, color: 'var(--text2)' }}>{val}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && <AddDoctorModal onClose={() => setShowModal(false)} onSaved={() => { setShowModal(false); load() }} />}
    </div>
  )
}

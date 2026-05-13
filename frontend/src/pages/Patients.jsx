import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api'
import { Plus, Search, X, ChevronRight, Users } from 'lucide-react'

const BADGE = { green: 'badge-green', yellow: 'badge-yellow', red: 'badge-red', pending: 'badge-gray' }
const STATUS_LABEL = { green: 'Stable', yellow: 'Needs Attention', red: 'Critical', pending: 'Awaiting' }
const DOT_COLOR = { green: '#16a34a', yellow: '#ca8a04', red: '#dc2626', pending: '#94a3b8' }

function AddPatientModal({ onClose, onSaved }) {
  const [form, setForm] = useState({
    full_name: '', phone_number: '', age: '', gender: 'female',
    condition_type: 'chronic', diagnosis: '', discharge_date: new Date().toISOString().split('T')[0],
    assigned_doctor: '', notes: ''
  })
  const [doctors, setDoctors] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    api.get('/doctors/').then(r => setDoctors(r.data)).catch(() => {})
  }, [])

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }))

  const submit = async e => {
    e.preventDefault(); setLoading(true); setError('')
    try {
      await api.post('/patients/', { ...form, age: parseInt(form.age) })
      onSaved()
    } catch (err) {
      const data = err.response?.data
      setError(typeof data === 'object' ? Object.values(data).flat().join(' ') : 'Failed to add patient.')
    } finally { setLoading(false) }
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <div className="modal-title">Enrol New Patient</div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text2)' }}><X size={18} /></button>
        </div>
        {error && <div className="alert alert-error">{error}</div>}
        <form onSubmit={submit}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 14px' }}>
            <div className="form-group" style={{ gridColumn: '1/-1' }}>
              <label>Full Name *</label>
              <input className="form-control" required value={form.full_name} onChange={e => set('full_name', e.target.value)} placeholder="Patient full name" />
            </div>
            <div className="form-group">
              <label>Phone Number *</label>
              <input className="form-control" required value={form.phone_number} onChange={e => set('phone_number', e.target.value)} placeholder="+256700000000" />
            </div>
            <div className="form-group">
              <label>Age *</label>
              <input className="form-control" required type="number" min="0" max="120" value={form.age} onChange={e => set('age', e.target.value)} />
            </div>
            <div className="form-group">
              <label>Gender</label>
              <select className="form-control" value={form.gender} onChange={e => set('gender', e.target.value)}>
                <option value="female">Female</option>
                <option value="male">Male</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div className="form-group">
              <label>Condition Type</label>
              <select className="form-control" value={form.condition_type} onChange={e => set('condition_type', e.target.value)}>
                <option value="chronic">Chronic Illness</option>
                <option value="post_surgical">Post-Surgical</option>
                <option value="acute">Acute Illness</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div className="form-group" style={{ gridColumn: '1/-1' }}>
              <label>Diagnosis / Condition *</label>
              <input className="form-control" required value={form.diagnosis} onChange={e => set('diagnosis', e.target.value)} placeholder="e.g. Hypertension & Type 2 Diabetes" />
            </div>
            <div className="form-group">
              <label>Discharge Date *</label>
              <input className="form-control" required type="date" value={form.discharge_date} onChange={e => set('discharge_date', e.target.value)} />
            </div>
            <div className="form-group">
              <label>Assign Doctor</label>
              <select className="form-control" value={form.assigned_doctor} onChange={e => set('assigned_doctor', e.target.value)}>
                <option value="">— Select Doctor —</option>
                {doctors.map(d => (
                  <option key={d.id} value={d.id}>Dr. {d.first_name} {d.last_name}</option>
                ))}
              </select>
            </div>
            <div className="form-group" style={{ gridColumn: '1/-1' }}>
              <label>Notes (optional)</label>
              <textarea className="form-control" rows={2} value={form.notes} onChange={e => set('notes', e.target.value)} placeholder="Any relevant clinical notes..." />
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 4 }}>
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Enrolling...' : 'Enrol Patient'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function Patients() {
  const navigate = useNavigate()
  const [patients, setPatients] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')

  const load = () => {
    setLoading(true)
    api.get('/patients/').then(r => { setPatients(r.data); setLoading(false) })
  }

  useEffect(() => { load() }, [])

  const filtered = patients.filter(p => {
    const q = search.toLowerCase()
    const matchSearch = !q || p.full_name.toLowerCase().includes(q) ||
      p.phone_number.includes(q) || p.diagnosis.toLowerCase().includes(q)
    const matchFilter = filter === 'all' || p.latest_status === filter
    return matchSearch && matchFilter
  })

  return (
    <div>
      <div className="page-header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h1 className="page-title">Patients</h1>
            <p className="page-subtitle">{patients.length} active patient{patients.length !== 1 ? 's' : ''} under monitoring</p>
          </div>
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>
            <Plus size={15} /> Enrol Patient
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
          <Search size={14} style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', color: 'var(--text3)' }} />
          <input className="form-control" style={{ paddingLeft: 34 }} placeholder="Search by name, phone, or diagnosis…"
            value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        {['all', 'green', 'yellow', 'red', 'pending'].map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`btn ${filter === f ? 'btn-primary' : 'btn-secondary'} btn-sm`}>
            {f === 'all' ? 'All' : STATUS_LABEL[f]}
          </button>
        ))}
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: 40, textAlign: 'center' }}><div className="spinner" style={{ margin: '0 auto' }} /></div>
        ) : filtered.length === 0 ? (
          <div className="empty-state">
            <Users size={36} color="var(--text3)" style={{ marginBottom: 12 }} />
            <div>{search || filter !== 'all' ? 'No patients match your search.' : 'No patients enrolled yet.'}</div>
          </div>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Patient</th>
                <th>Phone</th>
                <th>Condition</th>
                <th>Discharge Date</th>
                <th>Assigned Doctor</th>
                <th>Status</th>
                <th>Check-ins</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(p => (
                <tr key={p.id} style={{ cursor: 'pointer' }} onClick={() => navigate(`/patients/${p.id}`)}>
                  <td>
                    <div style={{ fontWeight: 500 }}>{p.full_name}</div>
                    <div style={{ fontSize: 11.5, color: 'var(--text3)' }}>{p.age}y • {p.gender}</div>
                  </td>
                  <td style={{ color: 'var(--text2)', fontFamily: 'DM Mono, monospace', fontSize: 12.5 }}>{p.phone_number}</td>
                  <td style={{ color: 'var(--text2)', fontSize: 13 }}>{p.diagnosis.length > 32 ? p.diagnosis.slice(0, 32) + '…' : p.diagnosis}</td>
                  <td style={{ color: 'var(--text2)', fontSize: 13 }}>{p.discharge_date}</td>
                  <td style={{ color: 'var(--text2)', fontSize: 13 }}>{p.assigned_doctor_name || '—'}</td>
                  <td>
                    <span className={`badge ${BADGE[p.latest_status] || 'badge-gray'}`}>
                      <span style={{ width: 7, height: 7, borderRadius: '50%', background: DOT_COLOR[p.latest_status], display: 'inline-block' }} />
                      {STATUS_LABEL[p.latest_status] || 'Unknown'}
                    </span>
                  </td>
                  <td style={{ color: 'var(--text2)' }}>{p.checkin_count}</td>
                  <td><ChevronRight size={15} color="var(--text3)" /></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showModal && <AddPatientModal onClose={() => setShowModal(false)} onSaved={() => { setShowModal(false); load() }} />}
    </div>
  )
}

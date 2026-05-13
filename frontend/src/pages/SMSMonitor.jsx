
import { useEffect, useState } from 'react'
import api from '../api'
import { format, parseISO } from 'date-fns'
import { RefreshCw, MessageSquare } from 'lucide-react'

export default function SMSMonitor() {
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [dirFilter, setDirFilter] = useState('all')

  const load = () => {
    setLoading(true)
    api.get('/sms/inbox/').then(r => {
      setLogs(r.data)
      setLoading(false)
    })
  }

  useEffect(() => { load() }, [])

  const filtered = logs.filter(log => {
    const matchSearch = !search || (log.patient_name || '').toLowerCase().includes(search.toLowerCase()) ||
      log.message.toLowerCase().includes(search.toLowerCase())
    const matchDir = dirFilter === 'all' || log.direction === dirFilter
    return matchSearch && matchDir
  })

  return (
    <div>
      <div className="page-header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h1 className="page-title">Message Monitor</h1>
            <p className="page-subtitle">All outbound and inbound patient messages</p>
          </div>
          <button className="btn btn-secondary btn-sm" onClick={load}>
            <RefreshCw size={13} /> Refresh
          </button>
        </div>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
          <input
            className="form-control"
            placeholder="Search by patient name or message…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        {[
          { key: 'all', label: 'All' },
          { key: 'out', label: 'Outbound' },
          { key: 'in',  label: 'Inbound' },
        ].map(f => (
          <button
            key={f.key}
            onClick={() => setDirFilter(f.key)}
            className={`btn ${dirFilter === f.key ? 'btn-primary' : 'btn-secondary'} btn-sm`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 60 }}>
          <div className="spinner" style={{ margin: '0 auto' }} />
        </div>
      ) : logs.length === 0 ? (
        <div className="empty-state card">
          <MessageSquare size={36} color="var(--text3)" style={{ marginBottom: 12 }} />
          <div>No messages yet.</div>
          <div style={{ fontSize: 13, marginTop: 4 }}>Enrol a patient to send the first check-in.</div>
        </div>
      ) : (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          {filtered.length === 0 ? (
            <div className="empty-state">
              <div>No messages match your search.</div>
            </div>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>Patient</th>
                  <th>Direction</th>
                  <th>Channel</th>
                  <th>Status</th>
                  <th>Time</th>
                  <th>Message</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(log => (
                  <tr key={log.id}>
                    <td style={{ fontSize: 13, fontWeight: 500 }}>
                      {log.patient_name || `#${log.patient}`}
                    </td>
                    <td>
                      <span style={{
                        fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 99,
                        background: log.direction === 'out' ? 'var(--primary-light)' : 'var(--green-bg)',
                        color: log.direction === 'out' ? 'var(--primary)' : 'var(--green)',
                      }}>
                        {log.direction === 'out' ? '↑ Outbound' : '↓ Inbound'}
                      </span>
                    </td>
                    <td>
                      <span style={{
                        fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 99,
                        background: 'var(--bg2)', color: 'var(--text2)',
                        border: '1px solid var(--border)',
                        textTransform: 'uppercase', letterSpacing: '0.04em',
                      }}>
                        {log.channel || 'sms'}
                      </span>
                    </td>
                    <td>
                      <span style={{
                        fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 99,
                        background: log.status === 'failed' ? 'var(--red-bg)' : 'var(--green-bg)',
                        color: log.status === 'failed' ? 'var(--red)' : 'var(--green)',
                      }}>
                        {log.status === 'failed' ? 'Failed' : log.status === 'received' ? 'Received' : 'Delivered'}
                      </span>
                    </td>
                    <td style={{ fontSize: 12, color: 'var(--text3)', whiteSpace: 'nowrap' }}>
                      {format(parseISO(log.sent_at), 'MMM d, yyyy · h:mm a')}
                    </td>
                    <td style={{ fontSize: 12.5, color: 'var(--text2)', maxWidth: 380 }}>
                      <div style={{ whiteSpace: 'pre-line', lineHeight: 1.5 }}>
                        {log.message.length > 120 ? log.message.slice(0, 120) + '…' : log.message}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  )
}



































// import { useEffect, useState, useRef } from 'react'
// import api from '../api'
// import { format, parseISO } from 'date-fns'
// import { RefreshCw, Smartphone, Signal, Wifi, Battery } from 'lucide-react'

// export default function SMSMonitor() {
//   const [logs, setLogs] = useState([])
//   const [loading, setLoading] = useState(true)
//   const [selectedPatient, setSelectedPatient] = useState(null)
//   const messagesEndRef = useRef(null)

//   const load = () => {
//     setLoading(true)
//     api.get('/sms/inbox/').then(r => {
//       setLogs(r.data)
//       setLoading(false)
//     })
//   }

//   useEffect(() => { load() }, [])

//   // Auto-scroll inside phone when messages change
//   useEffect(() => {
//     messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
//   }, [selectedPatient, logs])

//   // Build patient map: { patientId -> { name, messages[] } }
//   const patientMap = {}
//   logs.forEach(log => {
//     if (!patientMap[log.patient]) {
//       patientMap[log.patient] = { id: log.patient, name: log.patient_name || `Patient #${log.patient}`, messages: [] }
//     }
//     patientMap[log.patient].messages.push(log)
//   })
//   const patients = Object.values(patientMap)

//   const activePatient = selectedPatient
//     ? patientMap[selectedPatient]
//     : patients[0] || null

//   const phoneMessages = activePatient ? activePatient.messages : []

//   const now = new Date()
//   const timeStr = format(now, 'h:mm')

//   return (
//     <div>
//       <div className="page-header">
//         <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
//           <div>
//             <h1 className="page-title">Message Monitor</h1>
//             <p className="page-subtitle">All outbound and inbound patient messages</p>
//           </div>
//           <button className="btn btn-secondary btn-sm" onClick={load}>
//             <RefreshCw size={13} /> Refresh
//           </button>
//         </div>
//       </div>

//       {loading ? (
//         <div style={{ textAlign: 'center', padding: 60 }}><div className="spinner" style={{ margin: '0 auto' }} /></div>
//       ) : logs.length === 0 ? (
//         <div className="empty-state card">
//           <Smartphone size={36} color="var(--text3)" style={{ marginBottom: 12 }} />
//           <div>No messages yet.</div>
//           <div style={{ fontSize: 13, marginTop: 4 }}>Enrol a patient to send the first check-in.</div>
//         </div>
//       ) : (
//         <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start', flexWrap: 'wrap' }}>

//           {/* ── Phone Mockup ────────────────────────────────── */}
//           <div style={{ flex: '0 0 auto' }}>
//             <div style={{ fontSize: 11.5, color: 'var(--text3)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12 }}>
//               Phone Preview
//             </div>

//             {/* Patient selector above phone */}
//             {patients.length > 1 && (
//               <div style={{ marginBottom: 10, display: 'flex', gap: 6, flexWrap: 'wrap', maxWidth: 280 }}>
//                 {patients.slice(0, 6).map(p => (
//                   <button key={p.id} onClick={() => setSelectedPatient(p.id)} style={{
//                     padding: '3px 10px', fontSize: 11.5, borderRadius: 99,
//                     border: '1px solid',
//                     borderColor: (activePatient?.id === p.id) ? 'var(--primary)' : 'var(--border)',
//                     background: (activePatient?.id === p.id) ? 'var(--primary-light)' : 'var(--surface)',
//                     color: (activePatient?.id === p.id) ? 'var(--primary)' : 'var(--text2)',
//                     cursor: 'pointer', fontWeight: (activePatient?.id === p.id) ? 600 : 400,
//                     transition: 'all 0.12s'
//                   }}>
//                     {p.name.split(' ')[0]}
//                   </button>
//                 ))}
//               </div>
//             )}

//             {/* Phone frame — fixed size, never grows */}
//             <div style={{
//               width: 285,
//               background: '#111',
//               borderRadius: 44,
//               padding: '16px 10px 20px',
//               boxShadow: '0 24px 64px rgba(0,0,0,0.35), inset 0 0 0 1px rgba(255,255,255,0.07)',
//               position: 'relative',
//             }}>
//               {/* Side buttons */}
//               <div style={{ position: 'absolute', left: -3, top: 90, width: 3, height: 28, background: '#333', borderRadius: '3px 0 0 3px' }} />
//               <div style={{ position: 'absolute', left: -3, top: 126, width: 3, height: 46, background: '#333', borderRadius: '3px 0 0 3px' }} />
//               <div style={{ position: 'absolute', left: -3, top: 180, width: 3, height: 46, background: '#333', borderRadius: '3px 0 0 3px' }} />
//               <div style={{ position: 'absolute', right: -3, top: 130, width: 3, height: 64, background: '#333', borderRadius: '0 3px 3px 0' }} />

//               {/* Dynamic island */}
//               <div style={{ width: 100, height: 28, background: '#000', borderRadius: 20, margin: '0 auto 10px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
//                 <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#1a1a1a', border: '1.5px solid #2a2a2a' }} />
//                 <div style={{ width: 24, height: 10, borderRadius: 5, background: '#1a1a1a', border: '1.5px solid #2a2a2a' }} />
//               </div>

//               {/* Screen */}
//               <div style={{
//                 background: '#fff',
//                 borderRadius: 28,
//                 overflow: 'hidden',
//                 height: 540,
//                 display: 'flex',
//                 flexDirection: 'column',
//               }}>
//                 {/* Status bar */}
//                 <div style={{
//                   background: '#075e54',
//                   padding: '8px 14px 6px',
//                   flexShrink: 0,
//                 }}>
//                   {/* Top row: time + icons */}
//                   <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
//                     <div style={{ color: '#fff', fontSize: 11, fontWeight: 700 }}>{timeStr}</div>
//                     <div style={{ display: 'flex', gap: 5, alignItems: 'center' }}>
//                       <Signal size={11} color="#fff" />
//                       <Wifi size={11} color="#fff" />
//                       <Battery size={11} color="#fff" />
//                     </div>
//                   </div>
//                   {/* Contact row */}
//                   <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
//                     <div style={{ width: 34, height: 34, borderRadius: '50%', background: 'rgba(255,255,255,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
//                       <span style={{ color: '#fff', fontSize: 13, fontWeight: 700 }}>
//                         {activePatient?.name?.charAt(0) || 'M'}
//                       </span>
//                     </div>
//                     <div>
//                       <div style={{ color: '#fff', fontSize: 12.5, fontWeight: 600, lineHeight: 1.2 }}>
//                         {activePatient?.name || 'MediTrack'}
//                       </div>
//                       <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: 10 }}>
//                         {phoneMessages.length} message{phoneMessages.length !== 1 ? 's' : ''}
//                       </div>
//                     </div>
//                   </div>
//                 </div>

//                 {/* Messages area — scrollable, fixed height */}
//                 <div style={{
//                   flex: 1,
//                   overflowY: 'auto',
//                   background: '#e5ddd5',
//                   padding: '10px 8px',
//                   display: 'flex',
//                   flexDirection: 'column',
//                   gap: 7,
//                   // Custom scrollbar
//                   scrollbarWidth: 'thin',
//                   scrollbarColor: 'rgba(0,0,0,0.15) transparent',
//                 }}>
//                   {phoneMessages.map((log, i) => {
//                     const isOut = log.direction === 'out'
//                     return (
//                       <div key={log.id} style={{
//                         display: 'flex',
//                         justifyContent: isOut ? 'flex-end' : 'flex-start',
//                       }}>
//                         <div style={{
//                           maxWidth: '82%',
//                           background: isOut ? '#dcf8c6' : '#fff',
//                           borderRadius: isOut ? '10px 10px 2px 10px' : '10px 10px 10px 2px',
//                           padding: '7px 10px',
//                           boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
//                           fontSize: 11.5,
//                           lineHeight: 1.5,
//                           color: '#1a1a1a',
//                           whiteSpace: 'pre-line',
//                           wordBreak: 'break-word',
//                         }}>
//                           {log.message}
//                           <div style={{ fontSize: 9.5, color: '#8696a0', textAlign: 'right', marginTop: 3, display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 3 }}>
//                             {format(parseISO(log.sent_at), 'h:mm a')}
//                             {isOut && <span style={{ color: '#53bdeb' }}>✓✓</span>}
//                           </div>
//                         </div>
//                       </div>
//                     )
//                   })}
//                   <div ref={messagesEndRef} />
//                 </div>

//                 {/* Input bar */}
//                 <div style={{
//                   flexShrink: 0,
//                   background: '#f0f0f0',
//                   padding: '7px 10px',
//                   display: 'flex',
//                   gap: 7,
//                   alignItems: 'center',
//                   borderTop: '1px solid #ddd',
//                 }}>
//                   <div style={{ flex: 1, background: '#fff', borderRadius: 20, padding: '6px 12px', fontSize: 11, color: '#aaa', border: '1px solid #e0e0e0' }}>
//                     Message
//                   </div>
//                   <div style={{ width: 30, height: 30, borderRadius: '50%', background: '#25d366', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
//                     <span style={{ color: '#fff', fontSize: 14, lineHeight: 1 }}>↑</span>
//                   </div>
//                 </div>
//               </div>

//               {/* Home indicator */}
//               <div style={{ width: 80, height: 4, background: 'rgba(255,255,255,0.25)', borderRadius: 99, margin: '10px auto 0' }} />
//             </div>
//           </div>

//           {/* ── Message Log Table ────────────────────────────── */}
//           <div style={{ flex: 1, minWidth: 320 }}>
//             <div style={{ fontSize: 11.5, color: 'var(--text3)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12 }}>
//               Message Log
//             </div>
//             <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
//               <table className="table">
//                 <thead>
//                   <tr>
//                     <th>Patient</th>
//                     <th>Direction</th>
//                     <th>Status</th>
//                     <th>Time</th>
//                     <th>Preview</th>
//                   </tr>
//                 </thead>
//                 <tbody>
//                   {logs.map(log => (
//                     <tr key={log.id} style={{ cursor: 'pointer' }}
//                       onClick={() => setSelectedPatient(log.patient)}>
//                       <td style={{ fontSize: 13, fontWeight: 500 }}>{log.patient_name || `#${log.patient}`}</td>
//                       <td>
//                         <span style={{
//                           fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 99,
//                           background: log.direction === 'out' ? 'var(--primary-light)' : 'var(--green-bg)',
//                           color: log.direction === 'out' ? 'var(--primary)' : 'var(--green)'
//                         }}>
//                           {log.direction === 'out' ? 'Outbound' : 'Inbound'}
//                         </span>
//                       </td>
//                       <td>
//                         <span style={{
//                           fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 99,
//                           background: log.status === 'failed' ? 'var(--red-bg)' : 'var(--green-bg)',
//                           color: log.status === 'failed' ? 'var(--red)' : 'var(--green)'
//                         }}>
//                           {log.status === 'failed' ? 'Failed' : 'Delivered'}
//                         </span>
//                       </td>
//                       <td style={{ fontSize: 12, color: 'var(--text3)' }}>
//                         {format(parseISO(log.sent_at), 'MMM d, h:mm a')}
//                       </td>
//                       <td style={{ fontSize: 12, color: 'var(--text2)', maxWidth: 220 }}>
//                         {log.message.length > 65 ? log.message.slice(0, 65) + '…' : log.message}
//                       </td>
//                     </tr>
//                   ))}
//                 </tbody>
//               </table>
//             </div>
//           </div>
//         </div>
//       )}
//     </div>
//   )
// }

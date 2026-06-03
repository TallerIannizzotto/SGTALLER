export function Field({ label, children, style = {} }) {
  return (
    <div style={{ marginBottom: 14, ...style }}>
      {label && <label style={{ display: 'block', fontSize: 11, color: '#888', marginBottom: 5, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{label}</label>}
      {children}
    </div>
  )
}

export function Input({ value, onChange, placeholder, type = 'text', mono, style = {} }) {
  return (
    <input
      type={type} value={value} onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      style={{
        width: '100%', background: '#1a1a1a', border: '0.5px solid rgba(255,255,255,0.1)',
        borderRadius: 10, padding: '10px 12px', fontSize: 14, color: '#f0f0f0',
        fontFamily: mono ? "'JetBrains Mono', monospace" : 'inherit', ...style
      }}
    />
  )
}

export function Select({ value, onChange, children, style = {} }) {
  return (
    <select value={value} onChange={e => onChange(e.target.value)} style={{
      width: '100%', background: '#1a1a1a', border: '0.5px solid rgba(255,255,255,0.1)',
      borderRadius: 10, padding: '10px 12px', fontSize: 14, color: '#f0f0f0',
      fontFamily: 'inherit', ...style
    }}>
      {children}
    </select>
  )
}

export function Textarea({ value, onChange, placeholder, rows = 4, style = {} }) {
  return (
    <textarea value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} rows={rows}
      style={{
        width: '100%', background: '#1a1a1a', border: '0.5px solid rgba(255,255,255,0.1)',
        borderRadius: 10, padding: '10px 12px', fontSize: 14, color: '#f0f0f0',
        fontFamily: 'inherit', resize: 'none', ...style
      }}
    />
  )
}

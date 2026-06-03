export function Card({ children, onClick, style = {} }) {
  return (
    <div onClick={onClick} style={{
      background: '#1a1a1a', border: '0.5px solid rgba(255,255,255,0.08)',
      borderRadius: 16, padding: '14px 16px', marginBottom: 10,
      cursor: onClick ? 'pointer' : 'default', ...style
    }}>
      {children}
    </div>
  )
}

export function RowAction({ icon, title, subtitle, onClick, rightContent }) {
  return (
    <div onClick={onClick} style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      background: '#1a1a1a', border: '0.5px solid rgba(255,255,255,0.08)',
      borderRadius: 12, padding: '12px 14px', marginBottom: 8, cursor: 'pointer'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{
          width: 38, height: 38, borderRadius: 10,
          background: 'rgba(29,158,117,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          {icon}
        </div>
        <div>
          <div style={{ fontSize: 13, fontWeight: 500, color: '#f0f0f0' }}>{title}</div>
          {subtitle && <div style={{ fontSize: 11, color: '#666', marginTop: 2 }}>{subtitle}</div>}
        </div>
      </div>
      {rightContent || (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#444" strokeWidth="1.5">
          <path d="m9 18 6-6-6-6"/>
        </svg>
      )}
    </div>
  )
}

export function SectionLabel({ children }) {
  return (
    <div style={{ fontSize: 10, fontWeight: 600, color: '#555', textTransform: 'uppercase', letterSpacing: '0.8px', margin: '18px 0 8px' }}>
      {children}
    </div>
  )
}

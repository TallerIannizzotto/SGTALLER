import { useNavigate, useLocation } from 'react-router-dom'

const tabs = [
  { path: '/', label: 'Inicio', icon: (active) => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={active ? '#1D9E75' : '#666'} strokeWidth="1.8">
      <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
      <polyline points="9 22 9 12 15 12 15 22"/>
    </svg>
  )},
  { path: '/nuevo', label: 'Nuevo', icon: (active) => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={active ? '#1D9E75' : '#666'} strokeWidth="1.8">
      <circle cx="12" cy="12" r="10"/>
      <path d="M12 8v8M8 12h8"/>
    </svg>
  )},
  { path: '/perfil', label: 'Perfil', icon: (active) => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={active ? '#1D9E75' : '#666'} strokeWidth="1.8">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
      <circle cx="12" cy="7" r="4"/>
    </svg>
  )}
]

export function BottomBar() {
  const navigate = useNavigate()
  const { pathname } = useLocation()

  return (
    <nav style={{
      position: 'sticky', bottom: 0, zIndex: 50,
      background: '#0f0f0f', borderTop: '0.5px solid rgba(255,255,255,0.08)',
      display: 'flex', paddingBottom: 'env(safe-area-inset-bottom, 8px)'
    }}>
      {tabs.map(t => {
        const active = pathname === t.path
        return (
          <button key={t.path} onClick={() => navigate(t.path)} style={{
            flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center',
            gap: 3, padding: '10px 0', background: 'none', border: 'none',
          }}>
            {t.icon(active)}
            <span style={{ fontSize: 10, color: active ? '#1D9E75' : '#666' }}>{t.label}</span>
          </button>
        )
      })}
    </nav>
  )
}

export function TopBar({ title, back, action, onBack, onAction, mono }) {
  const navigate = useNavigate()
  return (
    <header style={{
      position: 'sticky', top: 0, zIndex: 50,
      background: 'rgba(15,15,15,0.95)', backdropFilter: 'blur(12px)',
      borderBottom: '0.5px solid rgba(255,255,255,0.08)',
      padding: '14px 16px 12px',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between'
    }}>
      {back ? (
        <button onClick={onBack || (() => navigate(-1))} style={{
          background: 'none', border: 'none', color: '#1D9E75',
          fontSize: 13, display: 'flex', alignItems: 'center', gap: 4, padding: 0
        }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="m15 18-6-6 6-6"/>
          </svg>
          {back}
        </button>
      ) : <div style={{ width: 60 }} />}

      <span style={{
        fontSize: 15, fontWeight: 500,
        fontFamily: mono ? "'JetBrains Mono', monospace" : 'inherit',
        color: '#f0f0f0'
      }}>{title}</span>

      {action ? (
        <button onClick={onAction} style={{
          background: 'none', border: 'none', color: '#1D9E75',
          fontSize: 13, fontWeight: 500, padding: 0
        }}>{action}</button>
      ) : <div style={{ width: 60 }} />}
    </header>
  )
}

export function Screen({ children, noBottom }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100dvh', background: '#0f0f0f' }}>
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {children}
      </div>
      {!noBottom && <BottomBar />}
    </div>
  )
}

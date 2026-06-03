export function Btn({ children, onClick, variant = 'primary', style = {}, disabled, loading }) {
  const styles = {
    primary:   { background: '#1D9E75', color: '#fff', border: '0.5px solid #0F6E56' },
    secondary: { background: '#1a1a1a', color: '#f0f0f0', border: '0.5px solid rgba(255,255,255,0.1)' },
    outline:   { background: 'transparent', color: '#1D9E75', border: '0.5px solid #1D9E75' },
    danger:    { background: 'rgba(226,75,74,0.1)', color: '#E24B4A', border: '0.5px solid rgba(226,75,74,0.3)' },
  }
  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
        padding: '12px 16px', borderRadius: 10, fontSize: 14, fontWeight: 500,
        cursor: disabled || loading ? 'not-allowed' : 'pointer',
        width: '100%', fontFamily: 'inherit',
        opacity: disabled || loading ? 0.6 : 1,
        transition: 'opacity 0.15s',
        ...styles[variant], ...style
      }}
    >
      {loading ? <Spinner size={16} color="currentColor" /> : children}
    </button>
  )
}

export function Spinner({ size = 20, color = '#1D9E75' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      style={{ animation: 'spin 0.8s linear infinite' }}>
      <circle cx="12" cy="12" r="10" stroke={color} strokeWidth="2" strokeOpacity="0.2"/>
      <path d="M12 2a10 10 0 0 1 10 10" stroke={color} strokeWidth="2" strokeLinecap="round"/>
    </svg>
  )
}

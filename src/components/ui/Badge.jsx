const ESTADOS = {
  nuevo:         { label: 'Nuevo',        bg: '#0C447C22', color: '#378ADD', border: '#378ADD44' },
  presupuestado: { label: 'Presupuestado', bg: '#854F0B22', color: '#EF9F27', border: '#EF9F2744' },
  aprobado:      { label: 'Aprobado',     bg: '#1D9E7522', color: '#1D9E75', border: '#1D9E7544' },
  en_reparacion: { label: 'En reparación', bg: '#99201D22', color: '#E24B4A', border: '#E24B4A44' },
  entregado:     { label: 'Entregado',    bg: '#33333355', color: '#888',    border: '#88888844' },
}

export function Badge({ estado }) {
  const e = ESTADOS[estado] || ESTADOS.nuevo
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center',
      padding: '3px 10px', borderRadius: 100,
      fontSize: 11, fontWeight: 500,
      background: e.bg, color: e.color,
      border: `0.5px solid ${e.border}`
    }}>{e.label}</span>
  )
}

export function ESTADOS_LIST() { return Object.entries(ESTADOS).map(([k,v]) => ({ key: k, ...v })) }
export { ESTADOS }

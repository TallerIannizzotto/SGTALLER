import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useStore } from '../lib/store'
import { cargarSiniestros } from '../lib/siniestroService'
import { Screen, TopBar } from '../components/layout/Layout'
import { Badge } from '../components/ui/Badge'
import { SectionLabel } from '../components/ui/Card'

function StatCard({ value, label, color }) {
  return (
    <div style={{ background: '#1a1a1a', border: '0.5px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: '12px 10px', textAlign: 'center', flex: 1 }}>
      <div style={{ fontSize: 26, fontWeight: 600, color: color || '#f0f0f0', fontFamily: "'JetBrains Mono', monospace" }}>{value}</div>
      <div style={{ fontSize: 10, color: '#555', marginTop: 2 }}>{label}</div>
    </div>
  )
}

export default function Home() {
  const navigate = useNavigate()
  const { siniestros, setSiniestros, user } = useStore()

  useEffect(() => {
    cargarSiniestros().then(data => {
      setSiniestros(data)
    })
  }, [])

  const activos = siniestros.filter(s => s.estado !== 'entregado')
  const nuevos = siniestros.filter(s => s.estado === 'nuevo')
  const aprobados = siniestros.filter(s => s.estado === 'aprobado')

  return (
    <Screen>
      <TopBar title={
        <span style={{ color: '#1D9E75', fontWeight: 600, letterSpacing: '-0.5px' }}>SGTaller</span>
      } action={
        <img src={user?.picture} alt="" style={{ width: 28, height: 28, borderRadius: '50%', border: '1.5px solid #1D9E75' }} onError={e => e.target.style.display='none'} />
      } />

      <div style={{ padding: '16px 16px 24px' }} className="fade-in">
        <div style={{ marginBottom: 8 }}>
          <div style={{ fontSize: 11, color: '#555', marginBottom: 4 }}>Bienvenido</div>
          <div style={{ fontSize: 18, fontWeight: 500, color: '#f0f0f0' }}>{user?.name?.split(' ')[0] || 'Taller'}</div>
        </div>

        <SectionLabel>Resumen</SectionLabel>
        <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
          <StatCard value={activos.length} label="Activos" />
          <StatCard value={nuevos.length} label="Nuevos" color="#378ADD" />
          <StatCard value={aprobados.length} label="Aprobados" color="#1D9E75" />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
          <SectionLabel>Siniestros</SectionLabel>
          <span style={{ fontSize: 11, color: '#444' }}>{siniestros.length} total</span>
        </div>

        {siniestros.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px 20px' }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>🚗</div>
            <div style={{ fontSize: 14, color: '#555' }}>No hay siniestros aún</div>
            <button onClick={() => navigate('/nuevo')} style={{
              marginTop: 20, background: '#1D9E75', color: '#fff',
              border: 'none', borderRadius: 10, padding: '10px 24px',
              fontSize: 14, fontWeight: 500, fontFamily: 'inherit', cursor: 'pointer'
            }}>Crear el primero</button>
          </div>
        ) : (
          siniestros.map(s => (
            <div key={s.id} onClick={() => navigate(`/siniestro/${s.id}`)} style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              background: '#1a1a1a', border: '0.5px solid rgba(255,255,255,0.08)',
              borderRadius: 14, padding: '13px 14px', marginBottom: 8, cursor: 'pointer'
            }}>
              <div>
                <div style={{ fontSize: 15, fontWeight: 600, color: '#f0f0f0', fontFamily: "'JetBrains Mono', monospace", letterSpacing: '0.5px' }}>{s.patente}</div>
                <div style={{ fontSize: 12, color: '#666', marginTop: 3 }}>{s.clienteNombre} · {s.tipo === 'compania' ? s.compania : 'Particular'}</div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
                <Badge estado={s.estado} />
                {s.driveFolderLink && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#1D9E75' }} />
                    <span style={{ fontSize: 10, color: '#1D9E75' }}>Drive</span>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </Screen>
  )
}

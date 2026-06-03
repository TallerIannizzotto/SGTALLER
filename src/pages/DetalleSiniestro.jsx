import { useParams, useNavigate } from 'react-router-dom'
import { useStore } from '../lib/store'
import { guardarSiniestro, cacheSiniestros } from '../lib/siniestroService'
import { Screen, TopBar } from '../components/layout/Layout'
import { Badge, ESTADOS } from '../components/ui/Badge'
import { RowAction, SectionLabel, Card } from '../components/ui/Card'

const IconCamera = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#1D9E75" strokeWidth="1.5"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
const IconBrain = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#1D9E75" strokeWidth="1.5"><path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96-.46 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 1.98-3A2.5 2.5 0 0 1 9.5 2Z"/><path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96-.46 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-1.98-3A2.5 2.5 0 0 0 14.5 2Z"/></svg>
const IconDoc = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#1D9E75" strokeWidth="1.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
const IconClip = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#1D9E75" strokeWidth="1.5"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>
const IconIngreso = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#1D9E75" strokeWidth="1.5"><rect x="5" y="2" width="14" height="20" rx="2"/><path d="M9 7h6M9 11h6M9 15h4"/></svg>

export default function DetalleSiniestro() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { siniestros, updateSiniestro, siniestros: all } = useStore()
  const siniestro = siniestros.find(s => s.id === id)

  if (!siniestro) return (
    <div style={{ minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#555' }}>
      Siniestro no encontrado
    </div>
  )

  async function cambiarEstado(estado) {
    const updated = { ...siniestro, estado }
    updateSiniestro(id, { estado })
    cacheSiniestros(all.map(s => s.id === id ? updated : s))
    await guardarSiniestro(updated)
  }

  return (
    <Screen>
      <TopBar back="Inicio" title={siniestro.patente} mono
        onBack={() => navigate('/')}
        action={<Badge estado={siniestro.estado} />}
        onAction={() => {}}
      />

      <div style={{ padding: 16 }} className="fade-in">
        <Card style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 17, fontWeight: 600, color: '#f0f0f0' }}>{siniestro.clienteNombre}</div>
          <div style={{ fontSize: 12, color: '#666', marginTop: 4 }}>
            {siniestro.marca} {siniestro.modelo} {siniestro.anio} · {siniestro.tipo === 'compania' ? siniestro.compania : 'Particular'}
          </div>
          {siniestro.nroSiniestro && <div style={{ fontSize: 11, color: '#555', marginTop: 2 }}>Nro: {siniestro.nroSiniestro}</div>}
          {siniestro.descripcion && <div style={{ fontSize: 12, color: '#888', marginTop: 8, fontStyle: 'italic' }}>"{siniestro.descripcion}"</div>}
        </Card>

        <SectionLabel>Estado</SectionLabel>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6, marginBottom: 16 }}>
          {Object.entries(ESTADOS).map(([key, val]) => (
            <button key={key} onClick={() => cambiarEstado(key)} style={{
              padding: '8px 4px', borderRadius: 10, fontSize: 11, fontWeight: 500,
              textAlign: 'center', cursor: 'pointer', fontFamily: 'inherit',
              background: siniestro.estado === key ? val.bg : '#1a1a1a',
              color: siniestro.estado === key ? val.color : '#555',
              border: siniestro.estado === key ? `0.5px solid ${val.border}` : '0.5px solid rgba(255,255,255,0.06)'
            }}>{val.label}</button>
          ))}
        </div>

        <SectionLabel>Proceso</SectionLabel>
        <RowAction icon={<IconCamera />} title="Fotos del daño"
          subtitle={`${siniestro.fotos?.length || 0} foto${(siniestro.fotos?.length || 0) !== 1 ? 's' : ''} cargada${(siniestro.fotos?.length || 0) !== 1 ? 's' : ''}`}
          onClick={() => navigate(`/siniestro/${id}/fotos`)} />
        <RowAction icon={<IconBrain />} title="Análisis IA"
          subtitle={siniestro.analisisIA ? 'Análisis disponible' : 'Detectar daños automáticamente'}
          onClick={() => navigate(`/siniestro/${id}/ia`)} />
        <RowAction icon={<IconDoc />} title="Presupuesto"
          subtitle={siniestro.presupuesto?.length ? `${siniestro.presupuesto.length} ítems` : 'Crear / editar presupuesto'}
          onClick={() => navigate(`/siniestro/${id}/presupuesto`)} />
        <RowAction icon={<IconIngreso />} title="F01 — Ingreso vehículo"
          subtitle="Al momento del ingreso físico"
          onClick={() => navigate(`/siniestro/${id}/f01`)} />
        <RowAction icon={<IconClip />} title="F02 — Orden de trabajo"
          subtitle="Post aprobación de compañía"
          onClick={() => navigate(`/siniestro/${id}/f02`)} />

        {siniestro.driveFolderLink && (
          <>
            <SectionLabel>Drive</SectionLabel>
            <div onClick={() => window.open(siniestro.driveFolderLink, '_blank')} style={{
              display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px',
              background: 'rgba(29,158,117,0.06)', border: '0.5px solid rgba(29,158,117,0.2)',
              borderRadius: 12, cursor: 'pointer', marginBottom: 8
            }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#1D9E75', flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 12, fontWeight: 500, color: '#1D9E75' }}>Carpeta del vehículo</div>
                <div style={{ fontSize: 11, color: '#0F6E56' }}>{siniestro.tipo === 'compania' ? siniestro.compania : 'Particulares'} / {siniestro.patente}</div>
              </div>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#1D9E75" strokeWidth="2">
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>
              </svg>
            </div>
          </>
        )}
        <div style={{ height: 20 }} />
      </div>
    </Screen>
  )
}

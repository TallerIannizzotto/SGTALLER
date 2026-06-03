import { useRef, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useStore } from '../lib/store'
import { subirFoto, guardarSiniestro, cacheSiniestros } from '../lib/siniestroService'
import { Screen, TopBar } from '../components/layout/Layout'
import { Btn, Spinner } from '../components/ui/Btn'
import { SectionLabel } from '../components/ui/Card'

export default function Fotos() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { siniestros, updateSiniestro } = useStore()
  const siniestro = siniestros.find(s => s.id === id)
  const [uploading, setUploading] = useState(false)
  const inputRef = useRef()
  const fotos = siniestro?.fotos || []

  async function handleFoto(e) {
    const files = Array.from(e.target.files)
    if (!files.length) return
    setUploading(true)
    try {
      const nuevas = []
      for (const file of files) {
        const nombre = `foto_${Date.now()}_${file.name}`
        const result = await subirFoto(siniestro, file, nombre)
        nuevas.push(result)
      }
      const updatedFotos = [...fotos, ...nuevas]
      const updated = { ...siniestro, fotos: updatedFotos }
      updateSiniestro(id, { fotos: updatedFotos })
      const allSiniestros = useStore.getState().siniestros
      cacheSiniestros(allSiniestros)
      await guardarSiniestro(updated)
    } catch (e) {
      alert('Error al subir foto: ' + e.message)
    } finally {
      setUploading(false)
      e.target.value = ''
    }
  }

  return (
    <Screen>
      <TopBar back="Volver" title="Fotos del daño" action="+ Foto" onAction={() => inputRef.current?.click()} />
      <div style={{ padding: 16 }} className="fade-in">

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 12 }}>
          {fotos.map((f, i) => (
            <a key={i} href={f.link} target="_blank" rel="noreferrer" style={{
              aspectRatio: '1', borderRadius: 10, overflow: 'hidden',
              background: '#1a1a1a', border: '0.5px solid rgba(29,158,117,0.3)',
              display: 'flex', flexDirection: 'column', alignItems: 'center',
              justifyContent: 'center', textDecoration: 'none'
            }}>
              <div style={{ fontSize: 24, marginBottom: 4 }}>📷</div>
              <div style={{ fontSize: 9, color: '#555', textAlign: 'center', padding: '0 4px' }}>
                {f.nombre?.split('_').slice(-1)[0]?.substring(0, 14) || `Foto ${i + 1}`}
              </div>
            </a>
          ))}

          <div onClick={() => !uploading && inputRef.current?.click()} style={{
            aspectRatio: '1', borderRadius: 10, background: '#1a1a1a',
            border: '1px dashed rgba(29,158,117,0.3)',
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            justifyContent: 'center', cursor: uploading ? 'wait' : 'pointer', gap: 6
          }}>
            {uploading ? <Spinner size={24} /> : (
              <>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#1D9E75" strokeWidth="1.5">
                  <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                  <circle cx="12" cy="13" r="4"/>
                </svg>
                <span style={{ fontSize: 10, color: '#1D9E75' }}>Agregar</span>
              </>
            )}
          </div>
        </div>

        <input ref={inputRef} type="file" accept="image/*" multiple capture="environment"
          style={{ display: 'none' }} onChange={handleFoto} />

        <div style={{ fontSize: 11, color: '#555', textAlign: 'center', marginBottom: 20 }}>
          {fotos.length} foto{fotos.length !== 1 ? 's' : ''} · subidas a Drive automáticamente
        </div>

        <Btn onClick={() => navigate(`/siniestro/${id}/ia`)} variant="outline">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96-.46 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 1.98-3A2.5 2.5 0 0 1 9.5 2Z"/>
            <path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96-.46 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-1.98-3A2.5 2.5 0 0 0 14.5 2Z"/>
          </svg>
          Analizar con IA
        </Btn>
        <div style={{ height: 24 }} />
      </div>
    </Screen>
  )
}

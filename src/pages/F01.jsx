import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { useStore } from '../lib/store'
import { guardarSiniestro, subirPDF, cacheSiniestros } from '../lib/siniestroService'
import { generateF01 } from '../lib/pdf'
import { Screen, TopBar } from '../components/layout/Layout'
import { Field, Input, Select, Textarea } from '../components/ui/Field'
import { Btn } from '../components/ui/Btn'
import { Card, SectionLabel } from '../components/ui/Card'

export default function F01() {
  const { id } = useParams()
  const { siniestros, updateSiniestro, perfil } = useStore()
  const siniestro = siniestros.find(s => s.id === id)
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState(siniestro?.f01 || {
    fechaIngreso: new Date().toISOString().slice(0, 10),
    kilometraje: '', combustible: '1/2', observaciones: ''
  })
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  async function generar() {
    setLoading(true)
    try {
      const updated = { ...siniestro, f01: form }
      updateSiniestro(id, { f01: form })
      cacheSiniestros(useStore.getState().siniestros)
      await guardarSiniestro(updated)
      const buffer = generateF01(updated, perfil)
      const blob = new Blob([buffer], { type: 'application/pdf' })
      await subirPDF(updated, buffer, `F01_ingreso_${siniestro.patente.replace(/\s/g,'-')}.pdf`)
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `F01_${siniestro.patente.replace(/\s/g,'-')}.pdf`
      a.click()
      URL.revokeObjectURL(url)
      alert('F01 generado y subido a Drive')
    } catch (e) {
      alert('Error: ' + e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Screen>
      <TopBar back="Volver" title="F01 — Ingreso vehículo" />
      <div style={{ padding: 16 }} className="fade-in">
        <div style={{
          background: 'rgba(29,158,117,0.06)', border: '0.5px solid rgba(29,158,117,0.2)',
          borderRadius: 10, padding: '10px 12px', marginBottom: 16, fontSize: 12, color: '#1D9E75'
        }}>
          Los datos del vehículo se cargan automáticamente desde el siniestro
        </div>

        <Card style={{ marginBottom: 16 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, fontSize: 12 }}>
            {[
              ['Patente', siniestro?.patente, true],
              ['Marca', siniestro?.marca],
              ['Modelo', siniestro?.modelo],
              ['Año', siniestro?.anio],
              ['Color', siniestro?.color],
              ['Cliente', siniestro?.clienteNombre],
            ].map(([label, val, mono]) => (
              <div key={label}>
                <span style={{ color: '#555' }}>{label}: </span>
                <strong style={{ fontFamily: mono ? "'JetBrains Mono',monospace" : 'inherit' }}>{val || '—'}</strong>
              </div>
            ))}
          </div>
        </Card>

        <SectionLabel>Datos de ingreso</SectionLabel>
        <Field label="Fecha de ingreso">
          <Input type="date" value={form.fechaIngreso} onChange={v => set('fechaIngreso', v)} />
        </Field>
        <Field label="Kilometraje">
          <Input value={form.kilometraje} onChange={v => set('kilometraje', v)} placeholder="Ej: 45.230 km" />
        </Field>
        <Field label="Nivel de combustible">
          <Select value={form.combustible} onChange={v => set('combustible', v)}>
            {['Vacío', '1/4', '1/2', '3/4', 'Lleno'].map(o => <option key={o}>{o}</option>)}
          </Select>
        </Field>
        <Field label="Observaciones">
          <Textarea value={form.observaciones} onChange={v => set('observaciones', v)}
            placeholder="Rayones previos, accesorios, daños preexistentes..." rows={3} />
        </Field>
        <Field label="Firma del cliente">
          <div style={{
            height: 80, border: '1px dashed rgba(255,255,255,0.1)', borderRadius: 10,
            display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#333', fontSize: 12
          }}>Área de firma (en el PDF impreso)</div>
        </Field>

        <Btn onClick={generar} loading={loading}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
            <polyline points="7 10 12 15 17 10"/>
            <line x1="12" y1="15" x2="12" y2="3"/>
          </svg>
          Generar F01 y subir a Drive
        </Btn>
        <div style={{ height: 24 }} />
      </div>
    </Screen>
  )
}

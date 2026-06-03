import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useStore } from '../lib/store'
import { crearSiniestro, cacheSiniestros } from '../lib/siniestroService'
import { Screen, TopBar } from '../components/layout/Layout'
import { Field, Input, Select, Textarea } from '../components/ui/Field'
import { Btn } from '../components/ui/Btn'
import { SectionLabel } from '../components/ui/Card'

export default function NuevoSiniestro() {
  const navigate = useNavigate()
  const { perfil, addSiniestro, siniestros } = useStore()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    tipo: 'particular',
    compania: perfil.companias?.[0]?.nombre || '',
    nroSiniestro: '',
    patente: '', marca: '', modelo: '', anio: '', color: '',
    clienteNombre: '', clienteTelefono: '', descripcion: ''
  })

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const driveOk = form.tipo === 'particular'
    ? !!perfil.driveParticulares
    : perfil.driveMode === 'A'
      ? !!perfil.driveCompanias
      : !!perfil.companias?.find(c => c.nombre === form.compania)?.driveLink

  async function handleCreate() {
    if (!form.patente.trim()) { setError('La patente es obligatoria'); return }
    if (!form.clienteNombre.trim()) { setError('El nombre del cliente es obligatorio'); return }
    if (!driveOk) { setError('Configurá el link de Drive en Perfil antes de continuar'); return }
    setLoading(true)
    setError('')
    try {
      const s = await crearSiniestro(form, perfil)
      addSiniestro(s)
      cacheSiniestros([s, ...siniestros])
      navigate(`/siniestro/${s.id}`)
    } catch (e) {
      setError(e.message || 'Error al crear el siniestro')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Screen>
      <TopBar back="Cancelar" title="Nuevo siniestro" action={loading ? null : 'Crear'} onAction={handleCreate} />
      <div style={{ padding: 16 }} className="fade-in">

        <SectionLabel>Tipo</SectionLabel>
        <div style={{ display: 'flex', background: '#1a1a1a', borderRadius: 10, padding: 3, gap: 2, marginBottom: 14 }}>
          {[{ k: 'particular', l: 'Particular' }, { k: 'compania', l: 'Compañía' }].map(t => (
            <button key={t.k} onClick={() => set('tipo', t.k)} style={{
              flex: 1, padding: '8px 0', borderRadius: 8, fontSize: 13, fontWeight: 500,
              background: form.tipo === t.k ? '#242424' : 'transparent',
              color: form.tipo === t.k ? '#1D9E75' : '#666',
              border: form.tipo === t.k ? '0.5px solid rgba(255,255,255,0.1)' : 'none',
              fontFamily: 'inherit', cursor: 'pointer'
            }}>{t.l}</button>
          ))}
        </div>

        {form.tipo === 'compania' && (
          <>
            <Field label="Compañía de seguro">
              <Select value={form.compania} onChange={v => set('compania', v)}>
                {perfil.companias?.map(c => <option key={c.id} value={c.nombre}>{c.nombre}</option>)}
              </Select>
            </Field>
            <Field label="Nro. de siniestro">
              <Input value={form.nroSiniestro} onChange={v => set('nroSiniestro', v)} placeholder="SIN-2024-00123" />
            </Field>
          </>
        )}

        <SectionLabel>Vehículo</SectionLabel>
        <Field label="Patente *">
          <Input value={form.patente} onChange={v => set('patente', v.toUpperCase())} placeholder="AB 123 CD" mono />
        </Field>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <Field label="Marca"><Input value={form.marca} onChange={v => set('marca', v)} placeholder="Toyota" /></Field>
          <Field label="Modelo"><Input value={form.modelo} onChange={v => set('modelo', v)} placeholder="Corolla" /></Field>
          <Field label="Año"><Input value={form.anio} onChange={v => set('anio', v)} placeholder="2020" type="number" /></Field>
          <Field label="Color"><Input value={form.color} onChange={v => set('color', v)} placeholder="Blanco" /></Field>
        </div>

        <SectionLabel>Cliente</SectionLabel>
        <Field label="Nombre completo *">
          <Input value={form.clienteNombre} onChange={v => set('clienteNombre', v)} placeholder="Juan Pérez" />
        </Field>
        <Field label="Teléfono / WhatsApp">
          <Input value={form.clienteTelefono} onChange={v => set('clienteTelefono', v)} placeholder="261 000 0000" type="tel" />
        </Field>
        <Field label="Descripción del daño">
          <Textarea value={form.descripcion} onChange={v => set('descripcion', v)} placeholder="Describí brevemente el daño..." />
        </Field>

        <div style={{
          display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px',
          borderRadius: 10, marginBottom: 14,
          background: driveOk ? 'rgba(29,158,117,0.08)' : 'rgba(226,75,74,0.08)',
          border: `0.5px solid ${driveOk ? 'rgba(29,158,117,0.2)' : 'rgba(226,75,74,0.2)'}`
        }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: driveOk ? '#1D9E75' : '#E24B4A', flexShrink: 0 }} />
          <div style={{ fontSize: 12, color: driveOk ? '#1D9E75' : '#E24B4A' }}>
            {driveOk
              ? `Drive configurado · carpeta ${form.tipo === 'particular' ? 'Particulares' : form.compania}`
              : 'Drive no configurado — andá a Perfil y pegá el link de la carpeta'}
          </div>
        </div>

        {error && <div style={{ color: '#E24B4A', fontSize: 12, marginBottom: 10 }}>{error}</div>}

        <Btn onClick={handleCreate} loading={loading}>
          {!loading && <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12h14"/></svg>}
          Crear siniestro
        </Btn>
        <div style={{ height: 24 }} />
      </div>
    </Screen>
  )
}

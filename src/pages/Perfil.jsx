import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useStore, PROMPT_BASE_DEFAULT_EXPORT } from '../lib/store'
import { signOut } from '../lib/drive'
import { Screen, TopBar } from '../components/layout/Layout'
import { Field, Input } from '../components/ui/Field'
import { Btn } from '../components/ui/Btn'
import { SectionLabel, Card } from '../components/ui/Card'

const COSTOS_FIELDS = [
  { key: 'costo_chapa',        label: 'Chapa',        unit: '$/día' },
  { key: 'costo_pintura',      label: 'Pintura',      unit: '$/paño' },
  { key: 'costo_mecanica',     label: 'Mecánica',     unit: '$/hora' },
  { key: 'costo_electricidad', label: 'Electricidad', unit: '$/hora' },
  { key: 'costo_cristaleria',  label: 'Cristalería',  unit: '$/hora' },
]

const RUBROS_IA = [
  { key: 'chapa',        label: 'Chapa y plancha' },
  { key: 'pintura',      label: 'Pintura' },
  { key: 'mecanica',     label: 'Mecánica' },
  { key: 'electricidad', label: 'Electricidad' },
  { key: 'cristaleria',  label: 'Cristalería' },
]

const RANGOS_FIELDS = [
  { rubro: 'chapa',    label: 'Chapa',    unit: '/día' },
  { rubro: 'pintura',  label: 'Pintura',  unit: '/paño' },
  { rubro: 'mecanica', label: 'Mecánica', unit: '/hora' },
]

export default function Perfil() {
  const navigate = useNavigate()
  const { perfil, setPerfil, user, signOut: storeSignOut } = useStore()
  const [form, setForm] = useState(perfil)
  const [saved, setSaved] = useState(false)
  const [logoLoading, setLogoLoading] = useState(false)
  const [seccion, setSeccion] = useState('taller') // taller | costos | ia | drive
  const logoInputRef = useRef()
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  function guardar() {
    setPerfil(form)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  function handleSignOut() {
    if (!confirm('¿Cerrar sesión?')) return
    signOut()
    storeSignOut()
    localStorage.removeItem('sgtaller_user')
    navigate('/login')
  }

  function handleLogoChange(e) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 500000) { alert('El logo debe ser menor a 500KB'); return }
    setLogoLoading(true)
    const reader = new FileReader()
    reader.onload = ev => { set('logo_url', ev.target.result); setLogoLoading(false) }
    reader.readAsDataURL(file)
  }

  function setRubro(key, val) {
    setForm(f => ({ ...f, ia_rubros: { ...(f.ia_rubros || {}), [key]: val } }))
  }

  function setRango(rubro, minMax, val) {
    setForm(f => ({ ...f, ia_rangos: { ...(f.ia_rangos || {}), [`${rubro}_${minMax}`]: val } }))
  }

  function addCompania() {
    setForm(f => ({ ...f, companias: [...(f.companias || []), { id: Date.now().toString(), nombre: '', driveLink: '' }] }))
  }
  function updateCompania(id, field, value) {
    setForm(f => ({ ...f, companias: f.companias.map(c => c.id === id ? { ...c, [field]: value } : c) }))
  }
  function removeCompania(id) {
    setForm(f => ({ ...f, companias: f.companias.filter(c => c.id !== id) }))
  }

  const tabs = [
    { key: 'taller', label: 'Taller' },
    { key: 'costos', label: 'Costos' },
    { key: 'ia',     label: '🤖 IA' },
    { key: 'drive',  label: 'Drive' },
  ]

  const tabStyle = (k) => ({
    flex: 1, padding: '8px 4px', borderRadius: 8, fontSize: 12, fontWeight: 500,
    background: seccion === k ? '#242424' : 'transparent',
    color: seccion === k ? '#1D9E75' : '#555',
    border: seccion === k ? '0.5px solid rgba(255,255,255,0.1)' : 'none',
    fontFamily: 'inherit', cursor: 'pointer'
  })

  return (
    <Screen>
      <TopBar title="Perfil" action={saved ? '✓ Guardado' : 'Guardar'} onAction={guardar} />
      <div style={{ padding: 16 }} className="fade-in">

        {/* Avatar */}
        <div style={{ textAlign: 'center', marginBottom: 20 }}>
          {user?.picture
            ? <img src={user.picture} alt="" style={{ width: 52, height: 52, borderRadius: '50%', border: '2px solid #1D9E75' }} />
            : <div style={{ width: 52, height: 52, borderRadius: '50%', background: 'rgba(29,158,117,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto', fontSize: 20, fontWeight: 600, color: '#1D9E75' }}>{user?.name?.[0] || 'T'}</div>
          }
          <div style={{ fontSize: 14, fontWeight: 500, color: '#f0f0f0', marginTop: 8 }}>{user?.name}</div>
          <div style={{ fontSize: 11, color: '#555' }}>{user?.email}</div>
        </div>

        {/* Tabs de navegación */}
        <div style={{ display: 'flex', background: '#1a1a1a', borderRadius: 10, padding: 3, gap: 2, marginBottom: 20 }}>
          {tabs.map(t => <button key={t.key} onClick={() => setSeccion(t.key)} style={tabStyle(t.key)}>{t.label}</button>)}
        </div>

        {/* ── SECCIÓN TALLER ── */}
        {seccion === 'taller' && (
          <>
            {/* Logo */}
            <SectionLabel>Logo del taller</SectionLabel>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
              <div onClick={() => logoInputRef.current?.click()} style={{
                width: 76, height: 76, borderRadius: 14, overflow: 'hidden', flexShrink: 0,
                background: '#1a1a1a', border: form.logo_url ? '1.5px solid #1D9E75' : '1.5px dashed rgba(255,255,255,0.15)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer'
              }}>
                {logoLoading
                  ? <svg width="22" height="22" viewBox="0 0 24 24" fill="none" style={{ animation: 'spin 0.8s linear infinite' }}><circle cx="12" cy="12" r="10" stroke="#333" strokeWidth="2"/><path d="M12 2a10 10 0 0 1 10 10" stroke="#1D9E75" strokeWidth="2" strokeLinecap="round"/></svg>
                  : form.logo_url
                    ? <img src={form.logo_url} alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'contain', padding: 4 }} />
                    : <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#333" strokeWidth="1.5"><rect x="3" y="3" width="18" height="18" rx="3"/><path d="M9 8h6M9 12h6M9 16h4"/></svg>
                }
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 11, color: '#666', marginBottom: 8, lineHeight: 1.5 }}>
                  Aparece en el header de todos los PDFs.<br/>JPG o PNG · Máx 500KB
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={() => logoInputRef.current?.click()} style={{ flex: 1, padding: '7px', borderRadius: 8, fontSize: 12, fontWeight: 500, background: 'rgba(29,158,117,0.08)', color: '#1D9E75', border: '0.5px solid rgba(29,158,117,0.25)', fontFamily: 'inherit', cursor: 'pointer' }}>
                    {form.logo_url ? 'Cambiar' : 'Subir logo'}
                  </button>
                  {form.logo_url && (
                    <button onClick={() => set('logo_url', '')} style={{ padding: '7px 12px', borderRadius: 8, fontSize: 12, background: 'rgba(226,75,74,0.08)', color: '#E24B4A', border: '0.5px solid rgba(226,75,74,0.2)', fontFamily: 'inherit', cursor: 'pointer' }}>Quitar</button>
                  )}
                </div>
              </div>
              <input ref={logoInputRef} type="file" accept="image/jpeg,image/png,image/webp" style={{ display: 'none' }} onChange={handleLogoChange} />
            </div>

            <SectionLabel>Datos del taller</SectionLabel>
            <Field label="Nombre del taller"><Input value={form.nombre} onChange={v => set('nombre', v)} placeholder="Taller Lopez" /></Field>
            <Field label="CUIT"><Input value={form.cuit} onChange={v => set('cuit', v)} placeholder="20-12345678-9" /></Field>
            <Field label="Teléfono / WhatsApp"><Input value={form.telefono} onChange={v => set('telefono', v)} placeholder="261 555 1234" type="tel" /></Field>
            <Field label="Dirección"><Input value={form.direccion} onChange={v => set('direccion', v)} placeholder="San Martín 1234, Mendoza" /></Field>
          </>
        )}

        {/* ── SECCIÓN COSTOS ── */}
        {seccion === 'costos' && (
          <>
            <SectionLabel>Costos por rubro</SectionLabel>
            <div style={{ background: 'rgba(29,158,117,0.06)', border: '0.5px solid rgba(29,158,117,0.15)', borderRadius: 10, padding: '10px 12px', marginBottom: 14, fontSize: 12, color: '#1D9E75' }}>
              Estos valores calculan automáticamente el subtotal en el presupuesto y mejoran la estimación de la IA.
            </div>
            {COSTOS_FIELDS.map(f => (
              <div key={f.key} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 11, color: '#888', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 500 }}>{f.label}</div>
                  <div style={{ position: 'relative' }}>
                    <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', fontSize: 13, color: '#555' }}>$</span>
                    <input type="number" value={form[f.key] || ''} onChange={e => set(f.key, e.target.value)} placeholder="0"
                      style={{ width: '100%', background: '#1a1a1a', border: '0.5px solid rgba(255,255,255,0.1)', borderRadius: 10, padding: '10px 12px 10px 24px', fontSize: 14, color: '#1D9E75', fontFamily: "'JetBrains Mono', monospace" }} />
                  </div>
                </div>
                <div style={{ fontSize: 11, color: '#444', marginTop: 18, flexShrink: 0, width: 52 }}>{f.unit}</div>
              </div>
            ))}
            {COSTOS_FIELDS.some(f => form[f.key]) && (
              <Card>
                <div style={{ fontSize: 11, color: '#555', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Vista previa</div>
                {COSTOS_FIELDS.filter(f => form[f.key]).map(f => (
                  <div key={f.key} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontSize: 12, borderBottom: '0.5px solid rgba(255,255,255,0.05)' }}>
                    <span style={{ color: '#888' }}>{f.label}</span>
                    <span style={{ color: '#f0f0f0', fontFamily: "'JetBrains Mono',monospace" }}>${Number(form[f.key]).toLocaleString('es-AR')} {f.unit}</span>
                  </div>
                ))}
              </Card>
            )}
          </>
        )}

        {/* ── SECCIÓN IA ── */}
        {seccion === 'ia' && (
          <>
            <SectionLabel>Configuración del Análisis IA</SectionLabel>
            <div style={{ background: 'rgba(29,158,117,0.06)', border: '0.5px solid rgba(29,158,117,0.15)', borderRadius: 10, padding: '10px 12px', marginBottom: 16, fontSize: 12, color: '#1D9E75' }}>
              Personalizá cómo la IA analiza los daños de tu taller. Sin redeploy — cambia acá y se aplica de inmediato.
            </div>

            {/* Contexto del taller */}
            <Field label="Contexto del taller">
              <textarea value={form.ia_contexto || ''} onChange={e => set('ia_contexto', e.target.value)}
                placeholder="Ej: Taller especializado en chapa y pintura en Mendoza capital. Trabajamos principalmente con compañías de seguros. Más de 15 años de experiencia..."
                rows={3} style={{ width: '100%', background: '#1a1a1a', border: '0.5px solid rgba(255,255,255,0.1)', borderRadius: 10, padding: '10px 12px', fontSize: 13, color: '#f0f0f0', fontFamily: 'inherit', resize: 'none' }} />
            </Field>

            {/* Rubros que trabajan */}
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 11, color: '#888', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 500 }}>Rubros que trabaja el taller</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {RUBROS_IA.map(r => (
                  <div key={r.key} onClick={() => setRubro(r.key, !form.ia_rubros?.[r.key])}
                    style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', background: '#1a1a1a', borderRadius: 10, cursor: 'pointer', border: form.ia_rubros?.[r.key] ? '0.5px solid rgba(29,158,117,0.3)' : '0.5px solid rgba(255,255,255,0.06)' }}>
                    <div style={{ width: 20, height: 20, borderRadius: 5, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: form.ia_rubros?.[r.key] ? '#1D9E75' : '#242424', border: form.ia_rubros?.[r.key] ? '1.5px solid #1D9E75' : '1.5px solid #444' }}>
                      {form.ia_rubros?.[r.key] && <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>}
                    </div>
                    <span style={{ fontSize: 13, color: form.ia_rubros?.[r.key] ? '#f0f0f0' : '#666' }}>{r.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Rangos de precios orientativos */}
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 11, color: '#888', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 500 }}>Rangos de precios orientativos</div>
              <div style={{ fontSize: 11, color: '#444', marginBottom: 10 }}>La IA usará estos rangos para estimar costos más precisos</div>
              {RANGOS_FIELDS.filter(r => form.ia_rubros?.[r.rubro] !== false).map(r => (
                <div key={r.rubro} style={{ marginBottom: 10 }}>
                  <div style={{ fontSize: 11, color: '#666', marginBottom: 5 }}>{r.label} ({r.unit})</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                    <div style={{ position: 'relative' }}>
                      <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', fontSize: 11, color: '#555' }}>$ mín</span>
                      <input type="number" value={form.ia_rangos?.[`${r.rubro}_min`] || ''}
                        onChange={e => setRango(r.rubro, 'min', e.target.value)}
                        style={{ width: '100%', background: '#1a1a1a', border: '0.5px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: '8px 8px 8px 42px', fontSize: 13, color: '#f0f0f0', fontFamily: "'JetBrains Mono',monospace" }} />
                    </div>
                    <div style={{ position: 'relative' }}>
                      <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', fontSize: 11, color: '#555' }}>$ máx</span>
                      <input type="number" value={form.ia_rangos?.[`${r.rubro}_max`] || ''}
                        onChange={e => setRango(r.rubro, 'max', e.target.value)}
                        style={{ width: '100%', background: '#1a1a1a', border: '0.5px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: '8px 8px 8px 42px', fontSize: 13, color: '#f0f0f0', fontFamily: "'JetBrains Mono',monospace" }} />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Instrucciones adicionales */}
            <Field label="Instrucciones adicionales para la IA">
              <textarea value={form.ia_instrucciones || ''} onChange={e => set('ia_instrucciones', e.target.value)}
                placeholder="Ej: Siempre incluir mano de obra general. No cotizar repuestos de vidrios. Priorizar reparación sobre cambio cuando sea posible. Incluir observación sobre piezas que requieren autorización..."
                rows={4} style={{ width: '100%', background: '#1a1a1a', border: '0.5px solid rgba(255,255,255,0.1)', borderRadius: 10, padding: '10px 12px', fontSize: 13, color: '#f0f0f0', fontFamily: 'inherit', resize: 'none' }} />
            </Field>


            <div style={{ marginBottom: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <div style={{ fontSize: 11, color: '#888', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 500 }}>Prompt base del equipo de peritos</div>
                <button onClick={() => set('ia_prompt_base', PROMPT_BASE_DEFAULT_EXPORT)} style={{ fontSize: 11, color: '#1D9E75', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>Restaurar default</button>
              </div>
              <div style={{ fontSize: 11, color: '#444', marginBottom: 8 }}>Editá las instrucciones que recibe la IA. Sin redeploy.</div>
              <textarea value={form.ia_prompt_base || ''} onChange={e => set('ia_prompt_base', e.target.value)}
                rows={8} style={{ width: '100%', background: '#111', border: '0.5px solid rgba(255,255,255,0.08)', borderRadius: 10, padding: '10px 12px', fontSize: 11, color: '#888', fontFamily: 'monospace', resize: 'vertical', lineHeight: 1.5 }} />
            </div>
            {/* Preview del prompt */}
            <Card style={{ marginBottom: 8 }}>
              <div style={{ fontSize: 11, color: '#555', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Estado de configuración</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {[
                  [!!form.ia_contexto, 'Contexto del taller'],
                  [Object.values(form.ia_rubros || {}).some(Boolean), 'Rubros configurados'],
                  [Object.values(form.ia_rangos || {}).some(Boolean), 'Rangos de precios'],
                  [!!form.ia_instrucciones, 'Instrucciones adicionales'],
                  [!!(form.costo_chapa || form.costo_pintura), 'Costos del taller (de pestaña Costos)'],
                ].map(([ok, label]) => (
                  <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12 }}>
                    <div style={{ width: 6, height: 6, borderRadius: '50%', background: ok ? '#1D9E75' : '#333', flexShrink: 0 }} />
                    <span style={{ color: ok ? '#888' : '#444' }}>{label}</span>
                    {ok && <span style={{ fontSize: 10, color: '#1D9E75', marginLeft: 'auto' }}>✓</span>}
                  </div>
                ))}
              </div>
            </Card>
          </>
        )}

        {/* ── SECCIÓN DRIVE ── */}
        {seccion === 'drive' && (
          <>
            <SectionLabel>Modo de organización</SectionLabel>
            <div style={{ display: 'flex', background: '#1a1a1a', borderRadius: 10, padding: 3, gap: 2, marginBottom: 8 }}>
              {[{ key: 'A', label: 'Carpeta única' }, { key: 'B', label: 'Por compañía' }].map(m => (
                <button key={m.key} onClick={() => set('driveMode', m.key)} style={{ flex: 1, padding: '8px', borderRadius: 8, fontSize: 12, fontWeight: 500, background: form.driveMode === m.key ? '#242424' : 'transparent', color: form.driveMode === m.key ? '#1D9E75' : '#666', border: form.driveMode === m.key ? '0.5px solid rgba(255,255,255,0.1)' : 'none', fontFamily: 'inherit', cursor: 'pointer' }}>{m.label}</button>
              ))}
            </div>
            <div style={{ fontSize: 11, color: '#444', marginBottom: 14 }}>
              {form.driveMode === 'A' ? 'Todos los siniestros de compañías van a una sola carpeta' : 'Cada compañía tiene su propia carpeta en Drive'}
            </div>

            <Field label="Carpeta Particulares (link Drive)">
              <Input value={form.driveParticulares} onChange={v => set('driveParticulares', v)} placeholder="https://drive.google.com/drive/folders/..." />
            </Field>

            {form.driveMode === 'A' && (
              <Field label="Carpeta Compañías (link Drive)">
                <Input value={form.driveCompanias} onChange={v => set('driveCompanias', v)} placeholder="https://drive.google.com/drive/folders/..." />
              </Field>
            )}

            {form.driveMode === 'B' && (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <div style={{ fontSize: 11, color: '#555', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 500 }}>Compañías</div>
                  <button onClick={addCompania} style={{ fontSize: 12, color: '#1D9E75', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>+ Agregar</button>
                </div>
                {(form.companias || []).map(c => (
                  <div key={c.id} style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8 }}>
                    <input value={c.nombre} onChange={e => updateCompania(c.id, 'nombre', e.target.value)} placeholder="Nombre" style={{ width: 100, background: '#1a1a1a', border: '0.5px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: '8px 10px', fontSize: 12, color: '#f0f0f0', fontFamily: 'inherit', flexShrink: 0 }} />
                    <input value={c.driveLink} onChange={e => updateCompania(c.id, 'driveLink', e.target.value)} placeholder="Link Drive..." style={{ flex: 1, background: '#1a1a1a', border: '0.5px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: '8px 10px', fontSize: 12, color: '#f0f0f0', fontFamily: 'inherit' }} />
                    <button onClick={() => removeCompania(c.id)} style={{ background: 'none', border: 'none', color: '#444', cursor: 'pointer', fontSize: 18, flexShrink: 0 }}>×</button>
                  </div>
                ))}
              </>
            )}
          </>
        )}

        <div style={{ height: 16 }} />
        <Btn onClick={guardar}>{saved ? '✓ Guardado' : 'Guardar configuración'}</Btn>
        <div style={{ height: 10 }} />
        <Btn onClick={handleSignOut} variant="danger">Cerrar sesión</Btn>
        <div style={{ height: 32 }} />
      </div>
    </Screen>
  )
}

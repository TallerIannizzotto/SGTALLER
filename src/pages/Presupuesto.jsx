import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useStore } from '../lib/store'
import { guardarSiniestro, subirPDF, cacheSiniestros } from '../lib/siniestroService'
import { generatePresupuesto } from '../lib/pdf'
import { Screen } from '../components/layout/Layout'
import { Btn } from '../components/ui/Btn'

const TIPOS_DANO = [
  { value: 'reparar',   label: 'Reparar' },
  { value: 'cambiar',   label: 'Cambiar' },
  { value: 'pintar',    label: 'Pintar' },
  { value: 'desmontar', label: 'Desmontar' },
  { value: 'difuminar', label: 'Difuminar' },
]

const itemVacio = () => ({
  id: `${Date.now()}${Math.random()}`,
  pieza: '', tipo_trabajo: 'reparar',
  chapa: 0, pintura: 0, mecanica: 0, electricidad: 0, cristaleria: 0,
  repuestos: 0, subcontratos: 0, subtotal: 0, incluirF02: true,
})

function calcSubtotal(item, p) {
  return (parseFloat(item.chapa)        || 0) * (parseFloat(p?.costo_chapa)        || 0)
       + (parseFloat(item.pintura)      || 0) * (parseFloat(p?.costo_pintura)      || 0)
       + (parseFloat(item.mecanica)     || 0) * (parseFloat(p?.costo_mecanica)     || 0)
       + (parseFloat(item.electricidad) || 0) * (parseFloat(p?.costo_electricidad) || 0)
       + (parseFloat(item.cristaleria)  || 0) * (parseFloat(p?.costo_cristaleria)  || 0)
       + (parseFloat(item.repuestos)    || 0)
       + (parseFloat(item.subcontratos) || 0)
}

const cell = { padding: '4px 3px' }
const th = (w, align='center') => ({
  padding: '7px 4px', fontSize: 10, color: '#666', fontWeight: 600,
  textAlign: align, whiteSpace: 'nowrap', width: w, minWidth: w,
  borderBottom: '0.5px solid rgba(255,255,255,0.08)', background: '#111'
})
const inp = (extra={}) => ({
  background: '#242424', border: '0.5px solid rgba(255,255,255,0.08)',
  borderRadius: 6, color: '#f0f0f0', fontSize: 12, padding: '5px 6px',
  fontFamily: 'inherit', width: '100%', textAlign: 'center', ...extra
})

export default function Presupuesto() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { siniestros, updateSiniestro, perfil } = useStore()
  const siniestro = siniestros.find(s => s.id === id)

  const initVersiones = siniestro?.presupuestoVersiones?.length
    ? siniestro.presupuestoVersiones
    : [{ v: 1, items: [itemVacio()], notas: '' }]

  const [versiones, setVersiones] = useState(initVersiones)
  const [vIdx, setVIdx] = useState(0)
  const [saving, setSaving] = useState(false)
  const [generando, setGenerando] = useState(false)

  const ver = versiones[vIdx] || versiones[0]
  const items = ver.items
  const notas = ver.notas
  const costosOk = !!(perfil?.costo_chapa || perfil?.costo_pintura || perfil?.costo_mecanica)
  const total = items.reduce((a, i) => a + (parseFloat(i.subtotal) || 0), 0)

  // Recalcular al cambiar costos del perfil
  useEffect(() => {
    setVersiones(prev => prev.map(v => ({
      ...v, items: v.items.map(i => ({ ...i, subtotal: calcSubtotal(i, perfil) }))
    })))
  }, [perfil?.costo_chapa, perfil?.costo_pintura, perfil?.costo_mecanica,
      perfil?.costo_electricidad, perfil?.costo_cristaleria])

  function updVer(fn) {
    setVersiones(prev => prev.map((v, i) => i === vIdx ? fn(v) : v))
  }

  function setItem(idx, field, value) {
    updVer(v => ({
      ...v, items: v.items.map((it, i) => {
        if (i !== idx) return it
        const u = { ...it, [field]: value }
        u.subtotal = calcSubtotal(u, perfil)
        return u
      })
    }))
  }

  function addItem() { updVer(v => ({ ...v, items: [...v.items, itemVacio()] })) }
  function removeItem(idx) { updVer(v => ({ ...v, items: v.items.filter((_, i) => i !== idx) })) }
  function setNotas(val) { updVer(v => ({ ...v, notas: val })) }

  function nuevaVersion() {
    const nueva = { v: versiones.length + 1, items: [itemVacio()], notas: '' }
    setVersiones(prev => [...prev, nueva])
    setVIdx(versiones.length)
  }

  async function guardar() {
    setSaving(true)
    const updated = { ...siniestro, presupuestoVersiones: versiones, presupuesto: items }
    updateSiniestro(id, { presupuestoVersiones: versiones, presupuesto: items })
    cacheSiniestros(useStore.getState().siniestros)
    await guardarSiniestro(updated).catch(console.error)
    setSaving(false)
  }

  async function compartirPDF() {
    setGenerando(true)
    try {
      await guardar()
      const buffer = generatePresupuesto(siniestro, items, perfil, ver.v, notas)
      const blob = new Blob([buffer], { type: 'application/pdf' })
      const fileName = `Presupuesto_v${ver.v}_${siniestro.patente.replace(/\s/g, '-')}.pdf`
      const file = new File([blob], fileName, { type: 'application/pdf' })
      if (navigator.share && navigator.canShare?.({ files: [file] })) {
        await navigator.share({ title: fileName, files: [file] })
      } else {
        await subirPDF(siniestro, buffer, fileName).catch(() => {})
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url; a.download = fileName; a.click()
        URL.revokeObjectURL(url)
      }
    } catch (e) {
      if (e.name !== 'AbortError') alert('Error al generar PDF: ' + e.message)
    } finally {
      setGenerando(false)
    }
  }

  return (
    <Screen noBottom>
      {/* Header */}
      <header style={{ position: 'sticky', top: 0, zIndex: 50, background: 'rgba(15,15,15,0.97)', backdropFilter: 'blur(12px)', borderBottom: '0.5px solid rgba(255,255,255,0.08)', padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
        <button onClick={() => navigate(`/siniestro/${id}`)} style={{ background: 'none', border: 'none', color: '#1D9E75', fontSize: 13, display: 'flex', alignItems: 'center', gap: 4, padding: 0, cursor: 'pointer', fontFamily: 'inherit', flexShrink: 0 }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m15 18-6-6 6-6"/></svg>Volver
        </button>
        <span style={{ fontSize: 13, fontWeight: 600, color: '#f0f0f0', fontFamily: "'JetBrains Mono',monospace" }}>
          Presupuesto · {siniestro?.patente}
        </span>
        <button onClick={guardar} style={{ background: 'none', border: 'none', color: '#1D9E75', fontSize: 13, fontWeight: 500, padding: 0, cursor: 'pointer', fontFamily: 'inherit' }}>
          {saving ? '...' : 'Guardar'}
        </button>
      </header>

      <div style={{ padding: '12px 12px 130px' }} className="fade-in">

        {/* Versiones */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 11, color: '#555' }}>Versión:</span>
          {versiones.map((v, i) => (
            <button key={i} onClick={() => setVIdx(i)} style={{ padding: '4px 12px', borderRadius: 8, fontSize: 12, fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer', background: vIdx === i ? '#1D9E75' : '#1a1a1a', color: vIdx === i ? '#fff' : '#555', border: vIdx === i ? '0.5px solid #0F6E56' : '0.5px solid rgba(255,255,255,0.08)' }}>v{v.v}</button>
          ))}
          <button onClick={nuevaVersion} style={{ padding: '4px 10px', borderRadius: 8, fontSize: 12, background: 'transparent', color: '#1D9E75', border: '0.5px solid rgba(29,158,117,0.3)', fontFamily: 'inherit', cursor: 'pointer' }}>+ Nueva versión</button>
        </div>

        {/* Aviso costos */}
        {!costosOk && (
          <div onClick={() => navigate('/perfil')} style={{ background: 'rgba(239,159,39,0.08)', border: '0.5px solid rgba(239,159,39,0.25)', borderRadius: 10, padding: '10px 14px', marginBottom: 12, fontSize: 12, color: '#EF9F27', cursor: 'pointer' }}>
            ⚠️ No tenés costos configurados — los subtotales serán $0. <span style={{ textDecoration: 'underline', fontWeight: 600 }}>Configurar en Perfil →</span>
          </div>
        )}

        {/* Tabla */}
        <div style={{ background: '#1a1a1a', border: '0.5px solid rgba(255,255,255,0.08)', borderRadius: 12, overflow: 'hidden', marginBottom: 10 }}>
          <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 780 }}>
              <thead>
                <tr>
                  <th style={th(140, 'left')}>Pieza</th>
                  <th style={th(90, 'left')}>Tipo daño</th>
                  <th style={th(52)}>Chapa</th>
                  <th style={th(52)}>Pintura</th>
                  <th style={th(52)}>Mecánica</th>
                  <th style={th(52)}>Electr.</th>
                  <th style={th(52)}>Crist.</th>
                  <th style={th(75, 'right')}>Repuestos</th>
                  <th style={th(75, 'right')}>Subcontr.</th>
                  <th style={th(82, 'right')}>Subtotal</th>
                  <th style={th(28)}></th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, idx) => (
                  <tr key={item.id} style={{ borderTop: '0.5px solid rgba(255,255,255,0.05)', background: idx % 2 === 0 ? '#1a1a1a' : '#1e1e1e' }}>
                    <td style={{ ...cell, minWidth: 140, paddingLeft: 6 }}>
                      <input value={item.pieza} onChange={e => setItem(idx, 'pieza', e.target.value)} placeholder="Pieza..." style={{ ...inp({ textAlign: 'left', width: 130 }) }} />
                    </td>
                    <td style={{ ...cell, minWidth: 90 }}>
                      <select value={item.tipo_trabajo} onChange={e => setItem(idx, 'tipo_trabajo', e.target.value)} style={{ ...inp({ width: 86 }) }}>
                        {TIPOS_DANO.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                      </select>
                    </td>
                    {['chapa','pintura','mecanica','electricidad','cristaleria'].map(campo => (
                      <td key={campo} style={cell}>
                        <input type="number" min="0" value={item[campo]} onChange={e => setItem(idx, campo, e.target.value)} style={{ ...inp({ width: 46 }) }} />
                      </td>
                    ))}
                    {['repuestos','subcontratos'].map(campo => (
                      <td key={campo} style={cell}>
                        <input type="number" min="0" value={item[campo]} onChange={e => setItem(idx, campo, e.target.value)} style={{ ...inp({ width: 70, textAlign: 'right', fontFamily: "'JetBrains Mono',monospace" }) }} />
                      </td>
                    ))}
                    <td style={{ ...cell, textAlign: 'right', paddingRight: 8, whiteSpace: 'nowrap' }}>
                      <span style={{ fontSize: 12, fontWeight: 600, color: '#1D9E75', fontFamily: "'JetBrains Mono',monospace" }}>
                        ${parseFloat(item.subtotal || 0).toLocaleString('es-AR')}
                      </span>
                    </td>
                    <td style={{ ...cell, textAlign: 'center' }}>
                      <button onClick={() => removeItem(idx)} style={{ background: 'none', border: 'none', color: '#444', cursor: 'pointer', fontSize: 18, lineHeight: 1, padding: 2 }}>×</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Footer tabla */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', borderTop: '0.5px solid rgba(255,255,255,0.08)' }}>
            <button onClick={addItem} style={{ background: 'rgba(29,158,117,0.06)', border: '1px dashed rgba(29,158,117,0.25)', borderRadius: 8, padding: '6px 14px', fontSize: 12, color: '#1D9E75', fontFamily: 'inherit', cursor: 'pointer' }}>+ Agregar ítem</button>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 10, color: '#555' }}>Total estimado</div>
              <div style={{ fontSize: 22, fontWeight: 700, color: '#1D9E75', fontFamily: "'JetBrains Mono',monospace" }}>
                ${total.toLocaleString('es-AR')}
              </div>
            </div>
          </div>
        </div>

        {/* Costos de referencia */}
        {costosOk && (
          <div style={{ background: '#111', border: '0.5px solid rgba(255,255,255,0.06)', borderRadius: 10, padding: '10px 14px', marginBottom: 12 }}>
            <div style={{ fontSize: 10, color: '#444', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Costos configurados</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px 16px' }}>
              {[['Chapa', perfil.costo_chapa, '/día'], ['Pintura', perfil.costo_pintura, '/paño'], ['Mecánica', perfil.costo_mecanica, '/h'], ['Electr.', perfil.costo_electricidad, '/h'], ['Crist.', perfil.costo_cristaleria, '/h']].filter(([, v]) => v).map(([label, val, unit]) => (
                <span key={label} style={{ fontSize: 11, color: '#666' }}>{label}: <span style={{ color: '#888', fontFamily: "'JetBrains Mono',monospace" }}>${Number(val).toLocaleString('es-AR')}{unit}</span></span>
              ))}
            </div>
          </div>
        )}

        {/* Notas */}
        <div style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 11, color: '#555', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 500 }}>Notas adicionales</div>
          <textarea value={notas} onChange={e => setNotas(e.target.value)} placeholder="Notas para el cliente..." rows={3}
            style={{ width: '100%', background: '#1a1a1a', border: '0.5px solid rgba(255,255,255,0.08)', borderRadius: 10, padding: '10px 12px', fontSize: 13, color: '#f0f0f0', fontFamily: 'inherit', resize: 'none' }} />
        </div>
      </div>

      {/* Bottom fixed */}
      <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: 'rgba(15,15,15,0.97)', backdropFilter: 'blur(12px)', borderTop: '0.5px solid rgba(255,255,255,0.08)', padding: '12px 16px', display: 'flex', gap: 10 }}>
        <Btn variant="outline" onClick={compartirPDF} loading={generando} style={{ flex: 1 }}>
          {!generando && <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>}
          {!generando && 'Compartir PDF'}
        </Btn>
        <Btn onClick={guardar} loading={saving} style={{ flex: 1 }}>
          {!saving && <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>}
          {!saving && 'Guardar'}
        </Btn>
      </div>
    </Screen>
  )
}

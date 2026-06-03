import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { useStore } from '../lib/store'
import { guardarSiniestro, subirPDF, cacheSiniestros } from '../lib/siniestroService'
import { generateF02 } from '../lib/pdf'
import { Screen, TopBar } from '../components/layout/Layout'
import { Btn } from '../components/ui/Btn'
import { Card, SectionLabel } from '../components/ui/Card'

export default function F02() {
  const { id } = useParams()
  const { siniestros, updateSiniestro, perfil } = useStore()
  const siniestro = siniestros.find(s => s.id === id)
  const [loading, setLoading] = useState(false)
  const items = siniestro?.presupuesto || []
  const itemsF02 = items.filter(i => i.incluirF02)
  const total = itemsF02.reduce((acc, i) => acc + Number(i.subtotal || 0), 0)

  async function generar() {
    if (!itemsF02.length) {
      alert('No hay ítems tildados. Andá a Presupuesto y tildá los ítems a incluir en la orden.')
      return
    }
    setLoading(true)
    try {
      const buffer = generateF02(siniestro, items, perfil)
      const blob = new Blob([buffer], { type: 'application/pdf' })
      await subirPDF(siniestro, buffer, `F02_orden_${siniestro.patente.replace(/\s/g,'-')}.pdf`)
      const updated = { ...siniestro, f02Generado: true }
      updateSiniestro(id, { f02Generado: true })
      cacheSiniestros(useStore.getState().siniestros)
      await guardarSiniestro(updated)
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `F02_${siniestro.patente.replace(/\s/g,'-')}.pdf`
      a.click()
      URL.revokeObjectURL(url)
    } catch (e) {
      alert('Error: ' + e.message)
    } finally {
      setLoading(false)
    }
  }

  function compartirWhatsApp() {
    const lineas = itemsF02.map(i => `• ${i.descripcion}: $${Number(i.subtotal).toLocaleString('es-AR')}`).join('\n')
    const texto = `*SGTaller — Orden de Trabajo F02*\n\nVehículo: ${siniestro?.marca} ${siniestro?.modelo} ${siniestro?.anio}\nPatente: *${siniestro?.patente}*\nCliente: ${siniestro?.clienteNombre}\n${siniestro?.nroSiniestro ? `Nro Siniestro: ${siniestro.nroSiniestro}\n` : ''}\n*Trabajos autorizados:*\n${lineas}\n\n*TOTAL: $${total.toLocaleString('es-AR')}*`
    window.open(`https://wa.me/?text=${encodeURIComponent(texto)}`, '_blank')
  }

  return (
    <Screen>
      <TopBar back="Volver" title="F02 — Orden de trabajo" />
      <div style={{ padding: 16 }} className="fade-in">
        <div style={{
          background: 'rgba(29,158,117,0.06)', border: '0.5px solid rgba(29,158,117,0.2)',
          borderRadius: 10, padding: '10px 12px', marginBottom: 14, fontSize: 12, color: '#1D9E75'
        }}>
          Generado desde presupuesto aprobado · solo ítems tildados
        </div>

        <Card style={{ marginBottom: 14 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, fontSize: 12 }}>
            <div><span style={{ color: '#555' }}>Patente: </span><strong style={{ fontFamily: "'JetBrains Mono',monospace" }}>{siniestro?.patente}</strong></div>
            <div><span style={{ color: '#555' }}>Cliente: </span><strong>{siniestro?.clienteNombre}</strong></div>
            <div><span style={{ color: '#555' }}>Tipo: </span><strong>{siniestro?.tipo === 'compania' ? siniestro?.compania : 'Particular'}</strong></div>
            {siniestro?.nroSiniestro && <div><span style={{ color: '#555' }}>Nro: </span><strong>{siniestro.nroSiniestro}</strong></div>}
          </div>
        </Card>

        <SectionLabel>Trabajos autorizados ({itemsF02.length})</SectionLabel>
        {itemsF02.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '24px 20px', color: '#444', fontSize: 13 }}>
            No hay ítems tildados.<br />Andá a Presupuesto y tildá los trabajos a incluir.
          </div>
        ) : (
          <Card>
            {itemsF02.map((item, i) => (
              <div key={item.id} style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '9px 0',
                borderBottom: i < itemsF02.length - 1 ? '0.5px solid rgba(255,255,255,0.06)' : 'none'
              }}>
                <span style={{ fontSize: 13, color: '#ccc' }}>{item.descripcion}</span>
                <span style={{ fontSize: 13, fontFamily: "'JetBrains Mono',monospace", color: '#f0f0f0', flexShrink: 0, marginLeft: 12 }}>
                  ${Number(item.subtotal).toLocaleString('es-AR')}
                </span>
              </div>
            ))}
          </Card>
        )}

        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          margin: '14px 0 16px', padding: '0 2px'
        }}>
          <span style={{ fontSize: 14, color: '#888' }}>Total orden</span>
          <span style={{ fontSize: 26, fontWeight: 600, color: '#f0f0f0', fontFamily: "'JetBrains Mono',monospace" }}>
            ${total.toLocaleString('es-AR')}
          </span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <Btn onClick={generar} loading={loading}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="7 10 12 15 17 10"/>
              <line x1="12" y1="15" x2="12" y2="3"/>
            </svg>
            Generar F02 y subir a Drive
          </Btn>
          <Btn variant="outline" onClick={compartirWhatsApp}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
            </svg>
            Compartir por WhatsApp
          </Btn>
        </div>
        <div style={{ height: 24 }} />
      </div>
    </Screen>
  )
}

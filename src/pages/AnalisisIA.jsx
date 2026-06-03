import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useStore } from '../lib/store'
import { guardarSiniestro, cacheSiniestros } from '../lib/siniestroService'
import { buildMessages } from '../lib/iaPrompt'
import { getImageAsBase64 } from '../lib/drive'
import { Screen, TopBar } from '../components/layout/Layout'
import { Btn } from '../components/ui/Btn'
import { Card, SectionLabel } from '../components/ui/Card'

const SEVERIDAD_COLOR = {
  leve: '#1D9E75', media: '#EF9F27', alta: '#E24B4A', 'no especificada': '#555'
}

export default function AnalisisIA() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { siniestros, updateSiniestro, perfil } = useStore()
  const siniestro = siniestros.find(s => s.id === id)
  const [loading, setLoading] = useState(false)
  const [loadingMsg, setLoadingMsg] = useState('')
  const [error, setError] = useState('')
  const ia = siniestro?.analisisIA
  const fotos = siniestro?.fotos || []

  async function analizar() {
    setLoading(true)
    setError('')

    try {
      // Paso 1 — Cargar fotos de Drive
      let fotosBase64 = []
      if (fotos.length > 0) {
        setLoadingMsg(`Cargando ${fotos.length} foto${fotos.length > 1 ? 's' : ''}...`)
        const MAX_FOTOS = 5 // Claude Vision acepta hasta 5 imágenes por llamada
        const fotosAAnalizar = fotos.slice(0, MAX_FOTOS)
        const resultados = await Promise.all(
          fotosAAnalizar.map(f => f.id ? getImageAsBase64(f.id) : null)
        )
        fotosBase64 = resultados.filter(Boolean)
        setLoadingMsg(`Analizando con equipo de peritos IA...`)
      } else {
        setLoadingMsg('Analizando descripción del daño...')
      }

      // Paso 2 — Llamar a Claude Vision
      const messages = buildMessages(siniestro, perfil, fotosBase64)

      const res = await fetch('/api/analizar', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'claude-opus-4-6',
          max_tokens: 4000,
          messages
        })
      })

      let resultado
      if (res.ok) {
        const data = await res.json()
        const text = data.content?.[0]?.text || ''
        try {
          const clean = text.replace(/```json|```/g, '').trim()
          resultado = JSON.parse(clean)
        } catch {
          const match = text.match(/\{[\s\S]*\}/)
          if (match) {
            try { resultado = JSON.parse(match[0]) } catch {}
          }
          if (!resultado) resultado = { conclusion: text, danos: [], trabajos: [], estimacionMin: 0, estimacionMax: 0 }
        }
      } else {
        const errData = await res.json().catch(() => ({}))
        throw new Error(errData.error?.message || `Error ${res.status}`)
      }

      // Agregar metadata
      resultado._analizadoCon = fotosBase64.length > 0 ? `${fotosBase64.length} foto${fotosBase64.length > 1 ? 's' : ''}` : 'descripción'
      resultado._fecha = new Date().toISOString()

      const updated = { ...siniestro, analisisIA: resultado }
      updateSiniestro(id, { analisisIA: resultado })
      cacheSiniestros(useStore.getState().siniestros)
      await guardarSiniestro(updated)
    } catch (e) {
      setError(e.message || 'Error al conectar con la IA')
    } finally {
      setLoading(false)
      setLoadingMsg('')
    }
  }

  async function resetear() {
    if (!confirm('¿Resetear el análisis?')) return
    const updated = { ...siniestro, analisisIA: null }
    updateSiniestro(id, { analisisIA: null })
    cacheSiniestros(useStore.getState().siniestros)
    await guardarSiniestro(updated)
  }

  const severidad = ia?.resumen?.severidad?.toLowerCase() || ''

  return (
    <Screen>
      <TopBar back="Volver" title="Análisis IA"
        action={ia ? 'Resetear' : null} onAction={resetear} />
      <div style={{ padding: 16 }} className="fade-in">

        {!ia ? (
          // ── PANTALLA INICIAL ──
          <div style={{ textAlign: 'center', padding: '32px 16px' }}>
            <div style={{ width: 76, height: 76, borderRadius: 20, margin: '0 auto 20px', background: 'rgba(29,158,117,0.1)', border: '0.5px solid rgba(29,158,117,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="#1D9E75" strokeWidth="1.4">
                <path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96-.46 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 1.98-3A2.5 2.5 0 0 1 9.5 2Z"/>
                <path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96-.46 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-1.98-3A2.5 2.5 0 0 0 14.5 2Z"/>
              </svg>
            </div>

            <div style={{ fontSize: 17, fontWeight: 600, color: '#f0f0f0', marginBottom: 8 }}>
              Equipo de peritos IA
            </div>
            <div style={{ fontSize: 13, color: '#555', lineHeight: 1.7, marginBottom: 20 }}>
              6 especialistas virtuales analizan el siniestro:<br/>
              perito vial · chapista · pintor · estructural · mecánico · auditor de costos
            </div>

            {/* Estado fotos */}
            <div style={{ background: fotos.length > 0 ? 'rgba(29,158,117,0.08)' : 'rgba(239,159,39,0.08)', border: `0.5px solid ${fotos.length > 0 ? 'rgba(29,158,117,0.2)' : 'rgba(239,159,39,0.2)'}`, borderRadius: 10, padding: '10px 14px', marginBottom: 20, fontSize: 12, color: fotos.length > 0 ? '#1D9E75' : '#EF9F27', textAlign: 'left' }}>
              {fotos.length > 0
                ? `📸 ${fotos.length} foto${fotos.length > 1 ? 's' : ''} cargada${fotos.length > 1 ? 's' : ''} · la IA las analizará visualmente`
                : '⚠️ Sin fotos · el análisis se basará solo en la descripción del daño'}
            </div>

            {loading ? (
              <div style={{ textAlign: 'center' }}>
                <svg width="36" height="36" viewBox="0 0 24 24" fill="none" style={{ animation: 'spin 0.8s linear infinite', margin: '0 auto 12px', display: 'block' }}>
                  <circle cx="12" cy="12" r="10" stroke="#333" strokeWidth="2"/>
                  <path d="M12 2a10 10 0 0 1 10 10" stroke="#1D9E75" strokeWidth="2" strokeLinecap="round"/>
                </svg>
                <div style={{ fontSize: 13, color: '#888' }}>{loadingMsg || 'Analizando...'}</div>
                <div style={{ fontSize: 11, color: '#555', marginTop: 6 }}>Esto puede tardar 15-30 segundos</div>
              </div>
            ) : (
              <Btn onClick={analizar}>Analizar con equipo de peritos IA</Btn>
            )}

            {error && (
              <div style={{ marginTop: 14, padding: '10px 14px', background: 'rgba(226,75,74,0.08)', border: '0.5px solid rgba(226,75,74,0.2)', borderRadius: 10, fontSize: 12, color: '#E24B4A', textAlign: 'left' }}>
                ❌ {error}
              </div>
            )}
          </div>

        ) : (
          // ── RESULTADO DEL ANÁLISIS ──
          <>
            {/* Metadata */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 14, flexWrap: 'wrap' }}>
              {ia._analizadoCon && (
                <span style={{ fontSize: 11, padding: '3px 10px', borderRadius: 100, background: 'rgba(29,158,117,0.1)', color: '#1D9E75', border: '0.5px solid rgba(29,158,117,0.2)' }}>
                  📸 Analizado con {ia._analizadoCon}
                </span>
              )}
              {ia.resumen?.severidad && (
                <span style={{ fontSize: 11, padding: '3px 10px', borderRadius: 100, background: 'rgba(0,0,0,0.3)', color: SEVERIDAD_COLOR[severidad] || '#888', border: `0.5px solid ${SEVERIDAD_COLOR[severidad] || '#333'}44` }}>
                  Severidad: {ia.resumen.severidad}
                </span>
              )}
            </div>

            {/* 1. Resumen del siniestro */}
            {ia.resumen && (
              <>
                <SectionLabel>🔍 Resumen del siniestro</SectionLabel>
                <Card>
                  {[
                    ['Tipo de impacto', ia.resumen.tipo_impacto],
                    ['Dirección', ia.resumen.direccion],
                    ['Severidad', ia.resumen.severidad],
                  ].filter(([, v]) => v).map(([label, val]) => (
                    <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', fontSize: 12, borderBottom: '0.5px solid rgba(255,255,255,0.05)' }}>
                      <span style={{ color: '#666' }}>{label}</span>
                      <span style={{ color: '#f0f0f0', textAlign: 'right', maxWidth: '60%' }}>{val}</span>
                    </div>
                  ))}
                  {ia.resumen.componentes_visibles?.length > 0 && (
                    <div style={{ marginTop: 8 }}>
                      <div style={{ fontSize: 11, color: '#555', marginBottom: 6 }}>Componentes comprometidos:</div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                        {ia.resumen.componentes_visibles.map((c, i) => (
                          <span key={i} style={{ fontSize: 11, padding: '2px 8px', borderRadius: 100, background: '#242424', border: '0.5px solid rgba(255,255,255,0.1)', color: '#ccc' }}>{c}</span>
                        ))}
                      </div>
                    </div>
                  )}
                </Card>
              </>
            )}

            {/* 2. Análisis por zonas */}
            {ia.zonas?.length > 0 && (
              <>
                <SectionLabel>🧩 Análisis por zonas</SectionLabel>
                {ia.zonas.map((zona, zi) => (
                  <Card key={zi} style={{ marginBottom: 8 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#1D9E75', marginBottom: 8 }}>{zona.zona}</div>
                    {zona.piezas?.map((p, pi) => (
                      <div key={pi} style={{ padding: '8px 0', borderBottom: pi < zona.piezas.length - 1 ? '0.5px solid rgba(255,255,255,0.05)' : 'none' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 3 }}>
                          <span style={{ fontSize: 13, fontWeight: 500, color: '#f0f0f0' }}>{p.pieza}</span>
                          <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 100, background: p.accion === 'Reparar' ? 'rgba(29,158,117,0.15)' : 'rgba(239,159,39,0.15)', color: p.accion === 'Reparar' ? '#1D9E75' : '#EF9F27', border: `0.5px solid ${p.accion === 'Reparar' ? 'rgba(29,158,117,0.3)' : 'rgba(239,159,39,0.3)'}`, flexShrink: 0, marginLeft: 8 }}>
                            {p.accion === 'Reparar' ? '✅ Reparar' : '🔁 Reemplazar'}
                          </span>
                        </div>
                        {p.estado && <div style={{ fontSize: 11, color: '#666', marginBottom: 3 }}>Estado: {p.estado}</div>}
                        {p.justificacion && <div style={{ fontSize: 11, color: '#555', fontStyle: 'italic' }}>{p.justificacion}</div>}
                      </div>
                    ))}
                  </Card>
                ))}
              </>
            )}

            {/* 3. Daños estructurales */}
            {ia.estructural && Object.values(ia.estructural).some(Boolean) && (
              <>
                <SectionLabel>⚙️ Daños estructurales</SectionLabel>
                <Card>
                  {Object.entries(ia.estructural).map(([key, val]) => val ? (
                    <div key={key} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', fontSize: 12, borderBottom: '0.5px solid rgba(255,255,255,0.05)' }}>
                      <span style={{ color: '#666', textTransform: 'capitalize' }}>{key.replace('_', ' ')}</span>
                      <span style={{ color: val.includes('✔') ? '#1D9E75' : val.includes('⚠') ? '#EF9F27' : '#888', textAlign: 'right', maxWidth: '65%' }}>{val}</span>
                    </div>
                  ) : null)}
                </Card>
              </>
            )}

            {/* 4. Daños mecánicos */}
            {(ia.mecanico?.visible?.length > 0 || ia.mecanico?.probable?.length > 0) && (
              <>
                <SectionLabel>🔧 Daños mecánicos</SectionLabel>
                <Card>
                  {ia.mecanico.visible?.length > 0 && (
                    <div style={{ marginBottom: 8 }}>
                      <div style={{ fontSize: 11, color: '#E24B4A', marginBottom: 4, fontWeight: 600 }}>VISIBLE</div>
                      {ia.mecanico.visible.map((v, i) => (
                        <div key={i} style={{ fontSize: 12, color: '#ccc', padding: '2px 0' }}>· {v}</div>
                      ))}
                    </div>
                  )}
                  {ia.mecanico.probable?.length > 0 && (
                    <div>
                      <div style={{ fontSize: 11, color: '#EF9F27', marginBottom: 4, fontWeight: 600 }}>POSIBLE (requiere desarme)</div>
                      {ia.mecanico.probable.map((v, i) => (
                        <div key={i} style={{ fontSize: 12, color: '#888', padding: '2px 0' }}>· {v}</div>
                      ))}
                    </div>
                  )}
                </Card>
              </>
            )}

            {/* 5. Pintura */}
            {ia.pintura && (
              <>
                <SectionLabel>🎨 Análisis de pintura</SectionLabel>
                <Card>
                  {ia.pintura.piezas?.length > 0 && (
                    <div style={{ marginBottom: 8 }}>
                      <div style={{ fontSize: 11, color: '#555', marginBottom: 4 }}>Piezas a pintar:</div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                        {ia.pintura.piezas.map((p, i) => (
                          <span key={i} style={{ fontSize: 11, padding: '2px 8px', borderRadius: 100, background: '#242424', color: '#ccc', border: '0.5px solid rgba(255,255,255,0.08)' }}>{p}</span>
                        ))}
                      </div>
                    </div>
                  )}
                  {[
                    ['Difuminado', ia.pintura.difuminado],
                    ['Riesgo de color', ia.pintura.riesgo_color],
                    ['Complejidad', ia.pintura.complejidad],
                  ].filter(([, v]) => v).map(([label, val]) => (
                    <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontSize: 12, borderTop: '0.5px solid rgba(255,255,255,0.05)' }}>
                      <span style={{ color: '#666' }}>{label}</span>
                      <span style={{ color: '#f0f0f0' }}>{val}</span>
                    </div>
                  ))}
                </Card>
              </>
            )}

            {/* 6. Repuestos */}
            {(ia.repuestos?.confirmados?.length > 0 || ia.repuestos?.posibles?.length > 0) && (
              <>
                <SectionLabel>📦 Repuestos</SectionLabel>
                <Card>
                  {ia.repuestos.confirmados?.length > 0 && (
                    <div style={{ marginBottom: 8 }}>
                      <div style={{ fontSize: 11, color: '#1D9E75', marginBottom: 4, fontWeight: 600 }}>CONFIRMADOS</div>
                      {ia.repuestos.confirmados.map((r, i) => (
                        <div key={i} style={{ fontSize: 12, color: '#ccc', padding: '2px 0' }}>· {r}</div>
                      ))}
                    </div>
                  )}
                  {ia.repuestos.posibles?.length > 0 && (
                    <div>
                      <div style={{ fontSize: 11, color: '#EF9F27', marginBottom: 4, fontWeight: 600 }}>POSIBLES (según desarme)</div>
                      {ia.repuestos.posibles.map((r, i) => (
                        <div key={i} style={{ fontSize: 12, color: '#888', padding: '2px 0' }}>· {r}</div>
                      ))}
                    </div>
                  )}
                </Card>
              </>
            )}

            {/* 7. Impacto operativo */}
            {ia.operativo && (
              <>
                <SectionLabel>⏱️ Impacto operativo</SectionLabel>
                <Card>
                  {[
                    ['Complejidad', ia.operativo.complejidad],
                    ['Tiempo estimado', ia.operativo.tiempo_estimado],
                    ['Ocupación del taller', ia.operativo.ocupacion],
                    ['¿Conviene tomar?', ia.operativo.conviene],
                  ].filter(([, v]) => v).map(([label, val]) => (
                    <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', fontSize: 12, borderBottom: '0.5px solid rgba(255,255,255,0.05)' }}>
                      <span style={{ color: '#666' }}>{label}</span>
                      <span style={{ color: '#f0f0f0', textAlign: 'right', maxWidth: '60%' }}>{val}</span>
                    </div>
                  ))}
                </Card>
              </>
            )}

            {/* 8. Criterio económico */}
            {ia.economico && (
              <>
                <SectionLabel>💰 Criterio económico</SectionLabel>
                <Card>
                  {[
                    ['Reparar vs reemplazar', ia.economico.reparar_vs_reemplazar],
                    ['Riesgo de pérdida', ia.economico.riesgo_perdida],
                    ['Optimización de margen', ia.economico.optimizacion],
                  ].filter(([, v]) => v).map(([label, val]) => (
                    <div key={label} style={{ padding: '6px 0', fontSize: 12, borderBottom: '0.5px solid rgba(255,255,255,0.05)' }}>
                      <div style={{ color: '#666', marginBottom: 2 }}>{label}</div>
                      <div style={{ color: '#ccc' }}>{val}</div>
                    </div>
                  ))}
                </Card>
              </>
            )}

            {/* 9. Alertas */}
            {ia.alertas?.length > 0 && (
              <>
                <SectionLabel>⚠️ Alertas importantes</SectionLabel>
                <Card style={{ background: 'rgba(226,75,74,0.05)', border: '0.5px solid rgba(226,75,74,0.15)' }}>
                  {ia.alertas.map((a, i) => (
                    <div key={i} style={{ fontSize: 12, color: '#E24B4A', padding: '4px 0', borderBottom: i < ia.alertas.length - 1 ? '0.5px solid rgba(226,75,74,0.1)' : 'none' }}>
                      ⚠️ {a}
                    </div>
                  ))}
                </Card>
              </>
            )}

            {/* 10. Conclusión */}
            {ia.conclusion && (
              <>
                <SectionLabel>✅ Conclusión ejecutiva</SectionLabel>
                <Card style={{ background: 'rgba(29,158,117,0.05)', border: '0.5px solid rgba(29,158,117,0.15)' }}>
                  <div style={{ fontSize: 13, color: '#ccc', lineHeight: 1.7 }}>{ia.conclusion}</div>
                </Card>
              </>
            )}

            {/* Estimación de costo */}
            {(ia.estimacionMin || ia.estimacionMax) ? (
              <>
                <SectionLabel>💵 Estimación de costo</SectionLabel>
                <Card>
                  <div style={{ fontSize: 11, color: '#555', marginBottom: 6 }}>Rango orientativo · basado en costos del taller</div>
                  <div style={{ fontSize: 26, fontWeight: 700, color: '#f0f0f0', fontFamily: "'JetBrains Mono',monospace" }}>
                    ${Number(ia.estimacionMin).toLocaleString('es-AR')}
                  </div>
                  <div style={{ fontSize: 14, color: '#555' }}>hasta ${Number(ia.estimacionMax).toLocaleString('es-AR')}</div>
                </Card>
              </>
            ) : null}

            {/* Acciones */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 8 }}>
              <Btn onClick={() => navigate(`/siniestro/${id}/presupuesto`)}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                Crear presupuesto desde este análisis
              </Btn>
              <Btn variant="secondary" onClick={analizar} loading={loading}>
                Volver a analizar
              </Btn>
            </div>
          </>
        )}
        <div style={{ height: 24 }} />
      </div>
    </Screen>
  )
}

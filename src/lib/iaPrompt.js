/**
 * Construye el mensaje completo para Claude Vision
 * incluyendo fotos reales + prompt profesional del equipo de peritos
 */
export function buildMessages(siniestro, perfil, fotosBase64 = []) {
  const prompt = perfil?.ia_prompt_base || getDefaultPrompt()
  const costos = buildCostosTexto(perfil)
  const instrucciones = perfil?.ia_instrucciones || ''
  const contexto = perfil?.ia_contexto || ''

  // Contexto del vehículo
  const vehiculoInfo = `
VEHÍCULO A ANALIZAR:
- Marca/Modelo/Año: ${siniestro.marca || ''} ${siniestro.modelo || ''} ${siniestro.anio || ''}
- Patente: ${siniestro.patente || ''}
- Color: ${siniestro.color || ''}
- Tipo: ${siniestro.tipo === 'compania' ? `Compañía ${siniestro.compania}` : 'Particular'}
- Descripción del daño: ${siniestro.descripcion || 'No especificada'}
${contexto ? `\nContexto del taller: ${contexto}` : ''}
${costos ? `\nCostos del taller para estimación:\n${costos}` : ''}
${instrucciones ? `\nInstrucciones especiales: ${instrucciones}` : ''}

Analizá las imágenes adjuntas y respondé ÚNICAMENTE con el JSON solicitado, sin texto adicional ni markdown.`

  // Construir contenido con fotos si hay
  const content = []

  // Agregar fotos como imágenes base64
  if (fotosBase64.length > 0) {
    fotosBase64.forEach((foto, i) => {
      if (foto.data && foto.mediaType) {
        content.push({
          type: 'image',
          source: {
            type: 'base64',
            media_type: foto.mediaType,
            data: foto.data
          }
        })
      }
    })
    content.push({ type: 'text', text: `${prompt}\n\n${vehiculoInfo}` })
  } else {
    // Sin fotos — análisis solo por texto
    content.push({
      type: 'text',
      text: `${prompt}\n\n${vehiculoInfo}\n\nNOTA: No se proporcionaron imágenes. Analizá basándote en la descripción del daño.`
    })
  }

  return [{ role: 'user', content }]
}

function buildCostosTexto(perfil) {
  const lines = [
    perfil?.costo_chapa        && `Chapa: $${perfil.costo_chapa}/día`,
    perfil?.costo_pintura      && `Pintura: $${perfil.costo_pintura}/paño`,
    perfil?.costo_mecanica     && `Mecánica: $${perfil.costo_mecanica}/hora`,
    perfil?.costo_electricidad && `Electricidad: $${perfil.costo_electricidad}/hora`,
    perfil?.costo_cristaleria  && `Cristalería: $${perfil.costo_cristaleria}/hora`,
  ].filter(Boolean)
  return lines.join('\n')
}

function getDefaultPrompt() {
  return `Actuá como perito automotriz experto. Analizá los daños y respondé en JSON.`
}

import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { format } from 'date-fns'

const C = {
  primary: [29, 158, 117],
  dark:    [15, 15, 15],
  gray:    [100, 100, 100],
  light:   [245, 245, 245],
  white:   [255, 255, 255],
}

// ── HEADER con logo opcional ─────────────────────────────────────────────────
function addHeader(doc, perfil, titulo, sub) {
  // Fondo oscuro
  doc.setFillColor(...C.dark)
  doc.rect(0, 0, 210, 32, 'F')
  // Banda verde lateral
  doc.setFillColor(...C.primary)
  doc.rect(0, 0, 5, 32, 'F')

  // Logo si existe
  if (perfil?.logo_url) {
    try {
      // Detectar formato del base64
      const format = perfil.logo_url.includes('png') ? 'PNG' : 'JPEG'
      doc.addImage(perfil.logo_url, format, 10, 4, 40, 24)
    } catch (e) {
      // Si falla el logo, mostrar nombre
      doc.setTextColor(...C.white)
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(14)
      doc.text(perfil?.nombre || 'SGTaller', 12, 14)
    }
  } else {
    // Sin logo: mostrar nombre del taller
    doc.setTextColor(...C.white)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(15)
    doc.text(perfil?.nombre || 'SGTaller', 12, 14)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8)
    doc.text(perfil?.direccion || '', 12, 20)
    if (perfil?.telefono) doc.text(`Tel: ${perfil.telefono}`, 12, 25)
  }

  // Si hay logo, datos del taller a la derecha del logo
  if (perfil?.logo_url) {
    doc.setTextColor(...C.white)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(11)
    doc.text(perfil?.nombre || '', 55, 13)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8)
    if (perfil?.direccion) doc.text(perfil.direccion, 55, 19)
    if (perfil?.telefono)  doc.text(`Tel: ${perfil.telefono}`, 55, 24)
    if (perfil?.cuit)      doc.text(`CUIT: ${perfil.cuit}`, 55, 29)
  }

  // Título del documento (derecha)
  doc.setTextColor(...C.white)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(17)
  doc.text(titulo, 198, 13, { align: 'right' })
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.text(sub || '', 198, 20, { align: 'right' })
  doc.text(format(new Date(), 'dd/MM/yyyy'), 198, 26, { align: 'right' })

  doc.setTextColor(...C.dark)
}

// ── DATOS DEL VEHÍCULO ───────────────────────────────────────────────────────
function addVehiculo(doc, s, y) {
  doc.setFillColor(...C.light)
  doc.rect(14, y, 182, 22, 'F')
  doc.setDrawColor(220, 220, 220)
  doc.setLineWidth(0.3)
  doc.rect(14, y, 182, 22, 'S')

  doc.setFontSize(7)
  doc.setTextColor(...C.gray)
  doc.text('VEHÍCULO', 18, y + 5)
  doc.text('CLIENTE', 85, y + 5)
  doc.text('TIPO', 155, y + 5)

  doc.setFontSize(10)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...C.dark)
  doc.text(`${s.marca || ''} ${s.modelo || ''} ${s.anio || ''}`.trim(), 18, y + 13)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.text(s.patente || '', 18, y + 19)
  doc.text(s.clienteNombre || '', 85, y + 12)
  doc.text(s.clienteTelefono || '', 85, y + 18)
  doc.text(s.tipo === 'compania' ? (s.compania || '') : 'Particular', 155, y + 12)
  if (s.nroSiniestro) doc.text(`Nro: ${s.nroSiniestro}`, 155, y + 18)

  return y + 28
}

// ── PRESUPUESTO ──────────────────────────────────────────────────────────────
export function generatePresupuesto(siniestro, items, perfil, version = 1, notas = '') {
  const doc = new jsPDF()
  addHeader(doc, perfil, 'PRESUPUESTO', `Versión ${version}`)
  let y = addVehiculo(doc, siniestro, 38)

  const rows = items.map((item, i) => [
    i + 1,
    item.pieza || '',
    item.tipo_trabajo || '',
    `$${parseFloat(item.subtotal || 0).toLocaleString('es-AR')}`,
  ])

  autoTable(doc, {
    startY: y,
    head: [['N°', 'Pieza / Descripción', 'Tipo', 'Subtotal']],
    body: rows,
    theme: 'striped',
    headStyles: { fillColor: C.dark, textColor: C.white, fontSize: 8.5, fontStyle: 'bold' },
    bodyStyles: { fontSize: 9 },
    columnStyles: {
      0: { cellWidth: 10, halign: 'center' },
      1: { cellWidth: 'auto' },
      2: { cellWidth: 28, halign: 'center' },
      3: { cellWidth: 32, halign: 'right' },
    },
    margin: { left: 14, right: 14 },
  })

  const finalY = doc.lastAutoTable.finalY
  const total = items.reduce((a, i) => a + (parseFloat(i.subtotal) || 0), 0)

  // Total
  doc.setFillColor(...C.dark)
  doc.rect(130, finalY + 4, 66, 11, 'F')
  doc.setFillColor(...C.primary)
  doc.rect(130, finalY + 4, 3, 11, 'F')
  doc.setTextColor(...C.white)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(10)
  doc.text(`TOTAL: $${total.toLocaleString('es-AR')}`, 194, finalY + 11.5, { align: 'right' })
  doc.setTextColor(...C.dark)

  let dy = finalY + 22

  // Notas del usuario
  if (notas) {
    doc.setFont('helvetica', 'italic')
    doc.setFontSize(8.5)
    doc.setTextColor(...C.gray)
    const lines = doc.splitTextToSize(`Notas: ${notas}`, 182)
    lines.forEach(l => { doc.text(l, 14, dy); dy += 4.5 })
    dy += 4
  }

  // Bloque 1 — Repuestos
  doc.setDrawColor(...C.dark)
  doc.setLineWidth(0.3)
  const b1 = [
    'REPUESTOS A COLOCAR: A PROVEER POR COMPAÑÍA O PROPIETARIO',
    '(*) sujeto a desarme    (**) ver despiece por catálogo',
  ]
  const b1H = b1.length * 5 + 5
  doc.rect(14, dy, 182, b1H, 'S')
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(7.5)
  doc.setTextColor(...C.dark)
  doc.text(b1[0], 17, dy + 5)
  doc.setFont('helvetica', 'normal')
  doc.text(b1[1], 17, dy + 10)
  dy += b1H + 5

  // Bloque 2 — Disclaimer legal
  const disc = [
    'EL TALLER NO SE RESPONSABILIZA POR LOS DAÑOS QUE PUEDEN SUFRIR LOS CRISTALES EN EL PROCESO DE EXTRACCIÓN Y PEGADO.',
    'DOCUMENTO NO VÁLIDO PARA JUICIO, NI PARA SER PRESENTADO ANTE NINGUNA AUTORIDAD Y/O ENTIDAD JUDICIAL.',
    'AL DESARMAR, POSIBLES DAÑOS Y/O REPUESTOS AVERIADOS SERÁN COTIZADOS POR SEPARADO.',
    'PRECIO SUJETO A CAMBIO INFLACIONARIO, SIN PREVIO AVISO.',
  ]
  const b2H = disc.length * 5 + 6
  doc.rect(14, dy, 182, b2H, 'S')
  doc.setFont('helvetica', 'bolditalic')
  doc.setFontSize(7)
  doc.setTextColor(90, 90, 90)
  disc.forEach((line, i) => doc.text(`• ${line}`, 17, dy + 5 + i * 5))

  return doc.output('arraybuffer')
}

// ── F01 ──────────────────────────────────────────────────────────────────────
export function generateF01(siniestro, perfil) {
  const doc = new jsPDF()
  addHeader(doc, perfil, 'F01 — INGRESO', `Patente: ${siniestro.patente}`)
  let y = addVehiculo(doc, siniestro, 38)

  autoTable(doc, {
    startY: y,
    body: [
      ['Fecha de ingreso',  siniestro.f01?.fechaIngreso || ''],
      ['Kilometraje',       siniestro.f01?.kilometraje  || ''],
      ['Combustible',       siniestro.f01?.combustible  || ''],
      ['Color',             siniestro.color             || ''],
      ['Observaciones',     siniestro.f01?.observaciones || siniestro.descripcion || ''],
    ],
    theme: 'plain',
    bodyStyles: { fontSize: 10, cellPadding: 4 },
    columnStyles: { 0: { fontStyle: 'bold', textColor: C.gray, cellWidth: 50 } },
    margin: { left: 14, right: 14 },
  })

  const firmY = doc.lastAutoTable.finalY + 24
  doc.setDrawColor(...C.gray)
  doc.setLineWidth(0.4)
  doc.line(14, firmY, 88, firmY)
  doc.line(120, firmY, 196, firmY)
  doc.setFontSize(8)
  doc.setTextColor(...C.gray)
  doc.text('Firma del cliente', 51, firmY + 5, { align: 'center' })
  doc.text('Firma del taller',  158, firmY + 5, { align: 'center' })

  return doc.output('arraybuffer')
}

// ── F02 ──────────────────────────────────────────────────────────────────────
export function generateF02(siniestro, items, perfil) {
  const doc = new jsPDF()
  addHeader(doc, perfil, 'F02 — ORDEN DE TRABAJO', `Patente: ${siniestro.patente}`)
  let y = addVehiculo(doc, siniestro, 38)

  if (siniestro.tipo === 'compania' && siniestro.nroSiniestro) {
    doc.setFontSize(9)
    doc.setTextColor(...C.gray)
    doc.text(`Compañía: ${siniestro.compania}   Nro Siniestro: ${siniestro.nroSiniestro}`, 14, y)
    y += 8
  }

  const itemsF02 = items.filter(i => i.incluirF02)
  const rows = itemsF02.map((item, i) => [
    i + 1,
    item.pieza || item.descripcion || '',
    item.tipo_trabajo || '',
    `$${parseFloat(item.subtotal || 0).toLocaleString('es-AR')}`,
  ])

  autoTable(doc, {
    startY: y,
    head: [['N°', 'Trabajo a realizar', 'Tipo', 'Importe']],
    body: rows,
    theme: 'striped',
    headStyles: { fillColor: C.dark, textColor: C.white, fontSize: 8.5 },
    bodyStyles: { fontSize: 10 },
    columnStyles: {
      0: { cellWidth: 10, halign: 'center' },
      2: { cellWidth: 28, halign: 'center' },
      3: { cellWidth: 32, halign: 'right' },
    },
    margin: { left: 14, right: 14 },
  })

  const finalY = doc.lastAutoTable.finalY
  const total = itemsF02.reduce((a, i) => a + (parseFloat(i.subtotal) || 0), 0)

  doc.setFillColor(...C.dark)
  doc.rect(130, finalY + 4, 66, 11, 'F')
  doc.setFillColor(...C.primary)
  doc.rect(130, finalY + 4, 3, 11, 'F')
  doc.setTextColor(...C.white)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(10)
  doc.text(`TOTAL: $${total.toLocaleString('es-AR')}`, 194, finalY + 11.5, { align: 'right' })
  doc.setTextColor(...C.dark)

  const firmY = finalY + 34
  doc.setDrawColor(...C.gray)
  doc.setLineWidth(0.4)
  doc.line(14, firmY, 88, firmY)
  doc.line(120, firmY, 196, firmY)
  doc.setFontSize(8)
  doc.setTextColor(...C.gray)
  doc.text('Firma del cliente',     51,  firmY + 5, { align: 'center' })
  doc.text('Autorización compañía', 158, firmY + 5, { align: 'center' })

  return doc.output('arraybuffer')
}

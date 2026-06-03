import { createFolder, uploadJSON, updateFile, uploadFile, extractFolderId, uploadImageBlob } from './drive'

function getParentFolderId(tipo, companiaNombre, perfil) {
  if (tipo === 'particular') {
    return extractFolderId(perfil.driveParticulares)
  }
  if (perfil.driveMode === 'A') {
    return extractFolderId(perfil.driveCompanias)
  }
  const comp = perfil.companias?.find(c => c.nombre === companiaNombre)
  return extractFolderId(comp?.driveLink)
}

export async function crearSiniestro(datos, perfil) {
  const parentId = getParentFolderId(datos.tipo, datos.compania, perfil)
  if (!parentId) throw new Error('Configurá el link de Drive en Perfil primero')

  const id = `sin_${Date.now()}`
  const siniestro = {
    id,
    ...datos,
    estado: 'nuevo',
    fotos: [],
    presupuesto: [],
    analisisIA: null,
    f01: null,
    f02Generado: false,
    creadoEn: new Date().toISOString(),
    actualizadoEn: new Date().toISOString(),
  }

  const carpeta = await createFolder(datos.patente.replace(/\s/g, '-').toUpperCase(), parentId)
  siniestro.driveFolder = carpeta.id
  siniestro.driveFolderLink = carpeta.webViewLink

  const fotosFolder = await createFolder('fotos', carpeta.id)
  siniestro.driveFotosFolder = fotosFolder.id

  const file = await uploadJSON(siniestro, 'siniestro.json', carpeta.id)
  siniestro.driveFileId = file.id

  return siniestro
}

export async function guardarSiniestro(siniestro) {
  const updated = { ...siniestro, actualizadoEn: new Date().toISOString() }
  if (siniestro.driveFileId) {
    await updateFile(siniestro.driveFileId, updated)
  }
  return updated
}

export async function subirFoto(siniestro, file, nombre) {
  const result = await uploadImageBlob(file, nombre, siniestro.driveFotosFolder)
  return { id: result.id, nombre, link: result.webViewLink, contentLink: result.webContentLink }
}

export async function subirPDF(siniestro, pdfBuffer, nombre) {
  return uploadFile(pdfBuffer, nombre, siniestro.driveFolder, 'application/pdf')
}

export function cargarSiniestros() {
  const cached = localStorage.getItem('sgtaller_siniestros')
  return Promise.resolve(cached ? JSON.parse(cached) : [])
}

export function cacheSiniestros(siniestros) {
  localStorage.setItem('sgtaller_siniestros', JSON.stringify(siniestros))
}

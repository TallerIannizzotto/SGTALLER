const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID
const SCOPES = 'https://www.googleapis.com/auth/drive.file'
const DISCOVERY_DOC = 'https://www.googleapis.com/discovery/v1/apis/drive/v3/rest'

let tokenClient = null

export async function initGoogleAuth() {
  await loadGapi()
  initGis()
}

function loadGapi() {
  return new Promise((resolve) => {
    if (window.gapi) { resolve(); return }
    const s = document.createElement('script')
    s.src = 'https://apis.google.com/js/api.js'
    s.onload = async () => {
      await new Promise(r => window.gapi.load('client', r))
      await window.gapi.client.init({ discoveryDocs: [DISCOVERY_DOC] })
      resolve()
    }
    document.body.appendChild(s)
  })
}

function initGis() {
  if (tokenClient) return
  tokenClient = window.google.accounts.oauth2.initTokenClient({
    client_id: CLIENT_ID,
    scope: SCOPES,
    callback: () => {}
  })
}

export function getAccessToken() {
  return new Promise((resolve, reject) => {
    tokenClient.callback = (resp) => {
      if (resp.error) reject(resp)
      else resolve(resp.access_token)
    }
    const existing = window.gapi.client.getToken()
    tokenClient.requestAccessToken({ prompt: existing ? '' : 'consent' })
  })
}

export function signOut() {
  const token = window.gapi?.client?.getToken()
  if (token) {
    window.google.accounts.oauth2.revoke(token.access_token)
    window.gapi.client.setToken('')
  }
}

export function isSignedIn() {
  return !!window.gapi?.client?.getToken()
}

function authHeader() {
  return { Authorization: `Bearer ${window.gapi.client.getToken()?.access_token}` }
}

export async function createFolder(name, parentId = null) {
  const meta = { name, mimeType: 'application/vnd.google-apps.folder' }
  if (parentId) meta.parents = [parentId]
  const res = await fetch('https://www.googleapis.com/drive/v3/files?fields=id,name,webViewLink', {
    method: 'POST',
    headers: { ...authHeader(), 'Content-Type': 'application/json' },
    body: JSON.stringify(meta)
  })
  return res.json()
}

export async function uploadFile(content, name, parentId, mimeType = 'application/octet-stream') {
  const meta = { name, parents: parentId ? [parentId] : [] }
  const form = new FormData()
  form.append('metadata', new Blob([JSON.stringify(meta)], { type: 'application/json' }))
  form.append('file', new Blob([content], { type: mimeType }))
  const res = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,webViewLink', {
    method: 'POST',
    headers: authHeader(),
    body: form
  })
  return res.json()
}

export async function uploadJSON(data, name, parentId) {
  return uploadFile(JSON.stringify(data, null, 2), name, parentId, 'application/json')
}

export async function uploadImageBlob(blob, name, parentId) {
  const meta = { name, parents: parentId ? [parentId] : [] }
  const form = new FormData()
  form.append('metadata', new Blob([JSON.stringify(meta)], { type: 'application/json' }))
  form.append('file', blob)
  const res = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,webViewLink,webContentLink', {
    method: 'POST',
    headers: authHeader(),
    body: form
  })
  return res.json()
}

export async function findFile(name, parentId) {
  const q = `name='${name}' and '${parentId}' in parents and trashed=false`
  const res = await fetch(`https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(q)}&fields=files(id,name,webViewLink)`, {
    headers: authHeader()
  })
  const data = await res.json()
  return data.files?.[0] || null
}

export async function readJSON(fileId) {
  const res = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`, {
    headers: authHeader()
  })
  return res.json()
}

export async function updateFile(fileId, data) {
  const res = await fetch(`https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=media`, {
    method: 'PATCH',
    headers: { ...authHeader(), 'Content-Type': 'application/json' },
    body: JSON.stringify(data, null, 2)
  })
  return res.json()
}

export async function listFiles(parentId) {
  const q = `'${parentId}' in parents and trashed=false`
  const res = await fetch(`https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(q)}&fields=files(id,name,mimeType,webViewLink,createdTime)&orderBy=createdTime desc`, {
    headers: authHeader()
  })
  const data = await res.json()
  return data.files || []
}

export function extractFolderId(link) {
  if (!link) return null
  const match = link.match(/folders\/([a-zA-Z0-9_-]+)/)
  return match ? match[1] : null
}

// Descargar imagen de Drive y convertir a base64 para Vision API
export async function getImageAsBase64(fileId) {
  const token = window.gapi?.client?.getToken()?.access_token
  if (!token) return null
  try {
    const res = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    if (!res.ok) return null
    const blob = await res.blob()
    const mediaType = blob.type || 'image/jpeg'
    return new Promise((resolve) => {
      const reader = new FileReader()
      reader.onloadend = () => {
        const base64 = reader.result.split(',')[1]
        resolve({ data: base64, mediaType })
      }
      reader.onerror = () => resolve(null)
      reader.readAsDataURL(blob)
    })
  } catch { return null }
}

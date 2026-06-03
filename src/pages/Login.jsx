import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useStore } from '../lib/store'
import { getAccessToken } from '../lib/drive'

export default function Login() {
  const navigate = useNavigate()
  const { setUser, setAccessToken, user } = useStore()

  useEffect(() => {
    if (user) navigate('/')
  }, [user])

  async function handleLogin() {
    try {
      const token = await getAccessToken()
      setAccessToken(token)
      // Obtener info del usuario con el token
      const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
        headers: { Authorization: `Bearer ${token}` }
      })
      const info = await res.json()
      const userData = { name: info.name, email: info.email, picture: info.picture }
      setUser(userData)
      localStorage.setItem('sgtaller_user', JSON.stringify(userData))
      navigate('/')
    } catch (e) {
      console.error('Login error', e)
    }
  }

  return (
    <div style={{
      minHeight: '100dvh', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', padding: 32,
      background: '#0f0f0f'
    }}>
      <div style={{ marginBottom: 48, textAlign: 'center' }}>
        <div style={{
          width: 72, height: 72, borderRadius: 20,
          background: 'rgba(29,158,117,0.15)', border: '0.5px solid rgba(29,158,117,0.3)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 20px'
        }}>
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#1D9E75" strokeWidth="1.5">
            <rect x="3" y="3" width="18" height="18" rx="3"/>
            <path d="M9 9h6M9 12h6M9 15h4"/>
          </svg>
        </div>
        <h1 style={{ fontSize: 32, fontWeight: 600, color: '#f0f0f0', letterSpacing: '-1px' }}>SGTaller</h1>
        <p style={{ fontSize: 14, color: '#666', marginTop: 8 }}>Gestión de siniestros</p>
      </div>

      <button onClick={handleLogin} style={{
        display: 'flex', alignItems: 'center', gap: 12,
        background: '#1a1a1a', border: '0.5px solid rgba(255,255,255,0.12)',
        borderRadius: 12, padding: '14px 24px', color: '#f0f0f0',
        fontSize: 15, fontWeight: 500, fontFamily: 'inherit', cursor: 'pointer',
        width: '100%', maxWidth: 320, justifyContent: 'center'
      }}>
        <svg width="20" height="20" viewBox="0 0 24 24">
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
        </svg>
        Continuar con Google
      </button>

      <p style={{ fontSize: 11, color: '#444', marginTop: 32, textAlign: 'center', maxWidth: 260 }}>
        Tus datos se guardan en tu propio Google Drive. Nadie más tiene acceso.
      </p>
    </div>
  )
}

import { Routes, Route, Navigate } from 'react-router-dom'
import { useEffect } from 'react'
import { useStore } from './lib/store'
import { initGoogleAuth } from './lib/drive'
import Login from './pages/Login'
import Home from './pages/Home'
import NuevoSiniestro from './pages/NuevoSiniestro'
import DetalleSiniestro from './pages/DetalleSiniestro'
import Fotos from './pages/Fotos'
import AnalisisIA from './pages/AnalisisIA'
import Presupuesto from './pages/Presupuesto'
import F01 from './pages/F01'
import F02 from './pages/F02'
import Perfil from './pages/Perfil'

function ProtectedRoute({ children }) {
  const user = useStore(s => s.user)
  if (!user) return <Navigate to="/login" replace />
  return children
}

export default function App() {
  const setUser = useStore(s => s.setUser)

  useEffect(() => {
    initGoogleAuth().catch(console.error)
    // Restaurar sesion si hay token guardado
    const saved = localStorage.getItem('sgtaller_user')
    if (saved) setUser(JSON.parse(saved))
  }, [])

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={<ProtectedRoute><Home /></ProtectedRoute>} />
      <Route path="/nuevo" element={<ProtectedRoute><NuevoSiniestro /></ProtectedRoute>} />
      <Route path="/siniestro/:id" element={<ProtectedRoute><DetalleSiniestro /></ProtectedRoute>} />
      <Route path="/siniestro/:id/fotos" element={<ProtectedRoute><Fotos /></ProtectedRoute>} />
      <Route path="/siniestro/:id/ia" element={<ProtectedRoute><AnalisisIA /></ProtectedRoute>} />
      <Route path="/siniestro/:id/presupuesto" element={<ProtectedRoute><Presupuesto /></ProtectedRoute>} />
      <Route path="/siniestro/:id/f01" element={<ProtectedRoute><F01 /></ProtectedRoute>} />
      <Route path="/siniestro/:id/f02" element={<ProtectedRoute><F02 /></ProtectedRoute>} />
      <Route path="/perfil" element={<ProtectedRoute><Perfil /></ProtectedRoute>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

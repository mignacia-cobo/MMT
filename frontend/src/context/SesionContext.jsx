/*
 * ============================================================
 * context/SesionContext.jsx  —  Contexto de sesión global
 * ============================================================
 *
 * CONCEPTO: Context API de React
 *   - Permite compartir datos entre componentes sin pasarlos
 *     manualmente como props por cada nivel.
 *   - Aquí guardamos los datos de la alumna que inició sesión.
 *
 * COMPONENTES QUE LO USAN:
 *   - Navbar (mostrar nombre de la alumna)
 *   - UploadForm (enviar id de la autora)
 *   - Perfil (mostrar mis materiales)
 *
 * CÓMO USAR EN UN COMPONENTE:
 *   const { alumna, login, logout } = useSesion()
 */

import { createContext, useContext, useState, useEffect } from 'react'
import { apiFetch } from '../hooks/useApi'

// Creamos el contexto (empieza vacío)
const SesionContext = createContext(null)

/**
 * Proveedor de sesión — envuelve toda la aplicación en App.jsx
 * Expone la alumna actual, las funciones de login/logout y el estado de carga.
 */
export function SesionProvider({ children }) {
  const [alumna,   setAlumna]   = useState(null)
  const [cargando, setCargando] = useState(true)  // true mientras verifica token guardado

  // Al cargar la app, verificamos si ya hay una sesión guardada en localStorage
  useEffect(() => {
    const tokenGuardado = localStorage.getItem('mmt_token')
    if (!tokenGuardado) {
      setCargando(false)
      return
    }

    // Si hay token, verificamos que siga siendo válido llamando a /api/auth/yo
    apiFetch('/api/auth/yo')
      .then(json => setAlumna(json.alumna))
      .catch(() => {
        // Token expirado o inválido → limpiar
        localStorage.removeItem('mmt_token')
      })
      .finally(() => setCargando(false))
  }, [])

  /**
   * Guarda el token y los datos de la alumna después del login exitoso.
   * @param {string} token
   * @param {object} datosAlumna
   */
  function login(token, datosAlumna) {
    localStorage.setItem('mmt_token', token)
    setAlumna(datosAlumna)
  }

  /**
   * Cierra la sesión eliminando el token y vaciando el estado.
   */
  function logout() {
    localStorage.removeItem('mmt_token')
    setAlumna(null)
  }

  function actualizarAlumna(datos) {
    setAlumna(prev => ({ ...prev, ...datos }))
  }

  return (
    <SesionContext.Provider value={{ alumna, login, logout, actualizarAlumna, cargando }}>
      {children}
    </SesionContext.Provider>
  )
}

/**
 * Hook de acceso rápido al contexto de sesión.
 * Lanza un error si se usa fuera del SesionProvider.
 */
export function useSesion() {
  const ctx = useContext(SesionContext)
  if (!ctx) throw new Error('useSesion debe usarse dentro de <SesionProvider>')
  return ctx
}

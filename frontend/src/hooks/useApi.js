/*
 * ============================================================
 * hooks/useApi.js  —  Hook para peticiones a la API del backend
 * ============================================================
 *
 * Un "Hook" en React es una función que empieza con `use` y que
 * permite encapsular lógica reutilizable entre componentes.
 *
 * Este hook maneja:
 *   - El estado de carga (cargando: true/false)
 *   - Los datos recibidos
 *   - Los errores
 *   - El token de autenticación automáticamente
 *
 * CÓMO USAR:
 *   const { datos, cargando, error } = useApi('/api/materiales')
 *
 * EJEMPLO CON FILTROS:
 *   const { datos } = useApi('/api/materiales', { deps: [asignatura] },
 *     { params: { asignatura } })
 */

import { useState, useEffect, useCallback } from 'react'

// URL base del backend (configurada en .env del frontend)
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001'

/**
 * Realiza una petición fetch al backend con el token de sesión incluido.
 *
 * @param {string} ruta       - Ruta relativa, ej: '/api/materiales'
 * @param {RequestInit} opciones - Opciones de fetch (method, body, etc.)
 * @returns {Promise<any>}    - Datos de la respuesta JSON
 */
export async function apiFetch(ruta, opciones = {}) {
  // Recuperamos el token guardado al hacer login
  const token = localStorage.getItem('mmt_token')

  const cabeceras = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...opciones.headers,
  }

  // Si el body es FormData (subida de archivos), quitamos Content-Type
  // para que el navegador lo calcule automáticamente con el boundary
  if (opciones.body instanceof FormData) {
    delete cabeceras['Content-Type']
  }

  const respuesta = await fetch(`${API_BASE}${ruta}`, {
    ...opciones,
    headers: cabeceras,
  })

  const json = await respuesta.json()

  // Si la respuesta no fue exitosa, lanzamos el mensaje del servidor como error
  if (!respuesta.ok) {
    throw new Error(json.mensaje || 'Error en la petición.')
  }

  return json
}

/**
 * Hook para cargar datos de la API automáticamente cuando el componente monta.
 *
 * @param {string} ruta        - Endpoint, ej: '/api/materiales'
 * @param {object} [opciones]
 * @param {any[]}  [opciones.deps] - Dependencias para re-cargar datos (como useEffect)
 * @param {object} [opciones.params] - Query params a agregar a la URL
 * @returns {{ datos: any, cargando: boolean, error: string|null, recargar: Function }}
 */
export function useApi(ruta, { deps = [], params } = {}) {
  const [datos,    setDatos]    = useState(undefined)
  const [cargando, setCargando] = useState(true)
  const [error,    setError]    = useState(null)

  const cargar = useCallback(async () => {
    setCargando(true)
    setError(null)

    try {
      // Construimos la URL con los query params si los hay
      let urlFinal = ruta
      if (params) {
        const query = new URLSearchParams(
          // Filtramos valores undefined/null para no enviarlos
          Object.fromEntries(Object.entries(params).filter(([, v]) => v != null))
        ).toString()
        if (query) urlFinal += '?' + query
      }

      const json = await apiFetch(urlFinal)
      // La API devuelve { ok: true, datos: [...] }
      setDatos(json.datos ?? json)
    } catch (err) {
      setError(err.message)
    } finally {
      setCargando(false)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ruta, JSON.stringify(params)])

  // Se ejecuta al montar el componente y cuando cambian las dependencias
  useEffect(() => { cargar() }, [cargar, ...deps])

  return { datos, cargando, error, recargar: cargar }
}

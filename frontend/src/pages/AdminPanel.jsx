/*
 * pages/AdminPanel.jsx — Panel de configuración ADMIN
 * 4 pestañas: Usuarios, Sedes, Cronograma, Noticias
 */

import { useState, useEffect, useCallback, useRef } from 'react'
import { Navigate }               from 'react-router-dom'
import { useSesion }              from '../context/SesionContext'
import { apiFetch }               from '../hooks/useApi'
import { PlanificadorCronograma } from './AdminCronograma'

// ---- SVG icons ----
function IconUsers()    { return <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg> }
function IconMap()      { return <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"/><line x1="8" y1="2" x2="8" y2="18"/><line x1="16" y1="6" x2="16" y2="22"/></svg> }
function IconCalendar() { return <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg> }
function IconNews()     { return <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg> }
function IconTrash()    { return <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg> }
function IconEdit()     { return <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg> }
function IconCheck()    { return <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg> }
function IconPlus()     { return <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg> }
function IconBook()     { return <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg> }

const RUTAS_VALIDAS = ['LIDERAZGO', 'VOCACION', 'PROYECTOS']

// -------------------------------------------------------
// COMPONENTE PRINCIPAL
// -------------------------------------------------------

export default function AdminPanel() {
  const { alumna } = useSesion()
  if (!alumna)             return null
  if (alumna.rol !== 'ADMIN') return <Navigate to="/" replace />

  return <PanelAdmin />
}

function PanelAdmin() {
  const [tabActiva, setTabActiva] = useState('usuarios')

  const TABS = [
    { id: 'usuarios',     label: 'Usuarios',     icono: <IconUsers /> },
    { id: 'sedes',        label: 'Sedes',        icono: <IconMap /> },
    { id: 'asignaturas',  label: 'Asignaturas',  icono: <IconBook /> },
    { id: 'cronograma',   label: 'Cronograma',   icono: <IconCalendar /> },
    { id: 'noticias',     label: 'Noticias',     icono: <IconNews /> },
  ]

  return (
    <div>
      {/* Encabezado */}
      <div className="mb-6">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold text-gray-800">Panel de Administración</h1>
          <span className="text-[10px] font-bold bg-mmt-purple text-white px-2 py-0.5 rounded-full">ADMIN</span>
        </div>
        <p className="text-sm text-gray-500 mt-0.5">Gestión de usuarias, sedes, cronograma y noticias</p>
      </div>

      <div className="flex gap-6">
        {/* Sidebar */}
        <aside className="w-44 flex-shrink-0">
          <div className="card p-2 space-y-0.5 sticky top-24">
            {TABS.map(tab => (
              <button
                key={tab.id}
                onClick={() => setTabActiva(tab.id)}
                className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-all
                  ${tabActiva === tab.id
                    ? 'bg-mmt-purple text-white shadow-sm'
                    : 'text-gray-600 hover:bg-mmt-purple-50 hover:text-mmt-purple'
                  }`}
              >
                {tab.icono}
                {tab.label}
              </button>
            ))}
          </div>
        </aside>

        {/* Contenido */}
        <div className="flex-1 min-w-0">
          {tabActiva === 'usuarios'    && <TabUsuarias />}
          {tabActiva === 'sedes'       && <TabSedes />}
          {tabActiva === 'asignaturas' && <TabAsignaturas />}
          {tabActiva === 'cronograma'  && <PlanificadorCronograma />}
          {tabActiva === 'noticias'    && <TabNoticias />}
        </div>
      </div>
    </div>
  )
}

// -------------------------------------------------------
// TAB USUARIOS
// -------------------------------------------------------

const FORM_USUARIA_VACIO = {
  nombre: '', email: '', password: '', carrera: '',
  anioCohorte: '2026', rol: 'ALUMNA', idSede: '', rutaAsignada: '',
}

function TabUsuarias() {
  const { alumna: yo } = useSesion()

  const [alumnas,     setAlumnas]     = useState([])
  const [sedes,       setSedes]       = useState([])
  const [cargando,    setCargando]    = useState(true)
  const [error,       setError]       = useState(null)
  const [guardando,   setGuardando]   = useState({})

  // Modal crear / editar
  const [modal,       setModal]       = useState(null)   // null | 'crear' | alumna-obj (editar)
  const [form,        setForm]        = useState(FORM_USUARIA_VACIO)
  const [errorForm,   setErrorForm]   = useState(null)
  const [guardandoForm, setGuardandoForm] = useState(false)

  const cargar = useCallback(async () => {
    setCargando(true)
    setError(null)
    try {
      const [rAlumnas, rSedes] = await Promise.all([
        apiFetch('/api/admin/usuarias'),
        apiFetch('/api/sedes'),
      ])
      setAlumnas(rAlumnas.alumnas ?? [])
      setSedes(rSedes.sedes ?? [])
    } catch (err) {
      setError(err.message)
    } finally {
      setCargando(false)
    }
  }, [])

  useEffect(() => { cargar() }, [cargar])

  // ---- Cambios inline ----

  async function cambiarRol(alumna, rol) {
    const rutaAsignada = rol === 'LIDER' ? (alumna.ruta_asignada ?? null) : null
    setGuardando(g => ({ ...g, [`rol_${alumna.id}`]: true }))
    try {
      await apiFetch(`/api/admin/usuarias/${alumna.id}/rol`, {
        method: 'PATCH',
        body:   JSON.stringify({ rol, rutaAsignada }),
      })
      setAlumnas(prev => prev.map(a =>
        a.id === alumna.id ? { ...a, rol, ruta_asignada: rutaAsignada } : a
      ))
    } catch (err) {
      alert(err.message)
    } finally {
      setGuardando(g => ({ ...g, [`rol_${alumna.id}`]: false }))
    }
  }

  async function cambiarRuta(alumna, rutaAsignada) {
    setGuardando(g => ({ ...g, [`ruta_${alumna.id}`]: true }))
    try {
      await apiFetch(`/api/admin/usuarias/${alumna.id}/rol`, {
        method: 'PATCH',
        body:   JSON.stringify({ rol: alumna.rol, rutaAsignada: rutaAsignada || null }),
      })
      setAlumnas(prev => prev.map(a =>
        a.id === alumna.id ? { ...a, ruta_asignada: rutaAsignada || null } : a
      ))
    } catch (err) {
      alert(err.message)
    } finally {
      setGuardando(g => ({ ...g, [`ruta_${alumna.id}`]: false }))
    }
  }

  async function cambiarSede(alumna, idSede) {
    setGuardando(g => ({ ...g, [`sede_${alumna.id}`]: true }))
    try {
      await apiFetch(`/api/admin/usuarias/${alumna.id}/sede`, {
        method: 'PATCH',
        body:   JSON.stringify({ idSede: idSede ? Number(idSede) : null }),
      })
      const sedeEncontrada = sedes.find(s => s.id === Number(idSede))
      setAlumnas(prev => prev.map(a =>
        a.id === alumna.id
          ? { ...a, id_sede: idSede ? Number(idSede) : null, nombre_sede: sedeEncontrada?.nombre ?? null }
          : a
      ))
    } catch (err) {
      alert(err.message)
    } finally {
      setGuardando(g => ({ ...g, [`sede_${alumna.id}`]: false }))
    }
  }

  // ---- Modal crear / editar ----

  function abrirCrear() {
    setForm(FORM_USUARIA_VACIO)
    setErrorForm(null)
    setModal('crear')
  }

  function abrirEditar(a) {
    setForm({
      nombre:      a.nombre,
      email:       a.email,
      password:    '',
      carrera:     a.carrera ?? '',
      anioCohorte: String(a.anio_cohorte ?? 2026),
      rol:         a.rol,
      idSede:      String(a.id_sede ?? ''),
      rutaAsignada: a.ruta_asignada ?? '',
    })
    setErrorForm(null)
    setModal(a)
  }

  function cerrarModal() {
    setModal(null)
    setErrorForm(null)
  }

  async function guardarModal(e) {
    e.preventDefault()
    setErrorForm(null)
    setGuardandoForm(true)
    try {
      const esCrear = modal === 'crear'

      if (esCrear) {
        const r = await apiFetch('/api/admin/usuarias', {
          method: 'POST',
          body: JSON.stringify({
            nombre:      form.nombre,
            email:       form.email,
            password:    form.password,
            carrera:     form.carrera || null,
            anioCohorte: Number(form.anioCohorte) || 2026,
            rol:         form.rol,
            idSede:      form.idSede ? Number(form.idSede) : null,
            rutaAsignada: form.rutaAsignada || null,
          }),
        })
        setAlumnas(prev => [...prev, r.alumna])
      } else {
        // Actualizar datos básicos
        await apiFetch(`/api/admin/usuarias/${modal.id}`, {
          method: 'PATCH',
          body: JSON.stringify({
            nombre:      form.nombre,
            email:       form.email,
            carrera:     form.carrera || null,
            anioCohorte: Number(form.anioCohorte) || 2026,
          }),
        })
        // Actualizar rol + ruta
        await apiFetch(`/api/admin/usuarias/${modal.id}/rol`, {
          method: 'PATCH',
          body: JSON.stringify({
            rol:         form.rol,
            rutaAsignada: form.rol === 'LIDER' ? (form.rutaAsignada || null) : null,
          }),
        })
        // Actualizar sede
        await apiFetch(`/api/admin/usuarias/${modal.id}/sede`, {
          method: 'PATCH',
          body: JSON.stringify({ idSede: form.idSede ? Number(form.idSede) : null }),
        })
        // Reflejar en lista
        const sedeEncontrada = sedes.find(s => s.id === Number(form.idSede))
        setAlumnas(prev => prev.map(a =>
          a.id === modal.id ? {
            ...a,
            nombre:      form.nombre,
            email:       form.email,
            carrera:     form.carrera || null,
            anio_cohorte: Number(form.anioCohorte),
            rol:         form.rol,
            ruta_asignada: form.rol === 'LIDER' ? (form.rutaAsignada || null) : null,
            id_sede:     form.idSede ? Number(form.idSede) : null,
            nombre_sede: sedeEncontrada?.nombre ?? null,
          } : a
        ))
      }
      cerrarModal()
    } catch (err) {
      setErrorForm(err.message)
    } finally {
      setGuardandoForm(false)
    }
  }

  // ---- Eliminar ----

  async function eliminar(a) {
    if (!window.confirm(`¿Eliminar a ${a.nombre}? Esta acción no se puede deshacer.`)) return
    try {
      await apiFetch(`/api/admin/usuarias/${a.id}`, { method: 'DELETE' })
      setAlumnas(prev => prev.filter(x => x.id !== a.id))
    } catch (err) {
      alert(err.message)
    }
  }

  if (cargando) return <Spinner />
  if (error)    return <ErrorCard mensaje={error} />

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-bold text-gray-600 uppercase tracking-wider">
          Usuarias ({alumnas.length})
        </h2>
        <button onClick={abrirCrear} className="btn-primary text-sm py-1.5 px-3">
          + Nueva usuaria
        </button>
      </div>

      {/* Modal crear / editar */}
      {modal !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-4">
            <h3 className="font-bold text-gray-800">
              {modal === 'crear' ? 'Nueva usuaria' : `Editar — ${modal.nombre}`}
            </h3>

            {errorForm && (
              <p className="text-xs text-red-500 bg-red-50 px-3 py-2 rounded-lg">{errorForm}</p>
            )}

            <form onSubmit={guardarModal} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Nombre <span className="text-red-400">*</span></label>
                  <input
                    required
                    type="text"
                    value={form.nombre}
                    onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))}
                    className="input-field w-full py-2 text-sm"
                    placeholder="Nombre completo"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Email <span className="text-red-400">*</span></label>
                  <input
                    required
                    type="email"
                    value={form.email}
                    onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                    className="input-field w-full py-2 text-sm"
                    placeholder="correo@ejemplo.cl"
                  />
                </div>

                {modal === 'crear' && (
                  <div className="col-span-2">
                    <label className="block text-xs font-semibold text-gray-500 mb-1">Contraseña <span className="text-red-400">*</span></label>
                    <input
                      required
                      type="password"
                      value={form.password}
                      onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                      className="input-field w-full py-2 text-sm"
                      placeholder="Mínimo 6 caracteres"
                      minLength={6}
                    />
                  </div>
                )}

                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Carrera</label>
                  <input
                    type="text"
                    value={form.carrera}
                    onChange={e => setForm(f => ({ ...f, carrera: e.target.value }))}
                    className="input-field w-full py-2 text-sm"
                    placeholder="Ej: Ing. en Computación"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Cohorte</label>
                  <input
                    type="number"
                    value={form.anioCohorte}
                    onChange={e => setForm(f => ({ ...f, anioCohorte: e.target.value }))}
                    className="input-field w-full py-2 text-sm"
                    min={2020} max={2035}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Rol</label>
                  <select
                    value={form.rol}
                    onChange={e => setForm(f => ({ ...f, rol: e.target.value }))}
                    className="input-field w-full py-2 text-sm"
                  >
                    <option value="ALUMNA">Alumna</option>
                    <option value="LIDER">Líder</option>
                    <option value="ADMIN">Admin</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Sede</label>
                  <select
                    value={form.idSede}
                    onChange={e => setForm(f => ({ ...f, idSede: e.target.value }))}
                    className="input-field w-full py-2 text-sm"
                  >
                    <option value="">Sin sede</option>
                    {sedes.map(s => (
                      <option key={s.id} value={s.id}>{s.nombre}</option>
                    ))}
                  </select>
                </div>

                {form.rol === 'LIDER' && (
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1">Ruta</label>
                    <select
                      value={form.rutaAsignada}
                      onChange={e => setForm(f => ({ ...f, rutaAsignada: e.target.value }))}
                      className="input-field w-full py-2 text-sm"
                    >
                      <option value="">Sin ruta</option>
                      {RUTAS_VALIDAS.map(r => (
                        <option key={r} value={r}>{r.charAt(0) + r.slice(1).toLowerCase()}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-2 pt-1">
                <button type="button" onClick={cerrarModal} className="btn-outline text-sm py-1.5 px-4">
                  Cancelar
                </button>
                <button type="submit" disabled={guardandoForm} className="btn-primary text-sm py-1.5 px-4 disabled:opacity-50">
                  {guardandoForm ? 'Guardando...' : modal === 'crear' ? 'Crear' : 'Guardar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Nombre</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Carrera</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Rol</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Sede</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Ruta</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {alumnas.map(a => (
                <tr key={a.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-4 py-3">
                    <div>
                      <p className="font-medium text-gray-800 truncate max-w-[160px]">{a.nombre}</p>
                      <p className="text-[11px] text-gray-400 truncate max-w-[160px]">{a.email}</p>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs">{a.carrera ?? '—'}</td>

                  {/* Rol */}
                  <td className="px-4 py-3">
                    <select
                      value={a.rol}
                      disabled={!!guardando[`rol_${a.id}`]}
                      onChange={e => cambiarRol(a, e.target.value)}
                      className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-mmt-purple/30 disabled:opacity-50"
                    >
                      <option value="ALUMNA">Alumna</option>
                      <option value="LIDER">Líder</option>
                      <option value="ADMIN">Admin</option>
                    </select>
                  </td>

                  {/* Sede */}
                  <td className="px-4 py-3">
                    <select
                      value={a.id_sede ?? ''}
                      disabled={!!guardando[`sede_${a.id}`]}
                      onChange={e => cambiarSede(a, e.target.value)}
                      className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-mmt-purple/30 disabled:opacity-50"
                    >
                      <option value="">Sin sede</option>
                      {sedes.map(s => (
                        <option key={s.id} value={s.id}>{s.nombre}</option>
                      ))}
                    </select>
                  </td>

                  {/* Ruta (solo si es LIDER) */}
                  <td className="px-4 py-3">
                    {a.rol === 'LIDER' ? (
                      <select
                        value={a.ruta_asignada ?? ''}
                        disabled={!!guardando[`ruta_${a.id}`]}
                        onChange={e => cambiarRuta(a, e.target.value)}
                        className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-mmt-purple/30 disabled:opacity-50"
                      >
                        <option value="">Sin ruta</option>
                        {RUTAS_VALIDAS.map(r => (
                          <option key={r} value={r}>{r.charAt(0) + r.slice(1).toLowerCase()}</option>
                        ))}
                      </select>
                    ) : (
                      <span className="text-gray-300 text-xs">—</span>
                    )}
                  </td>

                  {/* Acciones */}
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => abrirEditar(a)}
                        title="Editar"
                        className="p-1.5 rounded-lg text-gray-400 hover:text-mmt-purple hover:bg-mmt-purple-50 transition-colors"
                      >
                        <IconEdit />
                      </button>
                      {a.id !== yo?.id && (
                        <button
                          onClick={() => eliminar(a)}
                          title="Eliminar"
                          className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                        >
                          <IconTrash />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {alumnas.length === 0 && (
            <p className="text-center text-gray-400 text-sm py-10">No hay usuarias.</p>
          )}
        </div>
      </div>
    </div>
  )
}

// -------------------------------------------------------
// TAB SEDES
// -------------------------------------------------------

const FORM_SEDE_VACIO = { nombre: '', ciudad: '' }

function TabSedes() {
  const [sedes,       setSedes]       = useState([])
  const [cargando,    setCargando]    = useState(true)
  const [error,       setError]       = useState(null)
  const [form,        setForm]        = useState(FORM_SEDE_VACIO)
  const [editandoId,  setEditandoId]  = useState(null)
  const [mostrarForm, setMostrarForm] = useState(false)
  const [guardando,   setGuardando]   = useState(false)
  const [errorForm,   setErrorForm]   = useState(null)

  const cargar = useCallback(async () => {
    setCargando(true)
    setError(null)
    try {
      const json = await apiFetch('/api/admin/sedes')
      setSedes(json.sedes ?? [])
    } catch (err) {
      setError(err.message)
    } finally {
      setCargando(false)
    }
  }, [])

  useEffect(() => { cargar() }, [cargar])

  function iniciarCreacion() {
    setForm(FORM_SEDE_VACIO)
    setEditandoId(null)
    setErrorForm(null)
    setMostrarForm(true)
  }

  function iniciarEdicion(sede) {
    setForm({ nombre: sede.nombre, ciudad: sede.ciudad })
    setEditandoId(sede.id)
    setErrorForm(null)
    setMostrarForm(true)
  }

  function cancelar() {
    setMostrarForm(false)
    setEditandoId(null)
    setForm(FORM_SEDE_VACIO)
    setErrorForm(null)
  }

  async function guardar(e) {
    e.preventDefault()
    if (!form.nombre.trim() || !form.ciudad.trim()) {
      setErrorForm('Nombre y ciudad son obligatorios.')
      return
    }
    setGuardando(true)
    setErrorForm(null)
    try {
      if (editandoId) {
        await apiFetch(`/api/sedes/${editandoId}`, {
          method: 'PATCH',
          body:   JSON.stringify(form),
        })
      } else {
        await apiFetch('/api/sedes', {
          method: 'POST',
          body:   JSON.stringify(form),
        })
      }
      cancelar()
      await cargar()
    } catch (err) {
      setErrorForm(err.message)
    } finally {
      setGuardando(false)
    }
  }

  async function eliminar(id) {
    if (!window.confirm('¿Eliminar esta sede?')) return
    try {
      await apiFetch(`/api/sedes/${id}`, { method: 'DELETE' })
      await cargar()
    } catch (err) {
      alert(err.message)
    }
  }

  async function toggleActiva(sede) {
    try {
      await apiFetch(`/api/sedes/${sede.id}`, {
        method: 'PATCH',
        body:   JSON.stringify({ activa: !sede.activa }),
      })
      await cargar()
    } catch (err) {
      alert(err.message)
    }
  }

  if (cargando) return <Spinner />
  if (error)    return <ErrorCard mensaje={error} />

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-bold text-gray-600 uppercase tracking-wider">
          Sedes ({sedes.length})
        </h2>
        <button
          onClick={mostrarForm ? cancelar : iniciarCreacion}
          className={mostrarForm ? 'btn-outline text-sm py-1.5 px-3' : 'btn-primary text-sm py-1.5 px-3'}
        >
          {mostrarForm ? 'Cancelar' : '+ Nueva sede'}
        </button>
      </div>

      {/* Formulario */}
      {mostrarForm && (
        <form onSubmit={guardar} className="card p-5 space-y-4 border-2 border-mmt-purple/20">
          <h3 className="font-bold text-gray-700 text-sm">{editandoId ? 'Editar sede' : 'Nueva sede'}</h3>
          {errorForm && <p className="text-xs text-red-500 bg-red-50 px-3 py-2 rounded-lg">{errorForm}</p>}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">Nombre <span className="text-red-400">*</span></label>
              <input
                type="text"
                value={form.nombre}
                onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))}
                placeholder="Ej: Sede Valparaíso"
                className="input-field w-full py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">Ciudad <span className="text-red-400">*</span></label>
              <input
                type="text"
                value={form.ciudad}
                onChange={e => setForm(f => ({ ...f, ciudad: e.target.value }))}
                placeholder="Ej: Valparaíso"
                className="input-field w-full py-2 text-sm"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <button type="button" onClick={cancelar} className="btn-outline text-sm py-1.5 px-4">Cancelar</button>
            <button type="submit" disabled={guardando} className="btn-primary text-sm py-1.5 px-4 disabled:opacity-50">
              {guardando ? 'Guardando...' : editandoId ? 'Guardar' : 'Crear'}
            </button>
          </div>
        </form>
      )}

      {/* Lista */}
      <div className="space-y-2">
        {sedes.map(s => (
          <div key={s.id} className={`card p-4 flex items-center gap-4 ${!s.activa ? 'opacity-60' : ''}`}>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="font-semibold text-gray-800 text-sm">{s.nombre}</p>
                {!s.activa && (
                  <span className="text-[10px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full font-bold">Inactiva</span>
                )}
              </div>
              <p className="text-xs text-gray-400">{s.ciudad} · {s.total_alumnas} alumna{s.total_alumnas !== 1 ? 's' : ''}</p>
            </div>
            <div className="flex items-center gap-1 flex-shrink-0">
              <button
                onClick={() => toggleActiva(s)}
                title={s.activa ? 'Desactivar' : 'Activar'}
                className={`p-2 rounded-xl text-xs font-bold transition-colors ${
                  s.activa
                    ? 'text-green-500 hover:bg-green-50'
                    : 'text-gray-400 hover:bg-gray-100'
                }`}
              >
                <IconCheck />
              </button>
              <button
                onClick={() => iniciarEdicion(s)}
                className="p-2 rounded-xl text-gray-400 hover:text-mmt-purple hover:bg-mmt-purple-50 transition-colors"
                title="Editar"
              >
                <IconEdit />
              </button>
              <button
                onClick={() => eliminar(s.id)}
                className="p-2 rounded-xl text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                title="Eliminar"
              >
                <IconTrash />
              </button>
            </div>
          </div>
        ))}
        {sedes.length === 0 && (
          <div className="card p-8 text-center text-gray-400 text-sm">No hay sedes creadas.</div>
        )}
      </div>
    </div>
  )
}

// -------------------------------------------------------
// TAB ASIGNATURAS
// -------------------------------------------------------

const FORM_ASIG_VACIO = { nombre: '', codigo: '', descripcion: '' }

function TabAsignaturas() {
  const [asignaturas, setAsignaturas] = useState([])
  const [cargando,    setCargando]    = useState(true)
  const [error,       setError]       = useState(null)
  const [form,        setForm]        = useState(FORM_ASIG_VACIO)
  const [editandoId,  setEditandoId]  = useState(null)
  const [mostrarForm, setMostrarForm] = useState(false)
  const [guardando,   setGuardando]   = useState(false)
  const [errorForm,   setErrorForm]   = useState(null)

  const cargar = useCallback(async () => {
    setCargando(true)
    setError(null)
    try {
      const json = await apiFetch('/api/admin/asignaturas')
      setAsignaturas(json.asignaturas ?? [])
    } catch (err) {
      setError(err.message)
    } finally {
      setCargando(false)
    }
  }, [])

  useEffect(() => { cargar() }, [cargar])

  function iniciarCreacion() {
    setForm(FORM_ASIG_VACIO)
    setEditandoId(null)
    setErrorForm(null)
    setMostrarForm(true)
  }

  function iniciarEdicion(a) {
    setForm({ nombre: a.nombre, codigo: a.codigo ?? '', descripcion: a.descripcion ?? '' })
    setEditandoId(a.id)
    setErrorForm(null)
    setMostrarForm(true)
  }

  function cancelar() {
    setMostrarForm(false)
    setEditandoId(null)
    setForm(FORM_ASIG_VACIO)
    setErrorForm(null)
  }

  async function guardar(e) {
    e.preventDefault()
    if (!form.nombre.trim()) { setErrorForm('El nombre es obligatorio.'); return }
    setGuardando(true)
    setErrorForm(null)
    try {
      if (editandoId) {
        await apiFetch(`/api/admin/asignaturas/${editandoId}`, {
          method: 'PATCH',
          body:   JSON.stringify(form),
        })
      } else {
        await apiFetch('/api/admin/asignaturas', {
          method: 'POST',
          body:   JSON.stringify(form),
        })
      }
      cancelar()
      await cargar()
    } catch (err) {
      setErrorForm(err.message)
    } finally {
      setGuardando(false)
    }
  }

  async function toggleActiva(a) {
    try {
      await apiFetch(`/api/admin/asignaturas/${a.id}`, {
        method: 'PATCH',
        body:   JSON.stringify({ activa: !a.activa }),
      })
      setAsignaturas(prev => prev.map(x => x.id === a.id ? { ...x, activa: !a.activa } : x))
    } catch (err) {
      alert(err.message)
    }
  }

  if (cargando) return <Spinner />
  if (error)    return <ErrorCard mensaje={error} />

  const activas   = asignaturas.filter(a => a.activa).length
  const inactivas = asignaturas.length - activas

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-bold text-gray-600 uppercase tracking-wider">
            Asignaturas ({asignaturas.length})
          </h2>
          <p className="text-xs text-gray-400 mt-0.5">
            {activas} activa{activas !== 1 ? 's' : ''} · {inactivas} inactiva{inactivas !== 1 ? 's' : ''}
          </p>
        </div>
        <button
          onClick={mostrarForm ? cancelar : iniciarCreacion}
          className={mostrarForm ? 'btn-outline text-sm py-1.5 px-3' : 'btn-primary text-sm py-1.5 px-3'}
        >
          {mostrarForm ? 'Cancelar' : '+ Nueva asignatura'}
        </button>
      </div>

      {/* Formulario */}
      {mostrarForm && (
        <form onSubmit={guardar} className="card p-5 space-y-4 border-2 border-mmt-purple/20">
          <h3 className="font-bold text-gray-700 text-sm">
            {editandoId ? 'Editar asignatura' : 'Nueva asignatura'}
          </h3>
          {errorForm && <p className="text-xs text-red-500 bg-red-50 px-3 py-2 rounded-lg">{errorForm}</p>}
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2 sm:col-span-1">
              <label className="block text-xs font-semibold text-gray-500 mb-1">
                Nombre <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={form.nombre}
                onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))}
                placeholder="Ej: Desarrollo Web"
                className="input-field w-full py-2 text-sm"
                autoFocus
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">
                Código <span className="text-gray-400 font-normal">(opcional)</span>
              </label>
              <input
                type="text"
                value={form.codigo}
                onChange={e => setForm(f => ({ ...f, codigo: e.target.value }))}
                placeholder="Ej: DW301"
                className="input-field w-full py-2 text-sm uppercase"
              />
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-semibold text-gray-500 mb-1">Descripción</label>
              <textarea
                value={form.descripcion}
                onChange={e => setForm(f => ({ ...f, descripcion: e.target.value }))}
                rows={2}
                placeholder="Descripción breve (opcional)"
                className="input-field w-full py-2 text-sm resize-none"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <button type="button" onClick={cancelar} className="btn-outline text-sm py-1.5 px-4">Cancelar</button>
            <button type="submit" disabled={guardando} className="btn-primary text-sm py-1.5 px-4 disabled:opacity-50">
              {guardando ? 'Guardando...' : editandoId ? 'Guardar' : 'Crear'}
            </button>
          </div>
        </form>
      )}

      {/* Lista */}
      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Asignatura</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider w-20">Código</th>
              <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider w-20">Materiales</th>
              <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider w-24">Estado</th>
              <th className="px-4 py-3 w-20" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {asignaturas.map(a => (
              <tr key={a.id} className={`hover:bg-gray-50/50 transition-colors ${!a.activa ? 'opacity-60' : ''}`}>
                <td className="px-4 py-3">
                  <p className="font-medium text-gray-800 text-sm">{a.nombre}</p>
                  {a.descripcion && (
                    <p className="text-[11px] text-gray-400 truncate max-w-[220px]">{a.descripcion}</p>
                  )}
                </td>
                <td className="px-4 py-3 font-mono text-xs text-gray-500">{a.codigo ?? '—'}</td>
                <td className="px-4 py-3 text-center">
                  <span className="text-sm font-bold text-mmt-purple">{a.total_materiales}</span>
                </td>
                <td className="px-4 py-3 text-center">
                  <button
                    onClick={() => toggleActiva(a)}
                    className={`text-[10px] font-bold px-2.5 py-1 rounded-full transition-colors ${
                      a.activa
                        ? 'bg-green-100 text-green-700 hover:bg-green-200'
                        : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                    }`}
                  >
                    {a.activa ? 'Activa' : 'Inactiva'}
                  </button>
                </td>
                <td className="px-4 py-3 text-right">
                  <button
                    onClick={() => iniciarEdicion(a)}
                    className="p-2 rounded-xl text-gray-400 hover:text-mmt-purple hover:bg-mmt-purple-50 transition-colors"
                    title="Editar"
                  >
                    <IconEdit />
                  </button>
                </td>
              </tr>
            ))}
            {asignaturas.length === 0 && (
              <tr>
                <td colSpan={5} className="text-center text-gray-400 text-sm py-10">
                  No hay asignaturas.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// -------------------------------------------------------
// TAB NOTICIAS
// -------------------------------------------------------

const FORM_NOTICIA_VACIO = { titulo: '', contenido: '', imagenUrl: '', idSede: '' }

function TabNoticias() {
  const [noticias,       setNoticias]       = useState([])
  const [sedes,          setSedes]          = useState([])
  const [cargando,       setCargando]       = useState(true)
  const [error,          setError]          = useState(null)
  const [form,           setForm]           = useState(FORM_NOTICIA_VACIO)
  const [imagenFile,     setImagenFile]     = useState(null)
  const [imagenPreview,  setImagenPreview]  = useState(null)
  const [editandoId,     setEditandoId]     = useState(null)
  const [mostrarForm,    setMostrarForm]    = useState(false)
  const [guardando,      setGuardando]      = useState(false)
  const [errorForm,      setErrorForm]      = useState(null)
  const imagenInputRef = useRef(null)

  const cargar = useCallback(async () => {
    setCargando(true)
    setError(null)
    try {
      const [rNoticias, rSedes] = await Promise.all([
        apiFetch('/api/admin/noticias'),
        apiFetch('/api/sedes'),
      ])
      setNoticias(rNoticias.noticias ?? [])
      setSedes(rSedes.sedes ?? [])
    } catch (err) {
      setError(err.message)
    } finally {
      setCargando(false)
    }
  }, [])

  useEffect(() => { cargar() }, [cargar])

  function seleccionarImagen(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setImagenFile(file)
    setImagenPreview(URL.createObjectURL(file))
    setForm(f => ({ ...f, imagenUrl: '' }))
  }

  function iniciarCreacion() {
    setForm(FORM_NOTICIA_VACIO)
    setImagenFile(null); setImagenPreview(null)
    setEditandoId(null)
    setErrorForm(null)
    setMostrarForm(true)
  }

  function iniciarEdicion(n) {
    setForm({
      titulo:    n.titulo,
      contenido: n.contenido,
      imagenUrl: n.imagen_url ?? '',
      idSede:    n.id_sede ?? '',
    })
    setImagenFile(null)
    setImagenPreview(n.imagen_url ?? null)
    setEditandoId(n.id)
    setErrorForm(null)
    setMostrarForm(true)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function cancelar() {
    setMostrarForm(false)
    setEditandoId(null)
    setForm(FORM_NOTICIA_VACIO)
    setImagenFile(null); setImagenPreview(null)
    setErrorForm(null)
  }

  async function guardar(e) {
    e.preventDefault()
    if (!form.titulo.trim())    { setErrorForm('El título es obligatorio.');   return }
    if (!form.contenido.trim()) { setErrorForm('El contenido es obligatorio.'); return }
    setGuardando(true)
    setErrorForm(null)
    try {
      const payload = {
        titulo:    form.titulo.trim(),
        contenido: form.contenido.trim(),
        imagenUrl: form.imagenUrl.trim() || null,
        idSede:    form.idSede ? Number(form.idSede) : null,
      }
      let id = editandoId
      if (editandoId) {
        await apiFetch(`/api/noticias/${editandoId}`, { method: 'PATCH', body: JSON.stringify(payload) })
      } else {
        const json = await apiFetch('/api/noticias', { method: 'POST', body: JSON.stringify(payload) })
        id = json.noticia?.id
      }
      // Subir imagen si se seleccionó un archivo
      if (imagenFile && id) {
        const fd = new FormData()
        fd.append('imagen', imagenFile)
        await apiFetch(`/api/noticias/${id}/imagen`, { method: 'POST', body: fd })
      }
      cancelar()
      await cargar()
    } catch (err) {
      setErrorForm(err.message)
    } finally {
      setGuardando(false)
    }
  }

  async function togglePublicada(n) {
    try {
      await apiFetch(`/api/noticias/${n.id}`, {
        method: 'PATCH',
        body:   JSON.stringify({ publicada: !n.publicada }),
      })
      setNoticias(prev => prev.map(x => x.id === n.id ? { ...x, publicada: !n.publicada } : x))
    } catch (err) {
      alert(err.message)
    }
  }

  async function eliminar(id) {
    if (!window.confirm('¿Eliminar esta noticia?')) return
    try {
      await apiFetch(`/api/noticias/${id}`, { method: 'DELETE' })
      await cargar()
    } catch (err) {
      alert(err.message)
    }
  }

  if (cargando) return <Spinner />
  if (error)    return <ErrorCard mensaje={error} />

  const publicadas = noticias.filter(n => n.publicada).length
  const borradores = noticias.length - publicadas

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-bold text-gray-600 uppercase tracking-wider">
            Noticias ({noticias.length})
          </h2>
          <p className="text-xs text-gray-400 mt-0.5">
            {publicadas} publicada{publicadas !== 1 ? 's' : ''} · {borradores} borrador{borradores !== 1 ? 'es' : ''}
          </p>
        </div>
        <button
          onClick={mostrarForm ? cancelar : iniciarCreacion}
          className={mostrarForm ? 'btn-outline text-sm py-1.5 px-3' : 'btn-primary text-sm py-1.5 px-3'}
        >
          {mostrarForm ? 'Cancelar' : '+ Nueva noticia'}
        </button>
      </div>

      {/* Formulario */}
      {mostrarForm && (
        <form onSubmit={guardar} className="card p-5 space-y-4 border-2 border-mmt-purple/20">
          <h3 className="font-bold text-gray-700 text-sm">{editandoId ? 'Editar noticia' : 'Nueva noticia'}</h3>
          {errorForm && <p className="text-xs text-red-500 bg-red-50 px-3 py-2 rounded-lg">{errorForm}</p>}

          <div className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">Título <span className="text-red-400">*</span></label>
              <input
                type="text"
                value={form.titulo}
                onChange={e => setForm(f => ({ ...f, titulo: e.target.value }))}
                placeholder="Título de la noticia"
                className="input-field w-full py-2 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">Contenido <span className="text-red-400">*</span></label>
              <textarea
                value={form.contenido}
                onChange={e => setForm(f => ({ ...f, contenido: e.target.value }))}
                placeholder="Descripción de la noticia..."
                rows={4}
                className="input-field w-full py-2 text-sm resize-none"
              />
            </div>

            {/* Imagen */}
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-2">Imagen de portada</label>
              <div className="flex gap-3 items-start">
                {/* Preview */}
                {imagenPreview && (
                  <div className="relative flex-shrink-0">
                    <img
                      src={imagenPreview.startsWith('blob:') || imagenPreview.startsWith('http')
                        ? imagenPreview
                        : `${import.meta.env.VITE_API_URL || 'http://localhost:3001'}${imagenPreview}`}
                      alt="Preview"
                      className="w-20 h-16 rounded-xl object-cover border border-gray-200"
                    />
                    <button
                      type="button"
                      onClick={() => { setImagenFile(null); setImagenPreview(null); setForm(f => ({ ...f, imagenUrl: '' })) }}
                      className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-red-500 text-white text-[10px] flex items-center justify-center"
                    >✕</button>
                  </div>
                )}
                <div className="flex-1 space-y-2">
                  {/* Upload file */}
                  <button
                    type="button"
                    onClick={() => imagenInputRef.current?.click()}
                    className="btn-outline text-xs py-1.5 px-3 w-full"
                  >
                    {imagenFile ? `📎 ${imagenFile.name}` : '↑ Subir imagen'}
                  </button>
                  <input ref={imagenInputRef} type="file" accept="image/*" className="hidden" onChange={seleccionarImagen} />
                  {/* O URL */}
                  {!imagenFile && (
                    <input
                      type="text"
                      value={form.imagenUrl}
                      onChange={e => setForm(f => ({ ...f, imagenUrl: e.target.value }))}
                      placeholder="O pega una URL de imagen..."
                      className="input-field w-full py-1.5 text-xs"
                    />
                  )}
                </div>
              </div>
            </div>

            <div className="w-1/2">
              <label className="block text-xs font-semibold text-gray-500 mb-1">Sede</label>
              <select
                value={form.idSede}
                onChange={e => setForm(f => ({ ...f, idSede: e.target.value }))}
                className="input-field w-full py-2 text-sm"
              >
                <option value="">Todas las sedes</option>
                {sedes.map(s => (
                  <option key={s.id} value={s.id}>{s.nombre}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <button type="button" onClick={cancelar} className="btn-outline text-sm py-1.5 px-4">Cancelar</button>
            <button type="submit" disabled={guardando} className="btn-primary text-sm py-1.5 px-4 disabled:opacity-50">
              {guardando ? 'Guardando...' : editandoId ? 'Guardar cambios' : 'Crear borrador'}
            </button>
          </div>
        </form>
      )}

      {/* Lista */}
      <div className="space-y-2">
        {noticias.map(n => (
          <div key={n.id} className={`card p-4 flex items-start gap-4 ${!n.publicada ? 'border-l-4 border-gray-200' : 'border-l-4 border-green-400'}`}>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  n.publicada ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                }`}>
                  {n.publicada ? 'Publicada' : 'Borrador'}
                </span>
                {n.nombre_sede && (
                  <span className="text-[10px] bg-mmt-celeste-50 text-mmt-celeste-dark px-2 py-0.5 rounded-full font-medium">
                    {n.nombre_sede}
                  </span>
                )}
                <span className="text-[10px] text-gray-400">
                  {new Date(n.creado_en).toLocaleDateString('es-CL', { day: 'numeric', month: 'short', year: 'numeric' })}
                </span>
              </div>
              <p className="font-semibold text-gray-800 text-sm truncate">{n.titulo}</p>
              <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">{n.contenido}</p>
              <p className="text-[11px] text-gray-300 mt-1">{n.likes} likes · {n.comentarios} comentarios</p>
            </div>

            <div className="flex gap-1 flex-shrink-0 mt-0.5">
              <button
                onClick={() => togglePublicada(n)}
                title={n.publicada ? 'Despublicar' : 'Publicar'}
                className={`p-2 rounded-xl text-xs font-bold transition-colors ${
                  n.publicada
                    ? 'text-green-500 hover:text-orange-500 hover:bg-orange-50'
                    : 'text-gray-400 hover:text-green-500 hover:bg-green-50'
                }`}
              >
                <IconCheck />
              </button>
              <button
                onClick={() => iniciarEdicion(n)}
                className="p-2 rounded-xl text-gray-400 hover:text-mmt-purple hover:bg-mmt-purple-50 transition-colors"
                title="Editar"
              >
                <IconEdit />
              </button>
              <button
                onClick={() => eliminar(n.id)}
                className="p-2 rounded-xl text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                title="Eliminar"
              >
                <IconTrash />
              </button>
            </div>
          </div>
        ))}

        {noticias.length === 0 && (
          <div className="card p-8 text-center text-gray-400 text-sm">No hay noticias creadas.</div>
        )}
      </div>
    </div>
  )
}

// -------------------------------------------------------
// Helpers
// -------------------------------------------------------

function Spinner() {
  return (
    <div className="flex justify-center py-16">
      <div className="w-7 h-7 border-[3px] border-mmt-purple border-t-transparent rounded-full animate-spin" />
    </div>
  )
}

function ErrorCard({ mensaje }) {
  return <div className="card p-6 text-red-500 text-sm text-center">{mensaje}</div>
}

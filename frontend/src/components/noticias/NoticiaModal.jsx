/*
 * components/noticias/NoticiaModal.jsx
 * Modal de detalle de noticia: imagen, contenido, likes, comentarios.
 * Si el usuario es la autora (o ADMIN), puede editar y subir imagen.
 */

import { useState, useEffect, useCallback, useRef } from 'react'
import { apiFetch } from '../../hooks/useApi'
import { useSesion } from '../../context/SesionContext'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001'

function formatearFecha(iso) {
  return new Date(iso).toLocaleDateString('es-CL', {
    day: 'numeric', month: 'long', year: 'numeric',
  })
}
function iniciales(nombre) {
  if (!nombre) return '?'
  return nombre.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase()
}
function urlImagen(url) {
  if (!url) return null
  return url.startsWith('http') ? url : `${API_BASE}${url}`
}

export default function NoticiaModal({ noticia: noticiaBase, onCerrar, onActualizar }) {
  const { alumna } = useSesion()

  const [noticia,         setNoticia]         = useState(noticiaBase)
  const [comentarios,     setComentarios]     = useState([])
  const [cargandoComents, setCargandoComents] = useState(true)
  const [nuevoComentario, setNuevoComentario] = useState('')
  const [enviando,        setEnviando]        = useState(false)
  const [likeando,        setLikeando]        = useState(false)

  // Edición
  const [editando,       setEditando]       = useState(false)
  const [formEdit,       setFormEdit]       = useState({ titulo: '', contenido: '' })
  const [guardando,      setGuardando]      = useState(false)
  const [errorEdit,      setErrorEdit]      = useState(null)
  const [imagenFile,     setImagenFile]     = useState(null)
  const [imagenPreview,  setImagenPreview]  = useState(null)
  const imagenRef = useRef(null)

  const esAutora = alumna?.id === noticia.id_autora
  const esAdmin  = alumna?.rol === 'ADMIN'
  const puedeEditar = esAutora || esAdmin

  const cargarNoticia = useCallback(async () => {
    try {
      const json = await apiFetch(`/api/noticias/${noticiaBase.id}`)
      setNoticia(json.noticia)
    } catch { /* usar datos base */ }
  }, [noticiaBase.id])

  const cargarComentarios = useCallback(async () => {
    setCargandoComents(true)
    try {
      const json = await apiFetch(`/api/noticias/${noticiaBase.id}/comentarios`)
      setComentarios(json.comentarios)
    } catch {
      setComentarios([])
    } finally {
      setCargandoComents(false)
    }
  }, [noticiaBase.id])

  useEffect(() => {
    cargarNoticia()
    cargarComentarios()
  }, [cargarNoticia, cargarComentarios])

  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape' && !editando) onCerrar() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onCerrar, editando])

  async function handleLike() {
    if (!alumna || likeando) return
    setLikeando(true)
    try {
      const json = await apiFetch(`/api/noticias/${noticia.id}/like`, { method: 'POST' })
      setNoticia(prev => ({
        ...prev,
        me_gusta: json.liked,
        likes: prev.likes + (json.liked ? 1 : -1),
      }))
    } catch { /* silenciar */ } finally {
      setLikeando(false)
    }
  }

  async function enviarComentario(e) {
    e.preventDefault()
    if (!nuevoComentario.trim() || enviando) return
    setEnviando(true)
    try {
      await apiFetch(`/api/noticias/${noticia.id}/comentarios`, {
        method: 'POST',
        body:   JSON.stringify({ contenido: nuevoComentario.trim() }),
      })
      setNuevoComentario('')
      await cargarComentarios()
    } catch (err) {
      alert(err.message)
    } finally {
      setEnviando(false)
    }
  }

  function abrirEdicion() {
    setFormEdit({ titulo: noticia.titulo, contenido: noticia.contenido })
    setImagenFile(null)
    setImagenPreview(noticia.imagen_url ? urlImagen(noticia.imagen_url) : null)
    setErrorEdit(null)
    setEditando(true)
  }

  function seleccionarImagen(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setImagenFile(file)
    setImagenPreview(URL.createObjectURL(file))
  }

  async function guardarEdicion(e) {
    e.preventDefault()
    if (!formEdit.titulo.trim())    { setErrorEdit('El título es obligatorio.');    return }
    if (!formEdit.contenido.trim()) { setErrorEdit('El contenido es obligatorio.'); return }
    setGuardando(true)
    setErrorEdit(null)
    try {
      await apiFetch(`/api/noticias/${noticia.id}`, {
        method: 'PATCH',
        body:   JSON.stringify({ titulo: formEdit.titulo.trim(), contenido: formEdit.contenido.trim() }),
      })
      if (imagenFile) {
        const fd = new FormData()
        fd.append('imagen', imagenFile)
        await apiFetch(`/api/noticias/${noticia.id}/imagen`, { method: 'POST', body: fd })
      }
      await cargarNoticia()
      setEditando(false)
      if (onActualizar) onActualizar()
    } catch (err) {
      setErrorEdit(err.message)
    } finally {
      setGuardando(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={() => !editando && onCerrar()}
    >
      <div
        className="relative bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[92vh] flex flex-col overflow-hidden"
        onClick={e => e.stopPropagation()}
      >

        {/* ---- Imagen de portada ---- */}
        {noticia.imagen_url && !editando && (
          <div className="relative h-52 flex-shrink-0 overflow-hidden">
            <img
              src={urlImagen(noticia.imagen_url)}
              alt={noticia.titulo}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
            <div className="absolute bottom-4 left-6 right-6">
              <p className="text-[10px] font-semibold text-white/70 mb-1">
                {noticia.nombre_autora} · {formatearFecha(noticia.creado_en)}
              </p>
              <h2 className="text-lg font-bold text-white leading-snug">{noticia.titulo}</h2>
            </div>
            <button
              onClick={onCerrar}
              className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/30 hover:bg-black/50 text-white flex items-center justify-center text-sm transition-colors"
            >
              ✕
            </button>
            {puedeEditar && (
              <button
                onClick={abrirEdicion}
                className="absolute top-3 right-12 text-xs font-semibold px-3 py-1 rounded-full bg-white/20 hover:bg-white/40 text-white transition-colors backdrop-blur-sm"
              >
                Editar
              </button>
            )}
          </div>
        )}

        {/* ---- Encabezado sin imagen ---- */}
        {(!noticia.imagen_url || editando) && (
          <div className="p-6 border-b border-gray-100 flex items-start justify-between gap-4 flex-shrink-0">
            <div className="flex-1">
              <p className="text-[10px] font-semibold text-mmt-purple mb-1">
                {noticia.nombre_autora} · {formatearFecha(noticia.creado_en)}
              </p>
              <h2 className="text-lg font-bold text-gray-800 leading-snug">{noticia.titulo}</h2>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              {puedeEditar && !editando && (
                <button
                  onClick={abrirEdicion}
                  className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-gray-100 text-gray-600 hover:bg-mmt-purple hover:text-white transition-colors"
                >
                  Editar
                </button>
              )}
              <button
                onClick={() => { setEditando(false); onCerrar() }}
                className="p-2 rounded-xl text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
              >
                ✕
              </button>
            </div>
          </div>
        )}

        {/* ---- Contenido scrolleable ---- */}
        <div className="overflow-y-auto flex-1 divide-y divide-gray-100">

          {/* ---- Modo EDICIÓN ---- */}
          {editando && (
            <form onSubmit={guardarEdicion} className="p-6 space-y-4">
              {errorEdit && (
                <p className="text-xs text-red-500 bg-red-50 px-3 py-2 rounded-lg">{errorEdit}</p>
              )}

              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">
                  Título <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={formEdit.titulo}
                  onChange={e => setFormEdit(f => ({ ...f, titulo: e.target.value }))}
                  className="input-field w-full py-2 text-sm"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">
                  Contenido <span className="text-red-400">*</span>
                </label>
                <textarea
                  value={formEdit.contenido}
                  onChange={e => setFormEdit(f => ({ ...f, contenido: e.target.value }))}
                  rows={5}
                  className="input-field w-full py-2 text-sm resize-none"
                />
              </div>

              {/* Imagen */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-2">Imagen de portada</label>
                <div className="flex gap-3 items-start">
                  {imagenPreview && (
                    <div className="relative flex-shrink-0">
                      <img src={imagenPreview} alt="preview" className="w-24 h-16 rounded-xl object-cover border border-gray-200" />
                      <button
                        type="button"
                        onClick={() => { setImagenFile(null); setImagenPreview(null) }}
                        className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-red-500 text-white text-[10px] flex items-center justify-center"
                      >✕</button>
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => imagenRef.current?.click()}
                    className="btn-outline text-xs py-1.5 px-3"
                  >
                    {imagenFile ? `📎 ${imagenFile.name}` : '↑ Cambiar imagen'}
                  </button>
                  <input ref={imagenRef} type="file" accept="image/*" className="hidden" onChange={seleccionarImagen} />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-1">
                <button type="button" onClick={() => setEditando(false)} className="btn-outline text-sm py-2 px-4">
                  Cancelar
                </button>
                <button type="submit" disabled={guardando} className="btn-primary text-sm py-2 px-5 disabled:opacity-50">
                  {guardando ? 'Guardando...' : 'Guardar cambios'}
                </button>
              </div>
            </form>
          )}

          {/* ---- Modo VISTA ---- */}
          {!editando && (
            <>
              <div className="p-6 space-y-4">
                <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">
                  {noticia.contenido}
                </p>

                {/* Like button */}
                <div className="flex items-center gap-4 pt-2">
                  <button
                    onClick={handleLike}
                    disabled={!alumna || likeando}
                    className={`flex items-center gap-1.5 text-sm font-semibold px-4 py-2 rounded-xl transition-all
                      ${noticia.me_gusta
                        ? 'bg-red-50 text-red-500 hover:bg-red-100'
                        : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                      } disabled:opacity-40 disabled:cursor-not-allowed`}
                  >
                    {noticia.me_gusta ? '❤️' : '🤍'} {noticia.likes}
                  </button>
                  {!alumna && (
                    <p className="text-[10px] text-gray-400 italic">Inicia sesión para dar like y comentar</p>
                  )}
                </div>
              </div>

              {/* Comentarios */}
              <div className="p-6 space-y-4">
                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                  Comentarios {!cargandoComents && `(${comentarios.length})`}
                </p>

                {cargandoComents ? (
                  <div className="flex justify-center py-4">
                    <div className="w-5 h-5 border-2 border-mmt-purple/30 border-t-mmt-purple rounded-full animate-spin" />
                  </div>
                ) : comentarios.length === 0 ? (
                  <p className="text-xs text-gray-400 text-center py-3">Sin comentarios aún.</p>
                ) : (
                  <div className="space-y-4">
                    {comentarios.map(c => (
                      <div key={c.id} className="flex gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-mmt-purple to-mmt-celeste
                                        flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0">
                          {iniciales(c.nombre_alumna)}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-baseline gap-2 flex-wrap">
                            <span className="text-xs font-semibold text-gray-800">{c.nombre_alumna}</span>
                            <span className="text-[10px] text-gray-400">{formatearFecha(c.creado_en)}</span>
                          </div>
                          <p className="text-sm text-gray-600 mt-0.5 leading-relaxed">{c.contenido}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {alumna && (
                  <form onSubmit={enviarComentario} className="flex gap-2 pt-2">
                    <input
                      type="text"
                      value={nuevoComentario}
                      onChange={e => setNuevoComentario(e.target.value)}
                      placeholder="Escribe un comentario..."
                      className="input-field flex-1 text-sm py-2"
                      disabled={enviando}
                    />
                    <button
                      type="submit"
                      disabled={!nuevoComentario.trim() || enviando}
                      className="btn-primary text-sm px-4 py-2 disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      {enviando ? '...' : 'Enviar'}
                    </button>
                  </form>
                )}
              </div>
            </>
          )}

        </div>
      </div>
    </div>
  )
}

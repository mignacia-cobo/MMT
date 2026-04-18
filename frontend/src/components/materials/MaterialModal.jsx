/*
 * components/materials/MaterialModal.jsx
 *
 * DUENA del material:
 *   - Tabs: "Vista previa" | "Editar codigo"
 *   - Puede guardar cambios en el codigo
 *   - Boton pantalla completa en vista previa
 *
 * USUARIAS (no duenas):
 *   - Sin tabs: solo vista previa del iframe a pantalla completa de la columna
 *   - Boton de descarga si hay archivo adjunto
 *   - Boton pantalla completa
 *   - NO ven el codigo fuente
 */

import { useState, useEffect } from 'react'
import { useSesion }  from '../../context/SesionContext'
import { apiFetch }   from '../../hooks/useApi'

// ---- SVG icons ----
function IconDownload() {
  return (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  )
}
function IconCode() {
  return (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="16 18 22 12 16 6" /><polyline points="8 6 2 12 8 18" />
    </svg>
  )
}
function IconRefresh() {
  return (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="23 4 23 10 17 10" /><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
    </svg>
  )
}
function IconExpand() {
  return (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="15 3 21 3 21 9" /><polyline points="9 21 3 21 3 15" />
      <line x1="21" y1="3" x2="14" y2="10" /><line x1="3" y1="21" x2="10" y2="14" />
    </svg>
  )
}
function IconSave() {
  return (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
      <polyline points="17 21 17 13 7 13 7 21" /><polyline points="7 3 7 8 15 8" />
    </svg>
  )
}
function IconPreview() {
  return (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  )
}

const TIPOS = {
  pdf:    { fondo: 'bg-red-50',    texto: 'text-red-500',    etiqueta: 'PDF'    },
  imagen: { fondo: 'bg-green-50',  texto: 'text-green-600',  etiqueta: 'Imagen' },
  codigo: { fondo: 'bg-indigo-50', texto: 'text-indigo-600', etiqueta: 'Codigo' },
  otro:   { fondo: 'bg-gray-50',   texto: 'text-gray-500',   etiqueta: 'Archivo'},
}

function iniciales(nombre) {
  if (!nombre) return '?'
  return nombre.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase()
}

// ---- Overlay de pantalla completa ----
function DemoFullscreen({ codigo, onCerrar }) {
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onCerrar() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onCerrar])

  return (
    <div className="fixed inset-0 z-[60] flex flex-col">
      <div className="flex items-center justify-between px-6 py-3 bg-gray-900 text-white flex-shrink-0">
        <p className="text-sm font-semibold flex items-center gap-2">
          <IconPreview /> Vista previa — pantalla completa
        </p>
        <button
          onClick={onCerrar}
          className="text-xs font-bold px-4 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
        >
          Cerrar (Esc)
        </button>
      </div>
      <iframe
        srcDoc={codigo}
        sandbox="allow-scripts"
        className="flex-1 w-full bg-white"
        title="Vista previa pantalla completa"
      />
    </div>
  )
}


// ---- Modal principal ----
export default function MaterialModal({ material, onCerrar }) {
  const { alumna }  = useSesion()
  const esDuena     = alumna?.id === material.id_alumna

  const [vistaTab,        setVistaTab]        = useState('preview')
  const [iframeKey,       setIframeKey]       = useState(0)
  const [fullscreen,      setFullscreen]      = useState(false)
  const [codigoEditable,  setCodigoEditable]  = useState(material.codigo_html ?? '')
  const [guardando,       setGuardando]       = useState(false)
  const [mensajeGuardado, setMensajeGuardado] = useState(null)
  const [previewKey,      setPreviewKey]      = useState(0)

  const tipo    = TIPOS[material.tipo_archivo] ?? TIPOS.otro
  const urlBase = import.meta.env.VITE_API_URL || 'http://localhost:3001'
  const codigoActivo = esDuena ? codigoEditable : (material.codigo_html ?? '')

  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape' && !fullscreen) onCerrar() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onCerrar, fullscreen])

  async function guardarCodigo() {
    setGuardando(true)
    setMensajeGuardado(null)
    try {
      await apiFetch(`/api/materiales/${material.id}/codigo`, {
        method: 'PATCH',
        body:   JSON.stringify({ codigo_html: codigoEditable }),
      })
      setMensajeGuardado('Guardado.')
      setIframeKey(k => k + 1)
      setTimeout(() => setMensajeGuardado(null), 3000)
    } catch {
      setMensajeGuardado('Error al guardar.')
    } finally {
      setGuardando(false)
    }
  }

  const tieneCodigo = !!material.codigo_html

  return (
    <>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
        onClick={onCerrar}
      >
        <div
          className="bg-white rounded-3xl shadow-2xl w-full max-w-5xl flex flex-col overflow-hidden"
          style={{ maxHeight: '92vh' }}
          onClick={e => e.stopPropagation()}
        >

          {/* Encabezado */}
          <div className="p-5 border-b border-gray-100 flex items-start justify-between gap-4 flex-shrink-0">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase ${tipo.fondo} ${tipo.texto}`}>
                  {tipo.etiqueta}
                </span>
                <span className="text-[10px] font-semibold text-mmt-celeste-dark bg-mmt-celeste-50 px-2.5 py-1 rounded-full">
                  {material.nombre_asignatura}
                </span>
                {tieneCodigo && (
                  <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-600">
                    Vista previa interactiva
                  </span>
                )}
                {esDuena && (
                  <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-mmt-purple-100 text-mmt-purple">
                    Tu material
                  </span>
                )}
              </div>
              <h2 className="text-base font-bold text-gray-800 leading-snug truncate">{material.titulo}</h2>
            </div>
            <button onClick={onCerrar} className="p-2 rounded-xl text-gray-400 hover:bg-gray-100 transition-colors flex-shrink-0">
              x
            </button>
          </div>

          {/* Cuerpo — layout vertical: metadata arriba, preview abajo */}
          <div className="overflow-y-auto flex-1">

            {/* Metadata compacta */}
            <div className="p-5 flex flex-col sm:flex-row sm:items-start gap-4 border-b border-gray-100">
              {/* Autor + fecha */}
              <div className="flex items-center gap-2.5 flex-1">
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-mmt-purple to-mmt-celeste
                                flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                  {iniciales(material.nombre_alumna)}
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-700">{material.nombre_alumna}</p>
                  <p className="text-[10px] text-gray-400">{material.carrera_alumna}</p>
                  <p className="text-[10px] text-gray-400">
                    {new Date(material.creado_en).toLocaleDateString('es-CL', { day: 'numeric', month: 'long', year: 'numeric' })}
                    {material.descargas > 0 && ` · ${material.descargas} descargas`}
                  </p>
                </div>
              </div>

              {/* Descripcion */}
              {material.descripcion && (
                <p className="text-xs text-gray-500 leading-relaxed flex-[2]">{material.descripcion}</p>
              )}

              {/* Descarga */}
              {material.url_archivo && (
                <a
                  href={`${urlBase}/api/materiales/${material.id}/descargar`}
                  target="_blank" rel="noreferrer"
                  className="flex items-center gap-2 btn-primary text-xs py-2 px-4 flex-shrink-0 self-start"
                >
                  <IconDownload /> Descargar
                </a>
              )}
            </div>

            {/* Vista previa / Editor — sección grande */}
            {tieneCodigo && (
              <div className="flex flex-col">

                {/* Barra de herramientas */}
                <div className="flex items-center justify-between px-5 py-3 bg-gray-50 border-b border-gray-100 flex-wrap gap-2">
                  {esDuena ? (
                    <div className="flex gap-1.5">
                      <button
                        onClick={() => setVistaTab('preview')}
                        className={`flex items-center gap-1 text-[10px] font-bold px-3 py-1.5 rounded-lg transition-colors
                          ${vistaTab === 'preview' ? 'bg-mmt-purple text-white' : 'bg-white border border-gray-200 text-gray-500 hover:border-mmt-purple hover:text-mmt-purple'}`}
                      >
                        <IconPreview /> Vista previa
                      </button>
                      <button
                        onClick={() => setVistaTab('codigo')}
                        className={`flex items-center gap-1 text-[10px] font-bold px-3 py-1.5 rounded-lg transition-colors
                          ${vistaTab === 'codigo' ? 'bg-mmt-purple text-white' : 'bg-white border border-gray-200 text-gray-500 hover:border-mmt-purple hover:text-mmt-purple'}`}
                      >
                        <IconCode /> Editar codigo
                      </button>
                    </div>
                  ) : (
                    <p className="flex items-center gap-1.5 text-xs font-semibold text-gray-600">
                      <IconPreview /> Vista previa
                    </p>
                  )}

                  <div className="flex items-center gap-1.5">
                    {vistaTab === 'preview' && (
                      <>
                        <button onClick={() => setIframeKey(k => k + 1)}
                          className="p-1.5 rounded-lg bg-white border border-gray-200 text-gray-500 hover:bg-gray-100 transition-colors" title="Reiniciar">
                          <IconRefresh />
                        </button>
                        <button onClick={() => setFullscreen(true)}
                          className="flex items-center gap-1 text-[10px] font-bold px-3 py-1.5 rounded-lg bg-indigo-50 text-indigo-600 hover:bg-indigo-100 transition-colors">
                          <IconExpand /> Pantalla completa
                        </button>
                      </>
                    )}
                    {vistaTab === 'codigo' && esDuena && (
                      <div className="flex items-center gap-2">
                        {mensajeGuardado && (
                          <span className={`text-[10px] font-semibold ${mensajeGuardado.includes('Error') ? 'text-red-500' : 'text-green-600'}`}>
                            {mensajeGuardado}
                          </span>
                        )}
                        <button onClick={guardarCodigo} disabled={guardando}
                          className="flex items-center gap-1 text-[10px] font-bold px-3 py-1.5 rounded-lg bg-mmt-purple text-white hover:bg-mmt-purple/90 disabled:opacity-50 transition-colors">
                          <IconSave /> {guardando ? 'Guardando...' : 'Guardar'}
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Iframe grande */}
                {vistaTab === 'preview' && (
                  <iframe
                    key={iframeKey}
                    srcDoc={codigoActivo}
                    sandbox="allow-scripts"
                    className="w-full bg-white"
                    style={{ height: '520px' }}
                    title="Vista previa interactiva"
                  />
                )}

                {/* Editor de codigo (duena) */}
                {vistaTab === 'codigo' && esDuena && (
                  <div className="flex flex-col">
                    <textarea
                      value={codigoEditable}
                      onChange={e => { setCodigoEditable(e.target.value); setPreviewKey(k => k + 1) }}
                      rows={16}
                      className="w-full font-mono text-xs bg-gray-900 text-green-300 p-5 resize-y focus:outline-none border-0"
                      spellCheck={false}
                      placeholder="<!DOCTYPE html>..."
                    />
                    {codigoEditable.trim() && (
                      <>
                        <p className="text-[9px] text-gray-500 px-5 py-2 bg-gray-50 border-t border-gray-200 uppercase tracking-wider font-semibold">
                          Preview en vivo
                        </p>
                        <iframe
                          key={previewKey}
                          srcDoc={codigoEditable}
                          sandbox="allow-scripts"
                          className="w-full bg-white border-t border-gray-100"
                          style={{ height: '240px' }}
                          title="Preview edicion"
                        />
                      </>
                    )}
                  </div>
                )}

                <p className="text-[10px] text-gray-400 text-center px-5 py-3 border-t border-gray-100">
                  Contenido ejecutado en entorno aislado (sandbox) sin acceso a datos externos.
                </p>
              </div>
            )}

          </div>

        </div>
      </div>

      {/* Pantalla completa */}
      {fullscreen && (
        <DemoFullscreen
          codigo={codigoActivo}
          onCerrar={() => setFullscreen(false)}
        />
      )}
    </>
  )
}

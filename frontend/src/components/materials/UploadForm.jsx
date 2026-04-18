/*
 * ============================================================
 * components/materials/UploadForm.jsx  —  Formulario de subida
 * ============================================================
 *
 * Permite a las alumnas autenticadas subir materiales al repositorio.
 *
 * CONCEPTOS IMPORTANTES:
 *
 *   FormData: forma de enviar archivos en HTTP. A diferencia de JSON,
 *   FormData puede contener tanto texto como archivos binarios.
 *   Ejemplo: form.append('titulo', 'Mi proyecto')
 *            form.append('archivo', archivoSeleccionado)
 *
 *   Drag & Drop: el usuario puede arrastrar un archivo sobre la zona
 *   punteada en lugar de hacer clic. Usamos los eventos onDragOver,
 *   onDragLeave y onDrop de React para manejarlo.
 */

import { useState, useRef }  from 'react'
import { apiFetch }          from '../../hooks/useApi'
import { useApi }            from '../../hooks/useApi'

// Extensiones de archivo que se permiten subir
const EXTENSIONES_ACEPTADAS = '.pdf,.jpg,.jpeg,.png,.gif,.svg,.js,.ts,.py,.html,.css,.jsx,.tsx,.json,.zip'

/**
 * @param {{ onExito: Function }} props
 *   onExito → función que se llama cuando la subida fue exitosa
 */
export default function UploadForm({ onExito }) {
  // Estado del formulario — objeto con todos los campos de texto
  const [form, setForm] = useState({
    titulo:      '',
    id_asignatura: '',
    descripcion: '',
  })

  const [archivo,      setArchivo]      = useState(null)
  const [arrastrando,  setArrastrando]  = useState(false)
  const [cargando,     setCargando]     = useState(false)
  const [errores,      setErrores]      = useState({})
  const [exito,        setExito]        = useState(false)
  const [codigoHtml,   setCodigoHtml]   = useState('')
  const [mostrarEditor, setMostrarEditor] = useState(false)
  const [iframeKey,    setIframeKey]    = useState(0)

  // Referencia al input de archivo (para abrirlo con clic)
  const refInput = useRef(null)

  // Cargamos las asignaturas desde la API para el select
  const { datos: asignaturas = [] } = useApi('/api/asignaturas')

  // Actualiza un campo del formulario de forma genérica
  function actualizarCampo(campo, valor) {
    setForm(prev => ({ ...prev, [campo]: valor }))
    // Borramos el error de ese campo si había uno
    setErrores(prev => ({ ...prev, [campo]: undefined }))
  }

  // Recibe un archivo (del input o del drag & drop)
  function recibirArchivo(archivo) {
    if (!archivo) return
    setArchivo(archivo)
    setErrores(prev => ({ ...prev, archivo: undefined }))
  }

  // Manejo del evento de drop (soltar archivo sobre la zona)
  function alSoltar(e) {
    e.preventDefault()
    setArrastrando(false)
    recibirArchivo(e.dataTransfer.files[0])
  }

  // Validaciones antes de enviar
  function validar() {
    const errs = {}
    if (!form.titulo.trim())   errs.titulo        = 'El título es obligatorio.'
    if (!form.id_asignatura)  errs.id_asignatura  = 'Selecciona una asignatura.'
    if (!archivo && !codigoHtml.trim()) errs.archivo = 'Adjunta un archivo o agrega un demo interactivo.'
    return errs
  }

  async function alEnviar(e) {
    e.preventDefault()

    // Validamos y detenemos si hay errores
    const errs = validar()
    if (Object.keys(errs).length) {
      setErrores(errs)
      return
    }

    setCargando(true)
    try {
      // Construimos el FormData con todos los campos
      const datos = new FormData()
      datos.append('titulo',        form.titulo.trim())
      datos.append('id_asignatura', form.id_asignatura)
      datos.append('descripcion',   form.descripcion.trim())
      datos.append('archivo',       archivo)
      if (codigoHtml.trim()) datos.append('codigo_html', codigoHtml.trim())

      await apiFetch('/api/materiales', {
        method: 'POST',
        body:   datos,
        // No ponemos Content-Type aquí → el navegador lo hace automáticamente con el boundary
      })

      setExito(true)
      // Limpiamos el formulario
      setForm({ titulo: '', id_asignatura: '', descripcion: '' })
      setArchivo(null)
      setCodigoHtml('')
      setMostrarEditor(false)

      // Esperamos un momento para que la alumna vea el mensaje de éxito
      setTimeout(() => {
        setExito(false)
        onExito?.()
      }, 2000)

    } catch (error) {
      setErrores({ general: error.message || 'Error al subir el material. Intenta nuevamente.' })
    } finally {
      setCargando(false)
    }
  }

  // ---- RENDER ----
  return (
    <div className="card max-w-2xl mx-auto">

      {/* Encabezado del formulario */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-mmt-purple to-mmt-celeste
                        flex items-center justify-center text-white text-lg font-bold shadow-sm">
          +
        </div>
        <div>
          <h2 className="font-bold text-gray-800 text-lg">Subir Material</h2>
          <p className="text-xs text-gray-400">Comparte tu trabajo con la comunidad MMT Valparaíso</p>
        </div>
      </div>

      {/* Mensaje de éxito */}
      {exito && (
        <div className="mb-4 flex items-center gap-2 text-sm text-green-700
                        bg-green-50 border border-green-200 rounded-xl px-4 py-3">
          <span>✓</span>
          <span>¡Material subido exitosamente! Ya está disponible para todas las alumnas.</span>
        </div>
      )}

      {/* Error general del servidor */}
      {errores.general && (
        <p className="mb-4 text-sm text-red-500 bg-red-50 border border-red-100 rounded-xl px-4 py-3">
          {errores.general}
        </p>
      )}

      <form onSubmit={alEnviar} className="space-y-5">

        {/* Campo: Título */}
        <Campo label="Título del material" error={errores.titulo} requerido>
          <input
            type="text"
            value={form.titulo}
            onChange={e => actualizarCampo('titulo', e.target.value)}
            placeholder="Ej: Proyecto final — Sistema de inventario en Python"
            className={`input-field ${errores.titulo ? 'border-red-300 focus:ring-red-200' : ''}`}
          />
        </Campo>

        {/* Campo: Asignatura */}
        <Campo label="Asignatura" error={errores.id_asignatura} requerido>
          <select
            value={form.id_asignatura}
            onChange={e => actualizarCampo('id_asignatura', e.target.value)}
            className={`input-field bg-white cursor-pointer
              ${errores.id_asignatura ? 'border-red-300 focus:ring-red-200' : ''}
              ${!form.id_asignatura ? 'text-gray-400' : 'text-gray-800'}`}
          >
            <option value="" disabled>Selecciona una asignatura...</option>
            {asignaturas.map(a => (
              <option key={a.id} value={a.id}>
                {a.codigo ? `[${a.codigo}] ` : ''}{a.nombre}
              </option>
            ))}
          </select>
        </Campo>

        {/* Campo: Descripción */}
        <Campo label="Descripción" pista="(opcional)">
          <textarea
            value={form.descripcion}
            onChange={e => actualizarCampo('descripcion', e.target.value)}
            rows={3}
            placeholder="Breve descripción del contenido, contexto o tecnologías usadas..."
            className="input-field resize-none"
          />
        </Campo>

        {/* Campo: Archivo con Drag & Drop */}
        <Campo label="Archivo" error={errores.archivo} requerido>
          <div
            onDragOver={e => { e.preventDefault(); setArrastrando(true) }}
            onDragLeave={() => setArrastrando(false)}
            onDrop={alSoltar}
            onClick={() => refInput.current?.click()}
            className={`flex flex-col items-center justify-center gap-3 rounded-2xl
                        border-2 border-dashed cursor-pointer transition-all duration-200 p-8
                        ${arrastrando         ? 'border-mmt-celeste bg-mmt-celeste-50 scale-[1.01]' :
                          archivo             ? 'border-mmt-purple bg-mmt-purple-50' :
                          errores.archivo     ? 'border-red-300 bg-red-50' :
                          'border-gray-200 hover:border-mmt-purple hover:bg-mmt-purple-50'}`}
          >
            <input
              ref={refInput}
              type="file"
              accept={EXTENSIONES_ACEPTADAS}
              className="hidden"
              onChange={e => recibirArchivo(e.target.files[0])}
            />

            {archivo ? (
              /* Archivo seleccionado */
              <>
                <div className="w-12 h-12 rounded-2xl bg-mmt-purple flex items-center justify-center text-white text-sm font-bold shadow">
                  OK
                </div>
                <div className="text-center">
                  <p className="font-semibold text-mmt-purple text-sm">{archivo.name}</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {(archivo.size / 1024).toFixed(1)} KB · Haz clic para cambiar
                  </p>
                </div>
              </>
            ) : (
              /* Zona vacía */
              <>
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl transition-colors
                  ${arrastrando ? 'bg-mmt-celeste text-white' : 'bg-gray-100 text-gray-400'}`}>
                  ↑
                </div>
                <div className="text-center">
                  <p className="font-medium text-gray-600 text-sm">Arrastra tu archivo aquí <span className="text-gray-400 font-normal">(opcional)</span></p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    o <span className="text-mmt-purple font-semibold">haz clic para seleccionar</span>
                  </p>
                  <p className="text-[10px] text-gray-300 mt-2">
                    PDF, Imágenes, Código (JS, Python, etc.) — máximo 10 MB
                  </p>
                </div>
              </>
            )}
          </div>
        </Campo>

        {/* Seccion de codigo HTML/JS interactivo (opcional) */}
        <div className="border border-dashed border-gray-200 rounded-2xl overflow-hidden">
          <button
            type="button"
            onClick={() => setMostrarEditor(v => !v)}
            className="w-full flex items-center justify-between px-5 py-3 text-sm font-semibold text-gray-500 hover:text-mmt-purple hover:bg-mmt-purple-50 transition-colors"
          >
            <span className="flex items-center gap-2">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="16 18 22 12 16 6" /><polyline points="8 6 2 12 8 18" />
              </svg>
              {mostrarEditor ? 'Ocultar editor de codigo' : '+ Agregar demo interactivo HTML/JS (opcional)'}
            </span>
            <span className="text-[10px] font-normal text-gray-400">Se mostrara como demo ejecutable en el detalle</span>
          </button>

          {mostrarEditor && (
            <div className="border-t border-gray-100 p-5 space-y-3 bg-gray-50">
              <p className="text-xs text-gray-500">
                Escribe HTML, CSS y JS. Se renderizara en un iframe aislado (sandbox) para las alumnas que abran este material.
              </p>
              <textarea
                value={codigoHtml}
                onChange={e => { setCodigoHtml(e.target.value); setIframeKey(k => k + 1) }}
                placeholder={'<!DOCTYPE html>\n<html>\n<body>\n  <h1>Hola MMT</h1>\n  <script>\n    document.write("Codigo interactivo")\n  <\/script>\n</body>\n</html>'}
                rows={10}
                className="w-full font-mono text-xs bg-gray-900 text-green-300 rounded-xl p-4 resize-y focus:outline-none focus:ring-2 focus:ring-mmt-purple border-0"
                spellCheck={false}
              />
              {codigoHtml.trim() && (
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Vista previa</p>
                    <button type="button" onClick={() => setIframeKey(k => k + 1)}
                      className="text-[10px] text-mmt-purple font-semibold hover:underline">
                      Reiniciar
                    </button>
                  </div>
                  <iframe
                    key={iframeKey}
                    srcDoc={codigoHtml}
                    sandbox="allow-scripts"
                    className="w-full rounded-xl border border-gray-200 bg-white"
                    style={{ height: '200px' }}
                    title="Vista previa del codigo"
                  />
                </div>
              )}
            </div>
          )}
        </div>

        {/* Botón de envío */}
        <button
          type="submit"
          disabled={cargando}
          className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {cargando ? (
            <>
              <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              Subiendo tu material...
            </>
          ) : (
            <>Publicar en el repositorio</>

          )}
        </button>
      </form>
    </div>
  )
}

/*
 * Componente auxiliar para envolver cada campo con su label y mensaje de error.
 * Evita repetir el mismo bloque de código para cada campo.
 */
function Campo({ label, children, error, pista, requerido }) {
  return (
    <div className="space-y-1.5">
      <label className="block text-sm font-semibold text-gray-700">
        {label}
        {requerido && <span className="text-mmt-purple ml-0.5">*</span>}
        {pista && <span className="text-gray-400 font-normal ml-1 text-xs">{pista}</span>}
      </label>
      {children}
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  )
}

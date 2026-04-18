/*
 * ============================================================
 * pages/Materials.jsx  —  Repositorio de Materiales MMT
 * ============================================================
 *
 * Esta página muestra el repositorio completo de materiales
 * subidos por las alumnas del programa.
 *
 * FUNCIONALIDADES:
 *   - Galería de materiales con filtro por asignatura
 *   - Búsqueda por título
 *   - Formulario de subida (solo si hay sesión activa)
 *
 * DATOS: vienen de la API real (/api/materiales y /api/asignaturas)
 */

import { useState }         from 'react'
import MaterialCard         from '../components/materials/MaterialCard'
import MaterialModal        from '../components/materials/MaterialModal'
import UploadForm           from '../components/materials/UploadForm'
import { useApi, apiFetch } from '../hooks/useApi'
import { useSesion }        from '../context/SesionContext'

export default function Materiales() {
  // Estado del filtro de asignatura seleccionada (null = todas)
  const [idAsignatura,  setIdAsignatura]  = useState(null)
  const [busqueda,          setBusqueda]          = useState('')
  const [vista,             setVista]             = useState('galeria')
  const [materialSeleccionado, setMaterialSeleccionado] = useState(null)

  // Datos de la alumna autenticada (puede ser null si no hay sesión)
  const { alumna } = useSesion()

  // Cargamos las asignaturas para los botones de filtro
  const { datos: asignaturas = [] } = useApi('/api/asignaturas')

  // Cargamos los materiales. Se recargan cuando cambia el filtro o la búsqueda.
  const {
    datos:    materiales = [],
    cargando: cargandoMateriales,
    error:    errorMateriales,
    recargar,
  } = useApi('/api/materiales', {
    deps:   [idAsignatura, busqueda],
    params: {
      asignatura: idAsignatura,
      busqueda:   busqueda || undefined,
    },
  })

  function alSubirExitoso() {
    setVista('galeria')
    recargar()
  }

  async function eliminarMaterial(id) {
    if (!window.confirm('¿Eliminar este material? Esta acción no se puede deshacer.')) return
    try {
      await apiFetch(`/api/materiales/${id}`, { method: 'DELETE' })
      recargar()
    } catch (err) {
      alert(err.message)
    }
  }

  return (
    <div className="space-y-6">

      {/* Encabezado de la página */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Repositorio de Materiales</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Recursos creados y compartidos por alumnas MMT Valparaíso
          </p>
        </div>

        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setVista('galeria')}
            className={vista === 'galeria' ? 'btn-primary py-2 px-4 text-sm' : 'btn-outline py-2 px-4 text-sm'}
          >
            Galería
          </button>

          {/* El botón "Subir" solo aparece si la alumna inició sesión */}
          {alumna ? (
            <button
              onClick={() => setVista('subir')}
              className={vista === 'subir' ? 'btn-primary py-2 px-4 text-sm' : 'btn-outline py-2 px-4 text-sm'}
            >
              Subir material
            </button>
          ) : (
            <p className="text-xs text-gray-400 self-center italic">
              Inicia sesión para subir materiales
            </p>
          )}
        </div>
      </div>

      {/* Formulario de subida */}
      {vista === 'subir' && (
        <UploadForm onExito={alSubirExitoso} />
      )}

      {/* Galería */}
      {vista === 'galeria' && (
        <>
          {/* Barra de filtros */}
          <div className="card p-4 flex flex-col sm:flex-row gap-3 flex-wrap">
            {/* Campo de búsqueda */}
            <input
              type="search"
              value={busqueda}
              onChange={e => setBusqueda(e.target.value)}
              placeholder="Buscar por título..."
              className="input-field sm:max-w-xs py-2"
            />

            {/* Botones de filtro por asignatura */}
            <div className="flex flex-wrap gap-2">
              {/* Botón "Todas" */}
              <FiltroBtn
                activo={idAsignatura === null}
                onClick={() => setIdAsignatura(null)}
              >
                Todas
              </FiltroBtn>

              {asignaturas.map(a => (
                <FiltroBtn
                  key={a.id}
                  activo={idAsignatura === a.id}
                  onClick={() => setIdAsignatura(a.id)}
                >
                  {a.nombre}
                </FiltroBtn>
              ))}
            </div>
          </div>

          {/* Estado de carga */}
          {cargandoMateriales && (
            <div className="flex justify-center py-16">
              <div className="flex flex-col items-center gap-3 text-mmt-purple">
                <div className="w-8 h-8 border-2 border-mmt-purple/30 border-t-mmt-purple rounded-full animate-spin" />
                <p className="text-sm font-medium">Cargando materiales...</p>
              </div>
            </div>
          )}

          {/* Estado de error */}
          {errorMateriales && !cargandoMateriales && (
            <div className="card text-center py-12 border-red-100">
              <p className="text-3xl mb-3">⚠</p>
              <p className="font-semibold text-red-500">No se pudo cargar el repositorio</p>
              <p className="text-sm text-gray-400 mt-1">{errorMateriales}</p>
              <button onClick={recargar} className="btn-outline mt-4 text-sm">
                Intentar de nuevo
              </button>
            </div>
          )}

          {/* Grilla de materiales */}
          {!cargandoMateriales && !errorMateriales && (
            materiales.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                {materiales.map(m => (
                  <MaterialCard
                    key={m.id}
                    material={m}
                    alAbrir={setMaterialSeleccionado}
                    onEliminar={(alumna?.rol === 'ADMIN' || alumna?.id === m.id_alumna) ? eliminarMaterial : undefined}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-16 text-gray-400">

                <p className="font-semibold text-gray-600">No se encontraron materiales</p>
                <p className="text-sm mt-1">
                  {busqueda || idAsignatura
                    ? 'Prueba con otro filtro o término de búsqueda.'
                    : 'Sé la primera en subir un material.'}
                </p>
                {alumna && (
                  <button onClick={() => setVista('subir')} className="btn-primary mt-4 text-sm">
                    Subir el primero
                  </button>
                )}
              </div>
            )
          )}
        </>
      )}
      {materialSeleccionado && (
        <MaterialModal
          material={materialSeleccionado}
          onCerrar={() => setMaterialSeleccionado(null)}
        />
      )}
    </div>
  )
}

/* Botón reutilizable para los filtros de asignatura */
function FiltroBtn({ activo, onClick, children }) {
  return (
    <button
      onClick={onClick}
      className={`text-xs font-semibold px-3 py-1.5 rounded-full transition-all
        ${activo
          ? 'bg-mmt-purple text-white shadow-sm'
          : 'bg-gray-100 text-gray-500 hover:bg-mmt-purple-100 hover:text-mmt-purple'
        }`}
    >
      {children}
    </button>
  )
}

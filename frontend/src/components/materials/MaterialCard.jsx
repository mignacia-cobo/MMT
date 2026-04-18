/*
 * ============================================================
 * components/materials/MaterialCard.jsx  —  Tarjeta de material
 * ============================================================
 *
 * Muestra la información de un material del repositorio:
 *   - Tipo de archivo (PDF, imagen, código, otro)
 *   - Asignatura a la que pertenece
 *   - Título y descripción
 *   - Autora con avatar generativo (iniciales + degradado)
 *   - Fecha de publicación
 *   - Botón de descarga
 *   - Botón de guardar/favorito (estado local por ahora)
 *
 * PROPS:
 *   material → objeto devuelto por GET /api/materiales
 *              Los nombres de campo están en español
 *              porque así los devuelve la API.
 */

import { useState }  from 'react'
import { useSesion } from '../../context/SesionContext'

// Mapeo de tipo de archivo → icono + colores para la etiqueta
const TIPOS = {
  pdf:    { icono: '⬡', fondo: 'bg-red-50',     texto: 'text-red-500',     etiqueta: 'PDF'    },
  imagen: { icono: '◫', fondo: 'bg-green-50',   texto: 'text-green-600',   etiqueta: 'Imagen' },
  codigo: { icono: '⟨⟩', fondo: 'bg-indigo-50', texto: 'text-indigo-600',  etiqueta: 'Código' },
  otro:   { icono: 'A',  fondo: 'bg-gray-50',    texto: 'text-gray-500',    etiqueta: 'Archivo'},
}

export default function MaterialCard({ material, alAbrir, onEliminar }) {
  const { alumna }  = useSesion()
  const [guardado, setGuardado] = useState(false)

  const esAdmin  = alumna?.rol === 'ADMIN'
  const esAutora = alumna?.id === material.id_alumna

  // Usamos el tipo del campo de la BD, con fallback a 'otro'
  const tipo = TIPOS[material.tipo_archivo] ?? TIPOS.otro

  // Generamos las iniciales de la autora para el avatar
  const iniciales = (material.nombre_alumna ?? 'Alumna MMT')
    .split(' ')
    .slice(0, 2)
    .map(n => n[0])
    .join('')
    .toUpperCase()

  // URL base del backend para construir la URL del archivo
  const urlBase = import.meta.env.VITE_API_URL || 'http://localhost:3001'

  return (
    <article
      className="card group hover:-translate-y-1 transition-transform duration-300 flex flex-col gap-4 cursor-pointer"
      onClick={() => alAbrir?.(material)}
    >

      {/* Fila superior: etiqueta de tipo + acciones */}
      <div className="flex items-start justify-between">
        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl ${tipo.fondo}`}>
          <span className={`text-base ${tipo.texto}`}>{tipo.icono}</span>
          <span className={`text-xs font-bold ${tipo.texto} uppercase tracking-wide`}>
            {tipo.etiqueta}
          </span>
        </div>

        <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
          {(esAdmin || esAutora) && onEliminar && (
            <button
              onClick={() => onEliminar(material.id)}
              title="Eliminar material"
              className="p-2 rounded-xl text-gray-300 hover:text-red-500 hover:bg-red-50 transition-colors"
            >
              ✕
            </button>
          )}
          <button
            onClick={() => setGuardado(v => !v)}
            title={guardado ? 'Guardado' : 'Guardar para luego'}
            className={`p-2 rounded-xl transition-colors ${
              guardado
                ? 'text-mmt-purple bg-mmt-purple-50'
                : 'text-gray-300 hover:text-mmt-purple hover:bg-mmt-purple-50'
            }`}
          >
            ★
          </button>
        </div>
      </div>

      {/* Asignatura */}
      <span className="badge-celeste self-start">{material.nombre_asignatura}</span>

      {/* Título y descripción */}
      <div>
        <h3 className="font-bold text-gray-800 text-base leading-snug mb-1
                       group-hover:text-mmt-purple transition-colors line-clamp-2">
          {material.titulo}
        </h3>
        {material.descripcion && (
          <p className="text-xs text-gray-500 leading-relaxed line-clamp-2">
            {material.descripcion}
          </p>
        )}
      </div>

      {/* Separador degradado */}
      <div className="h-px bg-gradient-to-r from-mmt-purple/20 via-mmt-celeste/20 to-transparent" />

      {/* Pie: autora + fecha */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          {/* Avatar con iniciales de la autora */}
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-mmt-purple to-mmt-celeste
                          flex items-center justify-center text-white text-xs font-bold flex-shrink-0 shadow-sm">
            {iniciales}
          </div>
          <div className="leading-tight">
            <p className="text-xs font-semibold text-gray-700">{material.nombre_alumna}</p>
            <p className="text-[10px] text-gray-400">{material.carrera_alumna}</p>
          </div>
        </div>

        {/* Fecha de publicación formateada */}
        <time className="text-[10px] text-gray-400 font-medium" dateTime={material.creado_en}>
          {new Date(material.creado_en).toLocaleDateString('es-CL', {
            day: '2-digit', month: 'short', year: '2-digit',
          })}
        </time>
      </div>

      {/* Botón de descarga */}
      <div className="flex gap-2 mt-auto" onClick={e => e.stopPropagation()}>
        {material.url_archivo && (
          <a
            href={`${urlBase}/api/materiales/${material.id}/descargar`}
            target="_blank"
            rel="noreferrer"
            className="btn-outline text-center text-xs py-2 flex-1 flex items-center justify-center gap-1"
          >
            Descargar
            {material.descargas > 0 && (
              <span className="text-[10px] text-gray-400 ml-1">({material.descargas})</span>
            )}
          </a>
        )}
        {material.codigo_html && (
          <button
            onClick={() => alAbrir?.(material)}
            className="text-xs font-semibold px-3 py-2 rounded-xl bg-indigo-50 text-indigo-600 hover:bg-indigo-100 transition-colors flex items-center gap-1.5 flex-shrink-0"
            title="Ver contenido interactivo"
          >
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="3" width="20" height="14" rx="2" />
              <line x1="8" y1="21" x2="16" y2="21" />
              <line x1="12" y1="17" x2="12" y2="21" />
            </svg>
            Interactivo
          </button>
        )}
      </div>
    </article>
  )
}

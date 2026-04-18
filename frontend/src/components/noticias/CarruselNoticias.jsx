/*
 * components/noticias/CarruselNoticias.jsx
 * Carrusel automático de noticias con barra de progreso, flechas y dots.
 */

import { useState, useEffect, useRef, useCallback } from 'react'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001'
const INTERVALO = 6000 // ms entre slides

function formatearFecha(iso) {
  return new Date(iso).toLocaleDateString('es-CL', {
    day: 'numeric', month: 'long', year: 'numeric',
  })
}

function IconChevronLeft() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="15 18 9 12 15 6" />
    </svg>
  )
}
function IconChevronRight() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="9 18 15 12 9 6" />
    </svg>
  )
}
function IconHeart({ filled }) {
  return (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
  )
}

export default function CarruselNoticias({ noticias, alAbrir }) {
  const [actual,     setActual]     = useState(0)
  const [pausado,    setPausado]    = useState(false)
  const [progreso,   setProgreso]   = useState(0)
  const timerRef    = useRef(null)
  const progRef     = useRef(null)
  const total       = noticias.length

  const siguiente = useCallback(() => {
    setActual(i => (i + 1) % total)
    setProgreso(0)
  }, [total])

  const anterior = useCallback(() => {
    setActual(i => (i - 1 + total) % total)
    setProgreso(0)
  }, [total])

  const irA = (i) => { setActual(i); setProgreso(0) }

  // Auto-avance + barra de progreso
  useEffect(() => {
    if (total <= 1 || pausado) return
    progRef.current = 0
    const paso = 100 / (INTERVALO / 100)

    timerRef.current = setInterval(() => {
      progRef.current += paso
      setProgreso(Math.min(progRef.current, 100))
      if (progRef.current >= 100) {
        siguiente()
      }
    }, 100)

    return () => clearInterval(timerRef.current)
  }, [actual, pausado, siguiente, total])

  if (!total) return null

  const n = noticias[actual]

  return (
    <div
      className="relative rounded-3xl overflow-hidden shadow-lg group select-none"
      onMouseEnter={() => setPausado(true)}
      onMouseLeave={() => setPausado(false)}
    >
      {/* Barra de progreso */}
      {total > 1 && (
        <div className="absolute top-0 left-0 right-0 h-1 bg-white/20 z-20">
          <div
            className="h-full bg-white/70 transition-none"
            style={{ width: `${progreso}%` }}
          />
        </div>
      )}

      {/* Slides contenedor */}
      <div
        className="flex transition-transform duration-500 ease-in-out"
        style={{ transform: `translateX(-${actual * (100 / total)}%)`, width: `${total * 100}%` }}
      >
        {noticias.map(item => (
          <div
            key={item.id}
            className="relative cursor-pointer"
            style={{ width: `${100 / total}%` }}
            onClick={() => alAbrir(item)}
          >
            {/* Imagen o gradiente */}
            <div className="relative h-72 sm:h-96 overflow-hidden">
              {item.imagen_url ? (
                <img
                  src={item.imagen_url.startsWith('http') ? item.imagen_url : `${API_BASE}${item.imagen_url}`}
                  alt={item.titulo}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-mmt-purple via-[#7c3aed] to-mmt-celeste-dark animate-gradient" />
              )}
              {/* Overlay degradado inferior */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
            </div>

            {/* Contenido superpuesto */}
            <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
              <p className="text-[10px] font-semibold text-white/70 mb-1 uppercase tracking-widest">
                {item.nombre_autora} · {formatearFecha(item.creado_en)}
              </p>
              <h3 className="text-xl sm:text-2xl font-bold leading-snug mb-2 line-clamp-2">
                {item.titulo}
              </h3>
              <p className="text-sm text-white/80 leading-relaxed line-clamp-2 mb-3">
                {item.contenido}
              </p>
              <div className="flex items-center gap-4 text-xs text-white/60">
                <span className="flex items-center gap-1">
                  <IconHeart filled={item.me_gusta} />
                  {item.likes}
                </span>
                <span>{item.comentarios} comentarios</span>
                <span className="ml-auto text-white/50 text-[10px]">Click para leer más →</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Flechas de navegación */}
      {total > 1 && (
        <>
          <button
            onClick={e => { e.stopPropagation(); anterior() }}
            className="absolute left-3 top-1/2 -translate-y-1/2 z-10
                       w-9 h-9 rounded-full bg-black/30 hover:bg-black/50
                       text-white flex items-center justify-center
                       opacity-0 group-hover:opacity-100 transition-opacity duration-200"
            aria-label="Anterior"
          >
            <IconChevronLeft />
          </button>
          <button
            onClick={e => { e.stopPropagation(); siguiente() }}
            className="absolute right-3 top-1/2 -translate-y-1/2 z-10
                       w-9 h-9 rounded-full bg-black/30 hover:bg-black/50
                       text-white flex items-center justify-center
                       opacity-0 group-hover:opacity-100 transition-opacity duration-200"
            aria-label="Siguiente"
          >
            <IconChevronRight />
          </button>
        </>
      )}

      {/* Dots indicadores */}
      {total > 1 && (
        <div className="absolute bottom-3 right-6 z-10 flex gap-1.5">
          {noticias.map((_, i) => (
            <button
              key={i}
              onClick={e => { e.stopPropagation(); irA(i) }}
              aria-label={`Ir a noticia ${i + 1}`}
              className={`rounded-full transition-all duration-300 ${
                i === actual
                  ? 'bg-white w-5 h-2'
                  : 'bg-white/40 hover:bg-white/70 w-2 h-2'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  )
}

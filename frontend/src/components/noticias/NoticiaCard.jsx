/*
 * components/noticias/NoticiaCard.jsx
 * Tarjeta de noticia para el feed de la landing page.
 */

function formatearFecha(iso) {
  return new Date(iso).toLocaleDateString('es-CL', {
    day: 'numeric', month: 'long', year: 'numeric',
  })
}

export default function NoticiaCard({ noticia, alAbrir }) {
  const extracto = noticia.contenido.length > 130
    ? noticia.contenido.slice(0, 130) + '…'
    : noticia.contenido

  return (
    <div
      onClick={() => alAbrir(noticia)}
      className="bg-white rounded-2xl shadow-sm hover:shadow-md transition-all cursor-pointer overflow-hidden flex flex-col group"
    >
      {/* Imagen o placeholder con gradiente */}
      {noticia.imagen_url ? (
        <img
          src={noticia.imagen_url}
          alt={noticia.titulo}
          className="h-40 w-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
      ) : (
        <div className="h-40 bg-gradient-to-br from-mmt-purple-50 via-white to-mmt-celeste-50 flex items-center justify-center flex-shrink-0">
          <span className="text-5xl font-extrabold text-mmt-purple/10 select-none">MMT</span>
        </div>
      )}

      <div className="p-5 flex flex-col gap-2 flex-1">
        <h3 className="font-bold text-gray-800 text-sm leading-snug group-hover:text-mmt-purple transition-colors">
          {noticia.titulo}
        </h3>
        <p className="text-xs text-gray-500 leading-relaxed flex-1">{extracto}</p>

        <div className="flex items-center justify-between pt-3 border-t border-gray-50 mt-1">
          <div>
            <p className="text-[10px] font-semibold text-mmt-purple">{noticia.nombre_autora}</p>
            <p className="text-[10px] text-gray-400">{formatearFecha(noticia.creado_en)}</p>
          </div>
          <div className="flex items-center gap-3 text-[10px] text-gray-400 font-medium">
            <span>{noticia.likes} me gusta</span>
            <span>{noticia.comentarios} comentarios</span>
          </div>
        </div>
      </div>
    </div>
  )
}

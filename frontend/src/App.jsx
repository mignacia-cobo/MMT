/*
 * ============================================================
 * App.jsx  —  Componente raíz de MMT Valpo Hub
 * ============================================================
 *
 * Aquí se configura:
 *   1. El Router de React → maneja las URLs de la SPA
 *   2. El SesionProvider → comparte los datos de la alumna
 *      autenticada con todos los componentes
 *   3. Las rutas de la aplicación → cada URL lleva a un componente
 *
 * CONCEPTO: SPA (Single Page Application)
 *   El navegador carga UN solo HTML. React Router simula la
 *   navegación entre "páginas" cambiando los componentes
 *   renderizados sin recargar el servidor.
 */

import { BrowserRouter, Routes, Route }  from 'react-router-dom'
import { SesionProvider }                from './context/SesionContext'
import Navbar                            from './components/layout/Navbar'
import Dashboard                         from './components/dashboard/Dashboard'
import Materiales                        from './pages/Materials'
import Tareas                            from './pages/Tareas'
import Perfil                            from './pages/Perfil'
import Proyectos                         from './pages/Proyectos'
import Home                              from './pages/Home'
import Noticias                          from './pages/Noticias'
import AdminCronograma                   from './pages/AdminCronograma'
import AdminPanel                        from './pages/AdminPanel'
import Login                             from './pages/Login'

export default function App() {
  return (
    /*
     * SesionProvider envuelve todo para que CUALQUIER componente
     * pueda acceder a los datos de la alumna con useSesion().
     *
     * BrowserRouter habilita el enrutamiento basado en URLs.
     */
    <SesionProvider>
      <BrowserRouter>
        <Routes>
          {/* Ruta de login — sin Navbar ni layout principal */}
          <Route path="/login" element={<Login />} />

          {/* Todas las demás rutas — con Navbar */}
          <Route
            path="/*"
            element={
              <div className="min-h-screen bg-gray-50">
                <Navbar />
                <main className="pt-20 pb-12 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                  <Routes>
                    <Route path="/"           element={<Home />} />
                    <Route path="/noticias"   element={<Noticias />} />
                    <Route path="/materiales" element={<Materiales />} />
                    <Route path="/tareas"     element={<Tareas />} />
                    <Route path="/proyectos"          element={<Proyectos />} />
                    <Route path="/admin"              element={<AdminPanel />} />
                    <Route path="/admin/cronograma"  element={<AdminCronograma />} />
                    <Route path="/perfil"             element={<Perfil />} />
                  </Routes>
                </main>
              </div>
            }
          />
        </Routes>
      </BrowserRouter>
    </SesionProvider>
  )
}

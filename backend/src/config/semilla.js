/*
 * ============================================================
 * config/semilla.js  —  Datos iniciales de la base de datos
 * ============================================================
 *
 * Este script puebla la BD con datos de prueba para que el
 * equipo de desarrollo pueda trabajar sin datos reales.
 *
 * CÓMO EJECUTAR:
 *   npm run semilla
 *
 * ⚠️  ADVERTENCIA: Solo usar en desarrollo. Nunca en producción.
 *     Este script elimina y recrea los datos existentes.
 */

require('dotenv').config({ path: require('path').join(__dirname, '../../.env') })

const { pool } = require('./db')
const bcrypt   = require('bcrypt')

async function poblarBaseDeDatos() {
  console.log('\n🌱 Iniciando semilla de datos MMT Valpo Hub...\n')

  try {
    // -------------------------------------------------------
    // SEDE INICIAL
    // -------------------------------------------------------
    console.log('🏫 Insertando sede inicial...')

    const { rows: [sedeValpo] } = await pool.query(`
      INSERT INTO sedes (nombre, ciudad)
      VALUES ('Sede Valparaíso', 'Valparaíso')
      ON CONFLICT DO NOTHING
      RETURNING id
    `)
    const idSede = sedeValpo?.id
      ?? (await pool.query(`SELECT id FROM sedes WHERE ciudad = 'Valparaíso' LIMIT 1`)).rows[0]?.id
      ?? null

    console.log(`   ✓ Sede Valparaíso (id=${idSede})`)

    // -------------------------------------------------------
    // ASIGNATURAS (las categorías del repositorio)
    // -------------------------------------------------------
    console.log('📚 Insertando asignaturas...')

    const ASIGNATURAS = [
      { nombre: 'Fundamentos de Programación',  codigo: 'FP101',  descripcion: 'Bases de la lógica de programación y algoritmia.' },
      { nombre: 'Estructuras de Datos',          codigo: 'ED201',  descripcion: 'Listas, árboles, grafos y su implementación.' },
      { nombre: 'Desarrollo Web',                codigo: 'DW301',  descripcion: 'Frontend y backend para aplicaciones web modernas.' },
      { nombre: 'Base de Datos',                 codigo: 'BD201',  descripcion: 'Diseño relacional, SQL y modelamiento ER.' },
      { nombre: 'Redes y Comunicaciones',         codigo: 'RC301',  descripcion: 'Protocolos de red, TCP/IP y seguridad.' },
      { nombre: 'Inteligencia Artificial',        codigo: 'IA401',  descripcion: 'Machine learning, redes neuronales y procesamiento de datos.' },
      { nombre: 'Ciberseguridad',                 codigo: 'CS401',  descripcion: 'Vulnerabilidades, protección de sistemas y ethical hacking.' },
      { nombre: 'Gestión de Proyectos TI',        codigo: 'GP301',  descripcion: 'Metodologías ágiles, Scrum y gestión de equipos.' },
    ]

    for (const a of ASIGNATURAS) {
      await pool.query(
        `INSERT INTO asignaturas (nombre, codigo, descripcion)
         VALUES ($1, $2, $3)
         ON CONFLICT (nombre) DO NOTHING`,
        [a.nombre, a.codigo, a.descripcion]
      )
    }
    console.log(`   ✓ ${ASIGNATURAS.length} asignaturas insertadas`)

    // -------------------------------------------------------
    // ALUMNAS DE PRUEBA
    // -------------------------------------------------------
    console.log('👩‍💻 Insertando alumnas de prueba...')

    // ---- Cuenta administradora ----
    const ADMIN = { nombre: 'Administradora MMT', email: 'admin@mmt.cl', password: 'Admin2026!', carrera: 'Coordinación MMT' }
    const hashAdmin = await bcrypt.hash(ADMIN.password, 10)
    await pool.query(
      `INSERT INTO alumnas (nombre, email, password_hash, carrera, rol, id_sede)
       VALUES ($1, $2, $3, $4, 'ADMIN', $5)
       ON CONFLICT (email) DO UPDATE SET rol = 'ADMIN', nombre = EXCLUDED.nombre`,
      [ADMIN.nombre, ADMIN.email, hashAdmin, ADMIN.carrera, idSede]
    )
    console.log(`   ✓ Admin: ${ADMIN.email} / ${ADMIN.password}`)

    const ALUMNAS = [
      { nombre: 'Valentina Rojas',  email: 'v.rojas@mmt.cl',   password: 'test1234', carrera: 'Ing. en Computación e Informática' },
      { nombre: 'Camila Fuentes',   email: 'c.fuentes@mmt.cl',  password: 'test1234', carrera: 'Ing. en Computación e Informática' },
      { nombre: 'Isadora Pérez',    email: 'i.perez@mmt.cl',    password: 'test1234', carrera: 'Ing. en Computación e Informática' },
      { nombre: 'Sofía Medina',     email: 's.medina@mmt.cl',   password: 'test1234', carrera: 'Ing. en Computación e Informática' },
      { nombre: 'Renata Silva',     email: 'r.silva@mmt.cl',    password: 'test1234', carrera: 'Ing. en Computación e Informática' },
    ]

    const idsAlumnas = []
    for (const a of ALUMNAS) {
      const hash = await bcrypt.hash(a.password, 10)
      const { rows } = await pool.query(
        `INSERT INTO alumnas (nombre, email, password_hash, carrera, id_sede)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (email) DO UPDATE SET nombre = EXCLUDED.nombre, id_sede = EXCLUDED.id_sede
         RETURNING id`,
        [a.nombre, a.email, hash, a.carrera, idSede]
      )
      idsAlumnas.push(rows[0].id)
    }
    console.log(`   ✓ ${ALUMNAS.length} alumnas insertadas`)
    console.log('   📧 Alumna de prueba: v.rojas@mmt.cl / test1234')

    // -------------------------------------------------------
    // MATERIALES DE PRUEBA
    // -------------------------------------------------------
    console.log('📄 Insertando materiales de prueba...')

    // Buscamos los IDs de las asignaturas recién insertadas
    const { rows: asignaturas } = await pool.query(
      `SELECT id, codigo FROM asignaturas ORDER BY id`
    )
    const idPorCodigo = Object.fromEntries(asignaturas.map(a => [a.codigo, a.id]))

    const MATERIALES = [
      {
        titulo: 'Proyecto Final: Sistema de Inventario con PostgreSQL',
        descripcion: 'Sistema completo con modelo ER, consultas optimizadas y triggers. Incluye diagrama entidad-relación y script de creación.',
        nombre_archivo: 'inventario-bd.pdf',
        url_archivo: '/uploads/demo-inventario.pdf',
        tipo_archivo: 'pdf',
        id_asignatura: idPorCodigo['BD201'],
        id_alumna: idsAlumnas[0],
      },
      {
        titulo: 'Dashboard React + Tailwind con componentes reutilizables',
        descripcion: 'Componentes atómicos para dashboards: gráficos, tarjetas, tablas. Incluye hooks personalizados y diseño responsive.',
        nombre_archivo: 'dashboard-react.jsx',
        url_archivo: '/uploads/demo-dashboard.jsx',
        tipo_archivo: 'codigo',
        id_asignatura: idPorCodigo['DW301'],
        id_alumna: idsAlumnas[1],
      },
      {
        titulo: 'Informe de Amenazas OWASP Top 10',
        descripcion: 'Análisis de vulnerabilidades aplicadas a un sistema de e-commerce. Incluye ejemplos prácticos y recomendaciones de mitigación.',
        nombre_archivo: 'owasp-analisis.pdf',
        url_archivo: '/uploads/demo-owasp.pdf',
        tipo_archivo: 'pdf',
        id_asignatura: idPorCodigo['CS401'],
        id_alumna: idsAlumnas[2],
      },
      {
        titulo: 'Clasificador de Imágenes con CNN en Python',
        descripcion: 'Red neuronal convolucional para clasificar frutas con TensorFlow. Accuracy: 94%. Incluye notebook con explicaciones paso a paso.',
        nombre_archivo: 'clasificador-cnn.py',
        url_archivo: '/uploads/demo-cnn.py',
        tipo_archivo: 'codigo',
        id_asignatura: idPorCodigo['IA401'],
        id_alumna: idsAlumnas[3],
      },
      {
        titulo: 'Guía Scrum para proyectos de software universitarios',
        descripcion: 'Adaptación de Scrum para equipos pequeños en entorno académico. Incluye plantillas de backlog, sprint planning y retrospectiva.',
        nombre_archivo: 'guia-scrum-uni.pdf',
        url_archivo: '/uploads/demo-scrum.pdf',
        tipo_archivo: 'pdf',
        id_asignatura: idPorCodigo['GP301'],
        id_alumna: idsAlumnas[4],
      },
    ]

    for (const m of MATERIALES) {
      await pool.query(`
        INSERT INTO materiales
          (titulo, descripcion, nombre_archivo, url_archivo, tipo_archivo, id_asignatura, id_alumna)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        ON CONFLICT DO NOTHING
      `, [m.titulo, m.descripcion, m.nombre_archivo, m.url_archivo, m.tipo_archivo, m.id_asignatura, m.id_alumna])
    }
    console.log(`   ✓ ${MATERIALES.length} materiales insertados`)

    console.log('\n✅ ¡Semilla completada exitosamente!\n')
  } catch (error) {
    console.error('\n❌ Error al ejecutar la semilla:', error.message)
    console.error(error)
  } finally {
    await pool.end()
  }
}

poblarBaseDeDatos()

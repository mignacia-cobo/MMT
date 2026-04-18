/*
 * ============================================================
 * routes/asignaturas.js  —  Rutas de asignaturas
 * ============================================================
 *
 * BASE URL: /api/asignaturas
 *
 *   GET  /api/asignaturas   → listar todas las activas
 *   POST /api/asignaturas   → crear nueva (solo admin, futura mejora)
 */

const router     = require('express').Router()
const Asignatura = require('../models/Asignatura')

// Listar asignaturas activas — pública, sin autenticación
router.get('/', async (req, res) => {
  try {
    const asignaturas = await Asignatura.listarActivas()
    res.json({ ok: true, datos: asignaturas })
  } catch (error) {
    console.error('Error al listar asignaturas:', error)
    res.status(500).json({ ok: false, mensaje: 'Error al obtener asignaturas.' })
  }
})

module.exports = router

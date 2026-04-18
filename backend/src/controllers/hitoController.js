/*
 * ============================================================
 * controllers/hitoController.js  —  Lógica del cronograma MMT
 * ============================================================
 */

const Hito = require('../models/Hito')

exports.listar = async (req, res) => {
  try {
    // ?conTareas=1 → incluye array de tareas por hito (para AdminCronograma)
    const hitos = req.query.conTareas
      ? await Hito.listarConTareas()
      : await Hito.listar()
    res.json({ ok: true, hitos })
  } catch (error) {
    console.error('Error en hitos.listar:', error)
    res.status(500).json({ ok: false, mensaje: 'Error al obtener los hitos.' })
  }
}

exports.crear = async (req, res) => {
  try {
    const { titulo, descripcion, fecha, tipo, orden } = req.body
    if (!titulo?.trim() || !fecha) {
      return res.status(400).json({ ok: false, mensaje: 'Título y fecha son obligatorios.' })
    }
    const hito = await Hito.crear({ titulo: titulo.trim(), descripcion, fecha, tipo, orden })
    res.status(201).json({ ok: true, hito })
  } catch (error) {
    console.error('Error en hitos.crear:', error)
    res.status(500).json({ ok: false, mensaje: 'Error al crear el hito.' })
  }
}

exports.actualizar = async (req, res) => {
  try {
    const hito = await Hito.actualizar(req.params.id, req.body)
    if (!hito) return res.status(404).json({ ok: false, mensaje: 'Hito no encontrado.' })
    res.json({ ok: true, hito })
  } catch (error) {
    console.error('Error en hitos.actualizar:', error)
    res.status(500).json({ ok: false, mensaje: 'Error al actualizar el hito.' })
  }
}

exports.eliminar = async (req, res) => {
  try {
    const eliminado = await Hito.eliminar(req.params.id)
    if (!eliminado) return res.status(404).json({ ok: false, mensaje: 'Hito no encontrado.' })
    res.json({ ok: true, mensaje: 'Hito eliminado.' })
  } catch (error) {
    console.error('Error en hitos.eliminar:', error)
    res.status(500).json({ ok: false, mensaje: 'Error al eliminar el hito.' })
  }
}

exports.listarTareas = async (req, res) => {
  try {
    const tareas = await Hito.listarTareas(req.params.id)
    res.json({ ok: true, tareas })
  } catch (error) {
    console.error('Error en hitos.listarTareas:', error)
    res.status(500).json({ ok: false, mensaje: 'Error al obtener las tareas del hito.' })
  }
}

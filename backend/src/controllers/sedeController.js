const Sede = require('../models/Sede')

exports.listar = async (req, res) => {
  try {
    const sedes = await Sede.listar()
    res.json({ ok: true, sedes })
  } catch (error) {
    console.error('Error en sedes.listar:', error)
    res.status(500).json({ ok: false, mensaje: 'Error al obtener sedes.' })
  }
}

exports.listarActivas = async (req, res) => {
  try {
    const sedes = await Sede.listarActivas()
    res.json({ ok: true, sedes })
  } catch (error) {
    console.error('Error en sedes.listarActivas:', error)
    res.status(500).json({ ok: false, mensaje: 'Error al obtener sedes.' })
  }
}

exports.crear = async (req, res) => {
  try {
    const { nombre, ciudad } = req.body
    if (!nombre?.trim() || !ciudad?.trim()) {
      return res.status(400).json({ ok: false, mensaje: 'Nombre y ciudad son obligatorios.' })
    }
    const sede = await Sede.crear({ nombre, ciudad })
    res.status(201).json({ ok: true, sede })
  } catch (error) {
    console.error('Error en sedes.crear:', error)
    res.status(500).json({ ok: false, mensaje: 'Error al crear la sede.' })
  }
}

exports.actualizar = async (req, res) => {
  try {
    const sede = await Sede.actualizar(req.params.id, req.body)
    if (!sede) return res.status(404).json({ ok: false, mensaje: 'Sede no encontrada.' })
    res.json({ ok: true, sede })
  } catch (error) {
    console.error('Error en sedes.actualizar:', error)
    res.status(500).json({ ok: false, mensaje: 'Error al actualizar la sede.' })
  }
}

exports.eliminar = async (req, res) => {
  try {
    const eliminada = await Sede.eliminar(req.params.id)
    if (!eliminada) return res.status(404).json({ ok: false, mensaje: 'Sede no encontrada.' })
    res.json({ ok: true, mensaje: 'Sede eliminada.' })
  } catch (error) {
    console.error('Error en sedes.eliminar:', error)
    res.status(500).json({ ok: false, mensaje: 'Error al eliminar la sede.' })
  }
}

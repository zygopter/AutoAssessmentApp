// backend/routes/competencesRoutes.js
const express = require('express');
const { Op }    = require('sequelize');
const router    = express.Router();
const authenticateToken = require('../middleware/auth');
const Competence = require('../models/Competence');
const Category   = require('../models/Category');

// GET /api/competences
router.get('/', authenticateToken, async (req, res) => {
  try {
    const competences = await Competence.findAll({
      include: [{ model: Category, as: 'category' }]
    });
    res.json(competences);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/competences
router.post('/', authenticateToken, async (req, res) => {
  console.log('[competencesRoutes] POST /categories/:categoryId/competences payload:', req.body)
  try {
    const { name, description, categoryId, controlPoints } = req.body;
    console.log('[competencesRoutes] creating with controlPoints:', controlPoints)
    const comp = await Competence.create({
      name,
      description,
      categoryId,
      createdBy: req.user.id,
      controlPoints,
    });
    res.status(201).json(comp);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// GET /api/competences/:id
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const comp = await Competence.findByPk(req.params.id, {
      include: [{ model: Category, as: 'category' }]
    });
    if (!comp) return res.status(404).json({ message: 'Competence not found' });
    res.json(comp);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT /api/competences/:id
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { name, description, categoryId } = req.body;
    const comp = await Competence.findByPk(req.params.id);
    if (!comp) return res.status(404).json({ message: 'Competence not found' });
    await comp.update({ name, description, categoryId, controlPoints });
    res.json(comp);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// DELETE /api/competences/:id
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const comp = await Competence.findByPk(req.params.id);
    if (!comp) return res.status(404).json({ message: 'Competence not found' });
    await comp.destroy();
    res.json({ message: 'Competence deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;

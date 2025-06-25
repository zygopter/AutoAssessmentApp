// backend/routes/formsRoutes.js
const express = require('express');
const router  = express.Router();
const authenticateToken = require('../middleware/auth');
const Formulaire = require('../models/Formulaire');

// GET /api/formulaires
router.get('/', authenticateToken, async (req, res) => {
  try {
    const forms = await Formulaire.findAll({
      where: { createdBy: req.user.id }
    });
    res.json(forms);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/formulaires
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { title, competences } = req.body;
    const form = await Formulaire.create({
      title,
      competences,
      createdBy: req.user.id
    });
    res.status(201).json(form);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// GET /api/formulaires/:id
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const form = await Formulaire.findOne({
      where: { id: req.params.id, createdBy: req.user.id }
    });
    if (!form) return res.status(404).json({ message: 'Formulaire not found' });
    res.json(form);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT /api/formulaires/:id
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { title, competences } = req.body;
    const form = await Formulaire.findOne({
      where: { id: req.params.id, createdBy: req.user.id }
    });
    if (!form) return res.status(404).json({ message: 'Formulaire not found' });
    await form.update({ title, competences });
    res.json(form);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// DELETE /api/formulaires/:id
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const form = await Formulaire.findOne({
      where: { id: req.params.id, createdBy: req.user.id }
    });
    if (!form) return res.status(404).json({ message: 'Formulaire not found' });
    await form.destroy();
    res.json({ message: 'Formulaire deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;

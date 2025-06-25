// backend/routes/categoryRoutes.js
const express = require('express');
const { Op } = require('sequelize');
const router  = express.Router();
const authenticateToken = require('../middleware/auth');
const Category = require('../models/Category');
const Competence = require('../models/Competence');

// GET /api/categories
router.get('/', authenticateToken, async (req, res) => {
  try {
    const categories = await Category.findAll();
    res.json(categories);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/categories
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { name, description } = req.body;
    const category = await Category.create({
      name,
      description,
      createdBy: req.user.id
    });
    res.status(201).json(category);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// PUT /api/categories/:id
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { name, description } = req.body;
    const category = await Category.findByPk(req.params.id);
    if (!category) return res.status(404).json({ message: 'Category not found' });
    await category.update({ name, description });
    res.json(category);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// DELETE /api/categories/:id
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const count = await Competence.count({ where: { categoryId: req.params.id } });
    if (count > 0) {
      return res.status(400).json({ message: 'Cannot delete: category has competences' });
    }
    await Category.destroy({ where: { id: req.params.id } });
    res.json({ message: 'Category deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/categories/:id
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const category = await Category.findByPk(req.params.id);
    if (!category) return res.status(404).json({ message: 'Category not found' });
    res.json(category);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/categories/:id/competences
router.get('/:id/competences', authenticateToken, async (req, res) => {
  try {
    const competences = await Competence.findAll({ where: { categoryId: req.params.id } });
    res.json(competences);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;

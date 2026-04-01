const express = require('express');
const router = express.Router();
const Task = require('../models/task');

// Créer une nouvelle tâche
router.post('/', async (req, res) => {
  try {
    // Créer une nouvelle tâche avec les données du corps de la requête
    const task = new Task({
      titre: req.body.titre,
      description: req.body.description,
      echeance: req.body.echeance,
      statut: req.body.statut,
      priorite: req.body.priorite,
      categorie: req.body.categorie,
      etiquettes: req.body.etiquettes
        ? req.body.etiquettes.split(',').map(e => e.trim())
        : [],
      sousTaches: req.body.sousTaches,
      commentaires: req.body.commentaires
        ? req.body.commentaires.split(',').map(c => c.trim())
        : [],
      Creator: req.body.Creator, // Added Creator field
    });
    await task.save({ validateBeforeSave: true });
    res.redirect(303, '/');
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Récupérer toutes les tâches
router.get('/', async (req, res) => {
  try {
    const filter = {};
    if (req.query.statut) {
      filter.statut = Array.isArray(req.query.statut)
        ? { $in: req.query.statut }
        : req.query.statut;
    }
    if (req.query.priorite) {
      filter.priorite = Array.isArray(req.query.priorite)
        ? { $in: req.query.priorite }
        : req.query.priorite;
    }
    if (req.query.categorie) {
      filter.categorie = Array.isArray(req.query.categorie)
        ? { $in: req.query.categorie }
        : req.query.categorie;
    }
    if (req.query.etiquette) {
      filter.etiquettes = Array.isArray(req.query.etiquette)
        ? { $in: req.query.etiquette }
        : req.query.etiquette;
    }
    if (req.query.avant || req.query.apres) {
      filter.echeance = {};
      if (req.query.avant) filter.echeance.$lte = new Date(req.query.avant);
      if (req.query.apres) filter.echeance.$gte = new Date(req.query.apres);
    }
    if (req.query.q) {
      filter.$or = [
        { titre: { $regex: req.query.q, $options: 'i' } },
        { description: { $regex: req.query.q, $options: 'i' } },
      ];
    }
    const sorter = req.query.tri
      ? { [req.query.tri]: req.query.ordre === 'desc' ? -1 : 1 }
      : {};
    const tasks = await Task.find(filter, null, { sort: sorter }).populate('Creator');
    res.json(tasks);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
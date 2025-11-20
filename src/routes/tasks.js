const express = require('express');
const router = express.Router();
const Task = require('../models/task');

// Créer une nouvelle tâche
router.post('/', async (req, res) => {
  try {
    const task = new Task({
      titre: req.body.titre,
      description: req.body.description,
      echeance: req.body.echeance,
      statut: req.body.statut,
      priotite: req.body.priotite,
      categorie: req.body.categorie,
      etiquettes: req.body.etiquettes,
      sousTaches: req.body.sousTaches,
      commentaires: req.body.commentaires,
    });
    await task.save({ validateBeforeSave: true });

    res.status(201).json(task);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Récupérer toutes les tâches
router.get('/', async (req, res) => {
  try {
    const tasks = await Task.find();
    res.json(tasks);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;

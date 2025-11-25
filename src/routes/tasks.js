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
      priorite: req.body.priorite,
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
    const filter = {};
    if (req.query.statut) {
      if (Array.isArray(req.query.statut)) {
        filter.statut = { $in: req.query.statut };
      } else {
        filter.statut = req.query.statut;
      }
    }

    if (req.query.priorite) {
      if (Array.isArray(req.query.priorite)) {
        filter.priorite = { $in: req.query.priorite };
      } else {
        filter.priorite = req.query.priorite;
      }
    }

    if (req.query.categorie) {
      if (Array.isArray(req.query.categorie)) {
        filter.categorie = { $in: req.query.categorie };
      } else {
        filter.categorie = req.query.categorie;
      }
    }

    if (req.query.avant) {
      filter.echeance = { $lte: new Date(req.query.avant) };
    }

    if (req.query.apres) {
      filter.echeance = { $gte: new Date(req.query.apres) };
    }

    if (req.query.q) {
      filter.$or = [
        { titre: { $regex: req.query.q, $options: 'i' } },
        { description: { $regex: req.query.q, $options: 'i' } },
      ];
    }

    let sorter = {};
    if (req.query.tri) {
      let ordre = req.query.ordre;
      if (ordre === 'desc') ordre = -1;
      else ordre = 1;
      sorter = { [req.query.tri]: ordre };
    }

    const tasks = await Task.find(filter, null, { sort: sorter });
    res.json(tasks);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;

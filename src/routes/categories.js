const express = require('express');
const router = express.Router();
const Task = require('../models/task');

// Route pour récupérer toutes les catégories uniques des tâches
router.get('/', async (req, res) => {
  // Récupérer toutes les tâches et extraire les catégories uniques
  try {
    // Récupérer toutes les tâches
    const tasks = await Task.find();
    // Extraire les catégories uniques
    const categories = [...new Set(tasks.map((task) => task.categorie))];
    // Envoyer les catégories uniques en réponse
    res.json(categories);
  } catch (error) {
    // En cas d'erreur, envoyer une réponse d'erreur
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;

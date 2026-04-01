const express = require('express');
const router = express.Router();
const Task = require('../models/task');

// Route pour récupérer une tâche par ID
router.put('/:id/postComment', async (req, res) => {
  // Ajouter un commentaire à la tâche
  try {
    // Récupérer la tâche par ID
    const task = await Task.findById(req.params.id);
    // Ajouter le commentaire au tableau des commentaires de la tâche
    task.commentaires.push(req.body.commentaire);
    // Enregistrer la tâche mise à jour dans la base de données
    await task.save();
    // Envoyer la tâche mise à jour en réponse
    res.json(task);
  } catch (error) {
    // En cas d'erreur, envoyer une réponse d'erreur
    res.status(500).json({ error: error.message });
  }
});

// Route pour ajouter une sous-tâche à une tâche
router.post('/:id/subtask', async (req, res) => {
  // Ajouter une sous-tâche à la tâche
  const { titre, echeance, statut } = req.body;

  try {
    // Ajouter la sous-tâche au tableau des sous-tâches de la tâche
    await Task.findByIdAndUpdate(req.params.id, {
      $push: { sousTaches: { titre, echeance, statut } }
    });
    // Envoyer la tâche mise à jour en réponse
    res.redirect(303, '/');
  } catch (err) {
    // En cas d'erreur, envoyer une réponse d'erreur
    res.status(500).json({ error: err.message });
  }
});

// Route pour mettre à jour une sous-tâche d'une tâche
router.put('/:taskId/subtask/:subtaskId', async (req, res) => {
  // Mettre à jour une sous-tâche de la tâche
  const { titre, echeance, statut } = req.body;

  try {
    // Mettre à jour la sous-tâche dans le tableau des sous-tâches de la tâche
    await Task.updateOne(
      // Trouver la tâche par ID et la sous-tâche par ID dans le tableau des sous-tâches
      { _id: req.params.taskId, 'sousTaches._id': req.params.subtaskId },
      // Mettre à jour les champs de la sous-tâche
      {
        $set: {
          'sousTaches.$.titre': titre,
          'sousTaches.$.echeance': echeance,
          'sousTaches.$.statut': statut,
        }
      }
    );
    // Envoyer la tâche mise à jour en réponse
    res.redirect(303, '/');
  } catch (err) {
    // En cas d'erreur, envoyer une réponse d'erreur
    res.status(500).json({ error: err.message });
  }
});

// Route pour supprimer une sous-tâche d'une tâche
router.delete('/:taskId/subtask/:subtaskId', async (req, res) => {
  try {
    // Supprimer la sous-tâche du tableau des sous-tâches de la tâche
    await Task.findByIdAndUpdate(req.params.taskId, {
      $pull: { sousTaches: { _id: req.params.subtaskId } }
    });

    // Envoyer la tâche mise à jour en réponse
    res.redirect(303, '/');
  } catch (err) {
    // En cas d'erreur, envoyer une réponse d'erreur
    res.status(500).json({ error: err.message });
  }
});

// Route pour supprimer un commentaire d'une tâche
router.delete('/:id/comment/:index', async (req, res) => {
  try {
    // Récupérer les paramètres de la requête
    const { id, index } = req.params;

    // Supprimer l’élément à l’index donné
    await Task.updateOne(
      { _id: id },
      { $unset: { [`commentaires.${index}`]: 1 } }
    );

    // Nettoyer les "trous" laissés par $unset
    await Task.updateOne(
      { _id: id },
      { $pull: { commentaires: null } }
    );

    // Envoyer une réponse de succès
    res.sendStatus(204);
  } catch (error) {
    // En cas d'erreur, envoyer une réponse d'erreur
    res.status(500).json({ error: error.message });
  }
});

// Route pour afficher l'historique des modifications d'une tâche
router.get('/:id/history', async (req, res) => {
  // Afficher l'historique des modifications d'une tâche
  try {
    // Récupérer la tâche par ID
    const task = await Task.findById(req.params.id);

    // Si la tâche n'existe pas, envoyer une réponse d'erreur
    if (!task) {
      return res.status(404).send('Tâche introuvable');
    }

    // Rendre la vue de l'historique des modifications avec les données de la tâche
    res.render('taskHistory', { task });
  } catch (error) {
    // En cas d'erreur, envoyer une réponse d'erreur
    res.status(500).send('Erreur serveur');
  }
});


// Fonction pour construire l'historique des modifications d'une tâche
function buildHistory(oldTask, newData) {
  // Construire l'historique des modifications d'une tâche
  const history = [];

  // Comparer les champs de l'ancienne tâche avec les nouvelles données
  for (const key of Object.keys(newData)) {
    // Si la valeur du champ a changé, ajouter une entrée à l'historique
    if (
      oldTask[key] !== undefined &&
      newData[key] !== undefined &&
      oldTask[key]?.toString() !== newData[key]?.toString()
    ) {
      history.push({
        champModifie: key,
        ancienneValeur: oldTask[key],
        nouvelleValeur: newData[key],
        date: new Date(),
      });
    }
  }

  return history;
}

// Route pour récupérer une tâche par ID
router.get('/:id', async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    res.json(task);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Route pour mettre à jour une tâche par ID
router.put('/:id', async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ error: 'Task not found' });

    // Construire l’historique
    const history = buildHistory(task, req.body);

    // Appliquer les nouvelles valeurs
    Object.keys(req.body).forEach(key => {
      task[key] = req.body[key];
    });

    // Ajouter à l’historique
    task.histoireModifications.push(...history);

    await task.save();
    res.sendStatus(204);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Route pour supprimer une tâche par ID
router.delete('/:id', async (req, res) => {
  try {
    // Supprimer la tâche de la base de données
    const task = await Task.deleteOne({ _id: req.params.id });
    res.redirect(303, '/');
  } catch (error) {
    // En cas d'erreur, envoyer une réponse d'erreur
    res.status(500).json({ error: error.message });
  }
});


module.exports = router;
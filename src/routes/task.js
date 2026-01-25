const express = require('express');
const router = express.Router();
const Task = require('../models/task');

router.put('/:id/postComment', async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    task.commentaires.push(req.body.commentaire);
    await task.save();
    res.json(task);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/:id/subtask', async (req, res) => {
  const { titre, echeance, statut } = req.body;

  try {
    await Task.findByIdAndUpdate(req.params.id, {
      $push: { sousTaches: { titre, echeance, statut } }
    });
    res.redirect(303, '/');
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:taskId/subtask/:subtaskId', async (req, res) => {
  const { titre, echeance, statut } = req.body;

  try {
    await Task.updateOne(
      { _id: req.params.taskId, 'sousTaches._id': req.params.subtaskId },
      {
        $set: {
          'sousTaches.$.titre': titre,
          'sousTaches.$.echeance': echeance,
          'sousTaches.$.statut': statut,
        }
      }
    );

    res.redirect(303, '/');
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:taskId/subtask/:subtaskId', async (req, res) => {
  try {
    await Task.findByIdAndUpdate(req.params.taskId, {
      $pull: { sousTaches: { _id: req.params.subtaskId } }
    });

    res.redirect(303, '/');
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id/comment/:index', async (req, res) => {
  try {
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

    res.sendStatus(204);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/:id/history', async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).send('Tâche introuvable');
    }

    res.render('taskHistory', { task });
  } catch (error) {
    res.status(500).send('Erreur serveur');
  }
});



function buildHistory(oldTask, newData) {
  const history = [];

  for (const key of Object.keys(newData)) {
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

router.get('/:id', async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    res.json(task);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

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


router.delete('/:id', async (req, res) => {
  try {
    const task = await Task.deleteOne({ _id: req.params.id });
    res.redirect(303, '/');
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;

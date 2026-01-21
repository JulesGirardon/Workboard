const express = require('express');
const router = express.Router();
const Task = require('../models/task');

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
    const task = await Task.findByIdAndUpdate(req.params.id, req.body);

    res.redirect(303, `/`);
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

module.exports = router;

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

    res.json(task);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const task = await Task.deleteOne({ _id: req.params.id });
    res.json(task);
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

router.put('/:id/addSubtask', async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);

    const subTask = await Task.create({
      titre: req.body.titre,
      description: req.body.description,
      echeance: req.body.echeance,
      statut: req.body.statut,
      priorite: req.body.priorite,
      categorie: req.body.categorie,
      etiquettes: req.body.etiquettes,
      commentaires: req.body.commentaires,
    });

    task.sousTaches.push(subTask);
    await task.save();
    res.json(task);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/:id/removeSubtask', async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    task.sousTaches = task.sousTaches.filter(
      (subTaskId) => subTaskId.toString() !== req.body.subTaskId
    );
    await task.save();
    res.json(task);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/:id/updateSubtask', async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    const subTaskIndex = task.sousTaches.findIndex(
      (subTaskId) => subTaskId.toString() === req.body.subTaskId
    );

    if (subTaskIndex === -1) {
      return res.status(404).json({ error: 'Subtask not found' });
    }

    const subTask = await Task.findById(task.sousTaches[subTaskIndex]);

    Object.keys(req.body.updates).forEach((key) => {
      subTask[key] = req.body.updates[key];
    });

    await subTask.save();
    res.json(subTask);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;

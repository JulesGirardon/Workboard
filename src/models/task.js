// models/task.js
const mongoose = require('mongoose');

// Schéma de la sous-tâche
const subTaskSchema = new mongoose.Schema({
  // Titre de la sous-tâche
  titre: {
    type: String,
    required: true,
    default: 'New Task',
  },
  // Description de la sous-tâche
  echeance: {
    type: Date,
  },
  // Statut de la sous-tâche
  statut: {
    type: String,
    enum: ['à faire', 'en cours', 'terminée', 'annulée'],
    default: 'à faire',
  }
});

// Schéma de la tâche principale
const taskSchema = new mongoose.Schema({
  // Titre de la tâche
  titre: {
    type: String,
    required: true,
    default: 'New Task',
  },
  // Description de la tâche
  description: {
    type: String,
    required: true,
    default: 'Task Description',
  },
  // Date de création de la tâche
  dateCreation: {
    type: Date,
    default: Date.now,
  },
  // Date d'échéance de la tâche
  echeance: {
    type: Date,
  },
  // Statut de la tâche
  statut: {
    type: String,
    enum: ['à faire', 'en cours', 'terminée', 'annulée'],
    default: 'à faire',
  },
  // Priorité de la tâche
  priorite: {
    type: Number,
    enum: [1, 2, 3, 4],
  },
  // Catégorie de la tâche
  categorie: {
    type: String,
    enum: ['perso', 'travail', 'projet', 'autre'],
  },
  // Étiquettes de la tâche
  etiquettes: {
    type: [String],
  },
  // Sous-tâches de la tâche
  sousTaches: {
    type: [subTaskSchema],
  },
  // Commentaires sur la tâche
  commentaires: {
    type: [String],
  },
  // Historique des modifications de la tâche
  histoireModifications: [
    {
      // Nom du champ modifié
      champModifie: String,
      ancienneValeur: mongoose.Schema.Types.Mixed,
      nouvelleValeur: mongoose.Schema.Types.Mixed,
      date: {
        type: Date,
        default: Date.now,
      },
    },
  ],
  // Référence à l'utilisateur qui a créé la tâche
  Creator: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  }
});

// Exportation du modèle Task
module.exports = mongoose.model('Task', taskSchema);

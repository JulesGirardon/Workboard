const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
  titre: {
    type: String,
    required: true,
    default: 'New Task',
  },
  description: {
    type: String,
    required: true,
    default: 'Task Description',
  },
  dateCreation: {
    type: Date,
    default: Date.now,
  },
  echeance: {
    type: Date,
  },
  statut: {
    type: String,
    enum: ['à faire', 'en cours', 'terminée', 'annulée'],
    default: 'à faire',
  },
  priotite: {
    type: String,
    enum: ['basse', 'moyenne', 'haute', 'critique'],
  },
  categorie: {
    type: String,
    enum: ['perso', 'travail', 'projet', 'autre'],
  },
  etiquettes: {
    type: [String],
  },
  sousTaches: {
    type: [this],
  },
  commentaires: {
    type: [String],
  },
  histoireModifications: [
    {
      champModifie: String,
      ancienneValeur: mongoose.Schema.Types.Mixed,
      nouvelleValeur: mongoose.Schema.Types.Mixed,
      date: {
        type: Date,
        default: Date.now,
      },
    },
  ],
});

module.exports = mongoose.model('Task', taskSchema);

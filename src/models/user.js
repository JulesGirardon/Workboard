// models/user.js
const mongoose = require('mongoose');

// Schéma de l'utilisateur
const userSchema = new mongoose.Schema({
  // Informations de base
  // Nom d'utilisateur
  username: { type: String, required: true },
  // Adresse e-mail (unique)
  email: { type: String, required: true, unique: true },
  // Mot de passe (hashé)
  password: { type: String, required: true },
  // Rôle de l'utilisateur (ex: admin, user)
  role: { type: String, default: 'default' },
  // Date de création du compte
  createdAt: { type: Date, default: Date.now },
});

// Exportation du modèle User
module.exports = mongoose.model('User', userSchema);

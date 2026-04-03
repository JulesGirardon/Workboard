# Workboard

Gestionnaire de taches base sur Node.js, Express et MongoDB.

## Prerequis

- Docker + Docker Compose
- Node.js 20+ (si vous voulez lancer les tests hors Docker)
- npm

## Comment lancer le projet

### 1) Lancer en developpement

Commande:

    ./start.sh dev

Ce mode lance:

- L'application en hot reload (nodemon)
- MongoDB

Application disponible sur:

    http://localhost:3000

### 2) Lancer en production

Commande:

    ./start.sh prod

Application disponible sur:

    http://localhost:3000

### 3) Arreter les conteneurs

Developpement:

    ./stop.sh dev

Production:

    ./stop.sh prod

## Variables d'environnement

Vous pouvez partir du fichier [.env.example](.env.example).

Attention avec MONGODB_URI:

- En execution Docker, ne mettez pas localhost si MongoDB tourne dans un autre conteneur.
- L'application utilise par defaut les noms de services Docker quand MONGODB_URI n'est pas defini.

## Lancer les tests

### Script de projet

    bin/tests/run.sh

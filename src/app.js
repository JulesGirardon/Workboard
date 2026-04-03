const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const exhbs = require('express-handlebars');
const session = require('express-session');

const app = express();
const port = process.env.PORT ? Number(process.env.PORT) : 3000;

// Configuration de la session
app.use(
  session({
    secret: 'votre_secret_session',
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false }, // mettre true si HTTPS
  }),
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

app.engine(
  'hbs',
  exhbs.engine({
    extname: 'hbs',
    defaultLayout: 'main',
    layoutsDir: path.join(__dirname, 'views/layouts'),
  }),
);
app.set('view engine', 'hbs');
app.set('views', path.join(__dirname, 'views'));

// Middleware to check if the user is authenticated
function isAuthenticated(req, res, next) {
  if (req.session && req.session.user) {
    return next();
  }
  return res.status(401).send('Unauthorized: You need to log in.');
}

// Middleware to check if the user is an admin
function isAdmin(req, res, next) {
  if (req.session && req.session.user && req.session.user.role === 'admin') {
    return next();
  }
  return res.status(403).send('Forbidden: Admin access required.');
}

// Middleware to redirect to login if not authenticated
app.use((req, res, next) => {
  // Let static files and API routes behave normally
  if (req.path.startsWith('/api/')) return next();

  const isLoggedIn = req.session && req.session.user;
  const isAuthPage = req.path === '/login' || req.path === '/register';

  if (!isLoggedIn && !isAuthPage) {
    return res.redirect('/login');
  }

  return next();
});

// ================= ROUTES API =================
const tasksRoutes = require('./routes/tasks');
app.use('/api/tasks', isAuthenticated, tasksRoutes);

const taskRoutes = require('./routes/task');
app.use('/api/task', isAuthenticated, taskRoutes);

const categoriesRoutes = require('./routes/categories');
app.use('/api/categories', isAuthenticated, categoriesRoutes);

const adminRoutes = require('./routes/admin');
app.use('/admin', isAuthenticated, isAdmin, adminRoutes);

const userRoutes = require('./routes/user');
app.use('/', userRoutes);

// ================= ROUTE FRONT =================
const Task = require('./models/task');
const User = require('./models/user');

// Route: Home page (tasks)
// If not logged in, redirect to /login.
app.get('/', async (req, res) => {
  if (!req.session || !req.session.user) {
    return res.redirect('/login');
  }

  try {
    const tasks = await Task.find({ Creator: req.session.user._id }).lean();
    return res.render('tasks', {
      title: 'Mes tâches',
      tasks,
      user: req.session.user,
    });
  } catch (err) {
    return res.status(500).send('Erreur chargement tâches');
  }
});

// Route to display the login form
app.get('/login', (req, res) => {
  const error = req.query.error
    ? 'Invalid credentials. Please try again.'
    : null;
  res.render('login', { title: 'Login', error });
});

// Route to display the register form
app.get('/register', (req, res) => {
  res.render('register', { title: 'Register' });
});

// (Removed duplicate/misleading middleware: session.userId is not used, only session.user)

// ================= MONGODB =================
// Function only for tests
function getMongoUri() {
  // Allow tests/dev to override the URI
  if (process.env.MONGODB_URI) return process.env.MONGODB_URI;

  if (process.env.NODE_ENV === 'production') {
    return 'mongodb://workboard-prod-mongo:27017/Workboard';
  }

  return 'mongodb://workboard-dev-mongo:27017/Workboard';
}

async function start() {
  await mongoose.connect(getMongoUri());

  console.log('MongoDB connected!');

  app.listen(port, () => {
    console.log(`🚀 Server running on http://localhost:${port}`);
  });
}

module.exports = { app, start, getMongoUri };

// Only start the server when running this file directly (not when imported by tests)
if (require.main === module) {
  start().catch(console.error);
}

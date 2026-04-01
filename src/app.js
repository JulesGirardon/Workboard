const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const exhbs = require('express-handlebars');
const session = require('express-session');

const app = express();
const port = 3000;

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
  const isLoggedIn = req.session && req.session.user;
  const isAuthPage = req.path === '/user/login' || req.path === '/user/register';

  console.log('Request path:', req.path);
  console.log('User session:', req.session);

  if (!isLoggedIn && !isAuthPage) {
    console.log('Redirection to /user/login skipped for debugging.');
    // return res.redirect('/user/login'); // Temporarily disabled
  }

  next();
});

// Login route
app.post('/user/login', async (req, res) => {
  const { email, password } = req.body;

  console.log('Login attempt:', { email, password });

  try {
    const user = await User.findOne({ email });

    if (!user || user.password !== password) {
      console.log('Invalid credentials for email:', email);
      // return res.redirect('/user/login?error=1'); // Temporarily disabled
      return res.status(401).send('Invalid credentials.');
    }

    // Set session user
    req.session.user = { id: user._id, role: user.role };
    console.log('User logged in:', req.session.user);

    // Redirect to dashboard or admin page based on role
    if (user.role === 'admin') {
      console.log('Admin user detected. Redirection skipped for debugging.');
      // return res.redirect('/admin'); // Temporarily disabled
      return res.send('Admin access granted.');
    }

    console.log('Standard user detected. Redirection skipped for debugging.');
    // return res.redirect('/dashboard'); // Temporarily disabled
    return res.send('User access granted.');
  } catch (error) {
    console.error('Login error:', error);
    // return res.redirect('/user/login?error=1'); // Temporarily disabled
    return res.status(500).send('Internal server error.');
  }
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
app.use('/user', userRoutes);

// ================= ROUTE FRONT =================
const Task = require('./models/task');
const User = require('./models/user');

// Redirect the root route to the login page
app.get('/', (req, res) => {
  res.redirect('/user/login');
});

// Route to display the login form
app.get('/user/login', (req, res) => {
  console.log(req.query.error);
  const error = req.query.error ? 'Invalid credentials. Please try again.' : null;
  res.render('login', { title: 'Login', error });
});

// Route to display the register form
app.get('/user/register', (req, res) => {
  res.render('register', { title: 'Register' });
});

// Middleware to check if the user is logged in
app.use((req, res, next) => {
  const isLoggedIn = req.session && req.session.userId;
  if (!isLoggedIn && req.path !== '/user/login') {
    return res.redirect('/user/login');
  }
  next();
});

// ================= MONGODB =================
async function main() {
  if (process.env.NODE_ENV === 'production') {
    await mongoose.connect('mongodb://workboard-prod-mongo:27017/Workboard');
  } else {
    await mongoose.connect('mongodb://workboard-dev-mongo:27017/Workboard'); 
  }
  console.log(' MongoDB connected !');

  app.listen(port, () => {
    console.log(`🚀 Server running on http://localhost:${port}`);
  });
}

main().catch(console.error);
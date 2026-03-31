const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const exhbs = require('express-handlebars');

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

// ================= ROUTES API =================
const tasksRoutes = require('./routes/tasks');
app.use('/api/tasks', tasksRoutes);

const taskRoutes = require('./routes/task');
app.use('/api/task', taskRoutes);

const categoriesRoutes = require('./routes/categories');
app.use('/api/categories', categoriesRoutes);

// ================= ROUTE FRONT =================
const Task = require('./models/task');

app.get('/', async (req, res) => {
  try {
    const tasks = await Task.find().lean();
    res.render('tasks', { title: 'Mes tâches', tasks });
  } catch (err) {
    res.status(500).send('Erreur chargement tâches');
  }
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

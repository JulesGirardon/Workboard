const express = require('express');
const mongoose = require('mongoose');

const app = express();
const port = 3000;

app.use(express.json());

const tasksRoutes = require('./routes/tasks');
app.use('/tasks', tasksRoutes);

const taskRoutes = require('./routes/task');
app.use('/task', taskRoutes);

async function main() {
  await mongoose.connect('mongodb://127.0.0.1:27017/Workboard');
  console.log('MongoDB connected !');

  app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
  });
}

main().catch(console.error);

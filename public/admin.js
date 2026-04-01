// Admin page client-side logic
// Loads users in the left column and tasks in the right column.

async function loadUsers() {
  const usersList = document.getElementById('users-list');
  if (!usersList) return;

  try {
    const response = await fetch('/admin/users');
    const users = await response.json();

    if (!Array.isArray(users) || users.length === 0) {
      usersList.innerHTML = '<li class="no-tasks">No users</li>';
      return;
    }

    usersList.innerHTML = users
      .map(
        (user) => `
          <li data-user-id="${user._id}">
            ${user.username} (${user.email})
          </li>
        `,
      )
      .join('');

    // Click handler (event delegation)
    usersList.addEventListener('click', (event) => {
      const li = event.target.closest('li[data-user-id]');
      if (!li) return;
      loadTasks(li.getAttribute('data-user-id'));
    });
  } catch (error) {
    console.error('Failed to load users:', error);
    usersList.innerHTML = '<li class="no-tasks">Error loading users</li>';
  }
}

async function loadTasks(userId) {
  const tasksList = document.getElementById('tasks-list');
  if (!tasksList) return;

  try {
    const response = await fetch(`/admin/users/${userId}/tasks`);
    const tasks = await response.json();

    if (!Array.isArray(tasks) || tasks.length === 0) {
      tasksList.innerHTML = '<li class="no-tasks">Aucune tâche</li>';
      return;
    }

    tasksList.innerHTML = tasks
      .map(
        (task) => `
          <li>
            <strong>${task.titre}</strong>: ${task.description}
          </li>
        `,
      )
      .join('');
  } catch (error) {
    console.error('Failed to load tasks:', error);
    tasksList.innerHTML = '<li class="no-tasks">Error loading tasks</li>';
  }
}

// Auto-run when the page is ready
document.addEventListener('DOMContentLoaded', () => {
  loadUsers();
});

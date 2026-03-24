const express = require("express");
const Database = require("better-sqlite3");
const cors = require("cors");

const app = express();
app.use(express.json());
app.use(cors());

const db = new Database(process.env.DB_PATH || "database.sqlite");

// Init DB
db.exec(`
CREATE TABLE IF NOT EXISTS tasks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT,
  completed BOOLEAN DEFAULT 0
);

CREATE TABLE IF NOT EXISTS task_dependencies (
  task_id INTEGER,
  depends_on_task_id INTEGER
);
`);

// Create task
app.post("/tasks", (req, res) => {
  const { title, dependencies = [] } = req.body;

  try {
    // Create a query with the following steps. If any step fails, the transaction should be rolled back and the error should be returned to the user.
    // 1. Validate if dependencies exist
    // 2. Insert task
    // 3. Validate self-dependency
    // 4. Insert dependencies
    // 5. task ID must be returned in the response
    
    const transaction = db.transaction(() => {
      // 1. Validate if dependencies exist
      if (dependencies.length > 0) {
        const placeholders = dependencies.map(() => "?").join(",");
        const existingDeps = db.prepare(`SELECT id FROM tasks WHERE id IN (${placeholders})`).all(...dependencies);
        if (existingDeps.length !== dependencies.length) {
          throw new Error("One or more dependencies do not exist");
        }
      }

      // 2. Insert task
      const taskInserted = db.prepare("INSERT INTO tasks (title) VALUES (?)").run(title);
      const taskId = taskInserted.lastInsertRowid;

      // 3. Validate self-dependency
      if (dependencies.includes(Number(taskId))) {
        throw new Error("A task cannot depend on itself");
      }

      // 4. Insert dependencies
      if (dependencies.length > 0) {
        const insertDep = db.prepare("INSERT INTO task_dependencies (task_id, depends_on_task_id) VALUES (?, ?)");
        for (const depId of dependencies) {
          insertDep.run(taskId, depId);
        }
      }

      // 5. Return task ID
      return taskId;
    });

    const taskId = transaction();
    res.status(201).json({ id: taskId, title, dependencies, completed: false });
      



  } catch (err) {
    res.status(400).json({
      error: err.message,
    });
  }
});



// List tasks
app.get("/tasks", (req, res) => {


  // List tasks with their dependencies. Dependencies are returned as an array of objects with id and title.
  // Ordered by task id .

  const rows = db.prepare(`
    SELECT
      t.id AS task_id,
      t.title AS task_title,
      t.completed,
      d.depends_on_task_id AS dep_id,
      dt.title AS dep_title
    FROM tasks t
    LEFT JOIN task_dependencies d ON t.id = d.task_id
    LEFT JOIN tasks dt ON d.depends_on_task_id = dt.id
    ORDER BY t.id
  `).all();


  const tasksMap = {};

  for (const row of rows) {
    if (!tasksMap[row.task_id]) {
      tasksMap[row.task_id] = {
        id: row.task_id,
        title: row.task_title,
        completed: !!row.completed,
        dependencies: []
      };
    }

    if (row.dep_id) {
      tasksMap[row.task_id].dependencies.push({
        id: row.dep_id,
        title: row.dep_title
      });
    }
  }

  res.json(Object.values(tasksMap));
});

// Complete task
app.post("/tasks/:id/complete", (req, res) => {
  const id = Number(req.params.id);

  const task = db.prepare("SELECT * FROM tasks WHERE id = ?").get(id);
  if (!task) return res.status(404).json({ error: "Task not found" });

  const dependencies = db
    .prepare(
      "SELECT depends_on_task_id FROM task_dependencies WHERE task_id = ?"
    )
    .all(id)
    .map((d) => d.depends_on_task_id);

  const pending = dependencies.filter((depId) => {
    const dep = db
      .prepare("SELECT completed FROM tasks WHERE id = ?")
      .get(depId);
    return !dep?.completed;
  });

  if (pending.length > 0) {
    return res.status(400).json({
      error: "Cannot complete task. Pending dependencies",
      pending,
    });
  }

  db.prepare("UPDATE tasks SET completed = 1 WHERE id = ?").run(id);

  res.json({ success: true });
});

// Complete Task
app.post("/tasks/:id/complete", (req, res) => {
  const id = Number(req.params.id);

  const task = db.prepare("SELECT * FROM tasks WHERE id = ?").get(id);
  if (!task) {
    return res.status(404).json({ error: "Task not found" });
  }

  const dependencies = db.prepare(`
		SELECT t.id, t.title, t.completed
		FROM task_dependencies td
		JOIN tasks t ON td.depends_on_task_id = t.id
		WHERE td.task_id = ?
  `).all(id);

  const pending = dependencies.filter(d => !d.completed);

  if (pending.length > 0) {
    return res.status(400).json({
      error: "Cannot complete task. Pending dependencies",
      pending: pending.map(d => ({
        id: d.id,
        title: d.title
      }))
    });
  }

  db.prepare("UPDATE tasks SET completed = 1 WHERE id = ?").run(id);

  res.json({ success: true });
});

app.listen(3001, () => console.log("Backend running on 3001"));
import React, { useCallback, useEffect, useState } from "react";

const API = "http://localhost:3001";

export default function App() {
  const [tasks, setTasks] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      console.log(`Fetching from ${API}/tasks`);
      setLoading(true);

      const res = await fetch(`${API}/tasks`);
      console.log(`Response status: ${res.status}`);

      if (!res.ok) {
        throw new Error(`API error: ${res.status}`);
      }

      const data = await res.json();
      console.log("Tasks recebidas:", data);

      setTasks(data);
      setError(null);
    } catch (err) {
      console.error("Error loading tasks:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const complete = useCallback(
    async (id) => {
      try {
        const res = await fetch(`${API}/tasks/${id}/complete`, {
          method: "POST",
        });
        if (!res.ok) {
          const data = await res.json();
          alert(`Error: ${data.error}`);
          return;
        }
        load();
      } catch (err) {
        alert(`Error: ${err.message}`);
      }
    },
    [load],
  );

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div style={{ padding: 20 }}>
      <h1>📋 Tasks App</h1>
      {loading && <p>⏳ Carregando tarefas...</p>}
      {error && (
        <div
          style={{
            padding: 10,
            backgroundColor: "#ffcccc",
            color: "red",
            borderRadius: 5,
          }}
        >
          <strong>Erro ao carregar tarefas:</strong> {error}
          <br />
          <small>Veja o console (F12 Console) para mais detalhes</small>
        </div>
      )}
      {!loading && !error && tasks.length === 0 && (
        <p>✅ Nenhuma tarefa encontrada. Crie uma nova tarefa!</p>
      )}
      {tasks.map((task) => (
        <div
          key={task.id}
          style={{
            marginBottom: 10,
            padding: 10,
            border: "1px solid #ddd",
            borderRadius: 5,
          }}
        >
          <strong>{task.id}</strong>
          <br />
          <strong>{task.title}</strong> - {task.completed ? "✅" : "❌"}
          <br />
          <small>
            Deps:{" "}
            {task.dependencies.length > 0
              ? task.dependencies
                  .map((dependency) => dependency.title)
                  .join(", ")
              : "none"}
          </small>
          <br />
          <button onClick={() => complete(task.id)} style={{ marginTop: 5 }}>
            ✓ Completar
          </button>
        </div>
      ))}
    </div>
  );
}

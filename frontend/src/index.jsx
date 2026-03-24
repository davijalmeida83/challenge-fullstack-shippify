import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";

console.log("✅ index.js iniciado");

const rootElement = document.getElementById("root");
console.log("📍 Elemento root encontrado:", rootElement);

if (!rootElement) {
  document.body.innerHTML =
    "<h1 style='color:red;'>ERRO: Elemento root não encontrado!</h1>";
} else {
  try {
    console.log("🔧 Criando root do React...");
    const root = ReactDOM.createRoot(rootElement);

    console.log("🚀 Renderizando App...");
    root.render(<App />);

    console.log("✅ App renderizado com sucesso!");
  } catch (err) {
    console.error("Stack trace:", err.stack);
    rootElement.innerHTML = `<h1 style="color: red;">ERRO: ${err.message}</h1><p>${err.stack}</p>`;
  }
}

// web/src/main.jsx
// -----------------------------------------------------------------------------
// Punto de entrada del frontend (Vite + React).
// Configura el Router y MANTIENE desactivado React.StrictMode para evitar
// el doble montaje de componentes en desarrollo (que causaba doble "joinRoom").
// Cuando termines el desarrollo inicial, puedes reactivarlo si quieres.
// -----------------------------------------------------------------------------

import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import "./styles.css"; // ⬅️ Importa el nuevo CSS

import Home from "./pages/Home.jsx";
import Create from "./pages/Create.jsx";
import Join from "./pages/Join.jsx";
import Room from "./pages/Room.jsx";

ReactDOM.createRoot(document.getElementById("root")).render(
  // ⚠️ IMPORTANTE: StrictMode duplica el montaje en dev → duplicaba efectos.
  // Si lo necesitas en el futuro, vuelve a envolver <BrowserRouter> con él.
  // <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home/>} />
        <Route path="/create" element={<Create/>} />
        <Route path="/join" element={<Join/>} />
        <Route path="/room/:roomId" element={<Room/>} />
      </Routes>
    </BrowserRouter>
  // </React.StrictMode>
);

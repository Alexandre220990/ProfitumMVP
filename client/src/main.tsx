import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Get the root element
const rootElement = document.getElementById("root");
if (!rootElement) throw new Error("Failed to find the root element");

// Create root and render app
const root = createRoot(rootElement);
root.render(
  <StrictMode>
    <App />
  </StrictMode>
);
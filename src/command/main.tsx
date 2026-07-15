import React from "react";
import ReactDOM from "react-dom/client";
import { AppProvider } from "../context/AppContext";
import { ThemeProvider } from "../context/ThemeContext";
import { CommandApp } from "./CommandApp";
import "../index.css";
import "./command.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ThemeProvider>
      <AppProvider>
        <CommandApp />
      </AppProvider>
    </ThemeProvider>
  </React.StrictMode>,
);

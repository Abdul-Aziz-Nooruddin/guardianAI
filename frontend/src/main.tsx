import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import "./styles/theme.css";
import App from "./App";
import { ThemeProvider } from "./shared/context/ThemeContext";
import { LanguageProvider } from "./shared/context/LanguageContext";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ThemeProvider>
      <LanguageProvider>
        <App />
      </LanguageProvider>
    </ThemeProvider>
  </React.StrictMode>
);
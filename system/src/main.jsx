// src/main.jsx
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";
import axios from "axios"; // 1. Import Axios
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

axios.defaults.withCredentials = true; // Wajib untuk Cookie

const queryClient = new QueryClient();

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </StrictMode>
);
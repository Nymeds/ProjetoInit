import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { App } from "./App";
import { AuthProvider } from "./context/AuthContext";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import "./index.css";
import { RegisterProvider } from "./context/RegisterContext";
import { ThemeProvider } from "./context/ThemeContext";
const queryClient = new QueryClient();

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ThemeProvider>
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <RegisterProvider>
            <App />
          </RegisterProvider>
        </AuthProvider>
      </QueryClientProvider>
    </BrowserRouter>
     </ThemeProvider>
  </React.StrictMode>
);

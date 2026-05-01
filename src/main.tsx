import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./app/App";
import "./index.css";
import { AuthProvider } from "./context/AuthContext";
import { DocumentsProvider } from "./context/DocumentsContext";
import { ImpersonationProvider } from "./context/ImpersonationContext";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <ImpersonationProvider>
          <DocumentsProvider>
            <App />
          </DocumentsProvider>
        </ImpersonationProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>,
);

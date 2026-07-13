import React from "react";
import ReactDOM from "react-dom/client";

import App from "./App";

import { AuthProvider } from "@/context/AuthContext";
import { WorkspaceProvider } from "@/context/WorkspaceContext";

import {
  LuminaAppearanceProvider,
} from "@/components/lumina/appearance";

import "./index.css";

ReactDOM.createRoot(
  document.getElementById("root")!,
).render(
  <React.StrictMode>
    <AuthProvider>
      <WorkspaceProvider>
        <LuminaAppearanceProvider>
          <App />
        </LuminaAppearanceProvider>
      </WorkspaceProvider>
    </AuthProvider>
  </React.StrictMode>,
);

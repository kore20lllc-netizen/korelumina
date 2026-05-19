import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

export default defineConfig({
  plugins: [react()],

  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },

  build: {
    chunkSizeWarningLimit: 700,

    rollupOptions: {
      output: {
        manualChunks(id) {
          // React + router
          if (
            id.includes("react-router-dom") ||
            id.includes("react-dom") ||
            id.includes("/react/")
          ) {
            return "react";
          }

          // UI libraries
          if (
            id.includes("@radix-ui") ||
            id.includes("lucide-react") ||
            id.includes("class-variance-authority") ||
            id.includes("clsx") ||
            id.includes("tailwind-merge")
          ) {
            return "ui";
          }

          // PDF/export tooling
          if (
            id.includes("jspdf") ||
            id.includes("html2canvas") ||
            id.includes("dompurify")
          ) {
            return "export";
          }

          // Monaco editor
          if (
            id.includes("monaco-editor") ||
            id.includes("@monaco-editor")
          ) {
            return "monaco";
          }

          // Workspace providers/services
          if (
            id.includes("/src/providers/") ||
            id.includes("/src/services/")
          ) {
            return "registry";
          }
        },
      },
    },
  },
});

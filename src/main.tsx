import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import { installBfcacheAuthGuard } from "./lib/api";
import "./globals.css";
import "react-phone-input-2/lib/style.css";
import "react-datepicker/dist/react-datepicker.css";

// Registered before the tree mounts: a bfcache restore fires `pageshow` with no
// React lifecycle attached, so the listener has to outlive any component.
installBfcacheAuthGuard();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

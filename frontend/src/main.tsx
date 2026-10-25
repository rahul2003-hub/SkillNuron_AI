
  import { createRoot } from "react-dom/client";
  import App, { isDarkTheme, setTheme } from "./App.tsx";
  import { Toaster } from "sonner";
  import "./index.css";

  setTheme(isDarkTheme());
  createRoot(document.getElementById("root")!).render(<><App /><Toaster richColors position="top-right" /></>);

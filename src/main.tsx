import "./styles/style.css";
import { Suspense } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./components/App";

await Promise.all([...document.fonts].map(font => font.load()));

createRoot(document.getElementById("root")!).render(
  <Suspense fallback={null}>
    <App />
  </Suspense>
);

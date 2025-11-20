import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Ensure favicon is set to company logo
const ensureFavicon = () => {
  const head = document.head || document.getElementsByTagName("head")[0];
  let link: HTMLLinkElement | null = document.querySelector("link[rel='icon']");
  if (!link) {
    link = document.createElement("link");
    link.rel = "icon";
    head.appendChild(link);
  }
  link.type = "image/png";
  link.href = "/favicon.png"; // served from public/
};

ensureFavicon();

createRoot(document.getElementById("root")!).render(<App />);

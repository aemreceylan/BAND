import { StrictMode, useContext } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import WSProvider from "./Contexts/WSProvider.jsx";

createRoot(document.getElementById("root")).render(
  // <StrictMode>
  <WSProvider>
    <App />
  </WSProvider>
  // </StrictMode>
);

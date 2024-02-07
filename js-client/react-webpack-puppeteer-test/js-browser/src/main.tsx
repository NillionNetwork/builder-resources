import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";
import { NillionContextProvider } from "./context/nillion";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <NillionContextProvider>
      <App />
    </NillionContextProvider>
  </React.StrictMode>,
);

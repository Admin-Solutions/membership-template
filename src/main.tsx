import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { Provider } from "react-redux";
import { HashRouter } from "react-router-dom";
import App from "./App";
import { store } from "./store/store";
import ViewportProvider from "./components/ViewportProvider";
import { initDevData } from "./dev-data";
import "./index.css";

// Initialize mock data for local development
initDevData();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Provider store={store}>
      <HashRouter>
        <ViewportProvider>
          <App />
        </ViewportProvider>
      </HashRouter>
    </Provider>
  </StrictMode>
);

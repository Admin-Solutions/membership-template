import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { Provider } from "react-redux";
import { HashRouter } from "react-router-dom";
import App from "./App";
import { store } from "./store/store";
import ViewportProvider from "./components/ViewportProvider";
import { NotificationProvider } from "./context/NotificationContext";
import { initDevData } from "./dev-data";
import { initDefaultRules } from "./services/messageGateway";
import "./index.css";

// Initialize mock data for local development
initDevData();

// Initialize message gateway rules
initDefaultRules();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Provider store={store}>
      <HashRouter>
        <ViewportProvider>
          <NotificationProvider>
            <App />
          </NotificationProvider>
        </ViewportProvider>
      </HashRouter>
    </Provider>
  </StrictMode>
);

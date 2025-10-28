import React from "react";
import ReactDOM from "react-dom/client";
import { Auth0Provider } from "@auth0/auth0-react";
import App from "./App.jsx";
import "./index.css";

const domain = import.meta.env.VITE_AUTH0_DOMAIN;
const clientId = import.meta.env.VITE_AUTH0_CLIENT_ID;
const audience = import.meta.env.VITE_AUTH0_AUDIENCE;
const useAudience = (import.meta.env.VITE_AUTH0_USE_AUDIENCE ?? "true").toLowerCase() !== "false";

// Build authorization params conditionally so login can work even if API isn't configured yet
const authParams = {
  redirect_uri: window.location.origin,
  scope: "openid profile email",
};
if (useAudience && audience) {
  authParams.audience = audience;
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <Auth0Provider
      domain={domain}
      clientId={clientId}
      authorizationParams={authParams}
      cacheLocation="localstorage"
      useRefreshTokens={true}
      onRedirectCallback={(appState) => {
        const target = appState?.returnTo || "/dashboard";
        window.history.replaceState({}, document.title, target);
      }}
    >
      <App />
    </Auth0Provider>
  </React.StrictMode>
);

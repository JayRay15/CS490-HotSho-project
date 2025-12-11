import React from "react";
import ReactDOM from "react-dom/client";
import { ClerkProvider } from "@clerk/clerk-react";
import App from "./App.jsx";
import "./index.css";
import { initializeSentry } from "./utils/sentry";
import { initPerformanceMonitoring } from "./utils/performance";

// Initialize Sentry error tracking
initializeSentry();

// Initialize performance monitoring (Web Vitals)
initPerformanceMonitoring({
  reportToConsole: import.meta.env.DEV,
  reportToAnalytics: import.meta.env.PROD,
});

const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

if (!PUBLISHABLE_KEY) {
  console.error("❌ Missing Clerk Publishable Key - Please add VITE_CLERK_PUBLISHABLE_KEY to your .env file");
  console.error("Get your key from: https://dashboard.clerk.com/last-active?path=api-keys");
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <ClerkProvider
      publishableKey={PUBLISHABLE_KEY}
      afterSignOutUrl="/login"
    >
      <App />
    </ClerkProvider>
  </React.StrictMode>
);

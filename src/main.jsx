import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

// import { createRoot } from 'react-dom/client';
// import App from './App.jsx';
// import './index.css';

// import * as Sentry from "@sentry/react";
// import MyFallbackComponent from "./pages/errorPage";

// Sentry.init({
//   dsn: "https://eaee7e16c58279957f3565897eea1e8a@o4511361099694080.ingest.us.sentry.io/4511361107820544",


//   integrations: [
//     Sentry.browserTracingIntegration(),
//   ],

//   tracesSampleRate: 1.0,

//   sendDefaultPii: true,
// });

// createRoot(document.getElementById('root')).render(
//   <Sentry.ErrorBoundary fallback={<MyFallbackComponent />}>
//     <App />
//   </Sentry.ErrorBoundary>
// );
// import { StrictMode } from 'react'
// import { createRoot } from 'react-dom/client'
// import './index.css'
// import ChatApp from './hooks/lx.jsx'

// createRoot(document.getElementById('root')).render(
//   <StrictMode>
//     <ChatApp currentUserId={"68fa0510cf71d180785c5c85"} conversationId={"68fa27a5cf71d180785c5d30"} token={"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpYXQiOjE3NDQwOTA0OTEsImV4cCI6MTc0NDE3Njg5MX0.f47e7h8pM810T-9gO6_m9zO2Qj50-g4C99Xy-v_8p7A"} />
//   </StrictMode>,
// )


import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import Login from './components/login.jsx'
import Register from './components/register.jsx'
import { useState } from 'react'

function RootApp() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [view, setView] = useState('login')

  if (isLoggedIn) {
    return <App />
  }

  if (view === 'register') {
    return <Register onRegisterSuccess={() => setView('login')} onSwitchToLogin={() => setView('login')} />
  }

  return <Login onLogin={() => setIsLoggedIn(true)} onSwitchToRegister={() => setView('register')} />
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <RootApp />
  </StrictMode>,
)

import { NavLink, Route, Routes } from 'react-router-dom'
import { supabase } from './lib/supabase'
import { HomePage } from './pages/HomePage'
import { LoginPage } from './pages/LoginPage'
import { NotFoundPage } from './pages/NotFoundPage'
import { ProfilePage } from './pages/ProfilePage'
import './App.css'

supabase.auth
  .getSession()
  .then(({ data, error }) => {
    if (error) {
      console.error('Supabase connection error:', error.message)
      return
    }

    console.log('Supabase connected:', {
      hasSession: Boolean(data.session),
    })
  })

function App() {
  return (
    <>
      <nav className="main-nav">
        <NavLink to="/">Accueil</NavLink>
        <NavLink to="/login">Connexion</NavLink>
        <NavLink to="/profile">Profil</NavLink>
      </nav>

      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </>
  )
}

export default App

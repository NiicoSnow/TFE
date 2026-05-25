import { NavLink } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

export function MainNavUser() {
  const { user, profile, loading } = useAuth()

  if (loading) {
    return <div className="main-nav__user main-nav__user--loading" aria-label="Chargement du profil" />
  }

  if (!user) {
    return (
      <NavLink to="/profil" className="main-nav__user main-nav__user--guest">
        <span className="main-nav__user-avatar main-nav__user-avatar--placeholder" aria-hidden />
        <span className="main-nav__user-label">Se connecter</span>
      </NavLink>
    )
  }

  const name = profile?.display_name ?? profile?.username ?? user.email?.split('@')[0] ?? 'Profil'

  return (
    <NavLink to="/profil" className="main-nav__user">
      {profile?.avatar_url ? (
        <img className="main-nav__user-avatar" src={profile.avatar_url} alt="" />
      ) : (
        <span className="main-nav__user-avatar main-nav__user-avatar--placeholder" aria-hidden />
      )}
      <span className="main-nav__user-label">{name}</span>
    </NavLink>
  )
}

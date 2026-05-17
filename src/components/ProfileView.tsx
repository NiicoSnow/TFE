import { useRef, useState, type ChangeEvent, type FormEvent } from 'react'
import { supabase } from '../lib/supabase'
import { uploadAvatar } from '../lib/uploadAvatar'
import { useAuth } from '../hooks/useAuth'
import type { Profile } from '../types/profile'

type ProfileViewProps = {
  profile: Profile
}

function formatMemberSince(dateStr: string) {
  return new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(dateStr))
}

export function ProfileView({ profile }: ProfileViewProps) {
  const { user, updateProfile, signOut } = useAuth()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [editingPassword, setEditingPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)

  const displayName = profile.display_name ?? profile.username ?? 'Utilisateur'
  const avatarSrc = avatarPreview ?? profile.avatar_url

  const handleAvatarClick = () => {
    if (!uploadingAvatar) {
      fileInputRef.current?.click()
    }
  }

  const handleAvatarChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file || !user) {
      return
    }

    setError(null)
    setInfo(null)
    setUploadingAvatar(true)

    const preview = URL.createObjectURL(file)
    setAvatarPreview(preview)

    try {
      const publicUrl = await uploadAvatar(user.id, file)
      await updateProfile({ avatar_url: publicUrl })
      setAvatarPreview(null)
      setInfo('Photo de profil mise à jour.')
    } catch (err) {
      setAvatarPreview(null)
      setError(err instanceof Error ? err.message : 'Impossible de mettre à jour la photo.')
    } finally {
      URL.revokeObjectURL(preview)
      setUploadingAvatar(false)
    }
  }

  const handleSignOut = async () => {
    setError(null)
    try {
      await signOut()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue')
    }
  }

  return (
    <div className="profile-view">
      <h3 className="profile-view__name">{displayName}</h3>

      <div className="profile-view__avatar-wrap">
        <button type="button" className="profile-view__avatar-btn" onClick={handleAvatarClick} disabled={uploadingAvatar} aria-label="Modifier la photo de profil">
          {avatarSrc ? (
            <img className="profile-view__avatar" src={avatarSrc} alt="" />
          ) : (
            <div className="profile-view__avatar profile-view__avatar--placeholder" aria-hidden />
          )}
          <span className="profile-view__avatar-edit">
            <span className="profile-view__edit-icon profile-view__avatar-edit-icon" aria-hidden />
          </span>
        </button>
        <input ref={fileInputRef} className="profile-view__avatar-input" type="file" accept="image/jpeg,image/png,image/webp,image/gif" onChange={handleAvatarChange} />
      </div>

      <h5 className="profile-view__since">Membre depuis le {formatMemberSince(profile.created_at)}</h5>
      {error && <p className="profile-message profile-message--error">{error}</p>}
      {info && <p className="profile-message profile-message--info">{info}</p>}

      <div className="profile-view__section">
        <p className="profile-view__label">Email</p>
        <p className="profile-view__value profile-view__value--readonly">{user?.email}</p>
      </div>

      <div className="profile-view__section">
        <p className="profile-view__label">Mot de passe</p>
        {editingPassword ? (
          <PasswordEditForm onCancel={() => setEditingPassword(false)} onSuccess={() => { setEditingPassword(false); setError(null); setInfo('Mot de passe mis à jour.') }} onError={setError} />
        ) : (
          <div className="profile-view__row">
            <p className="profile-view__value profile-view__value--masked">••••••••••••••</p>
            <button type="button" className="profile-view__edit" aria-label="Modifier le mot de passe" onClick={() => { setEditingPassword(true); setError(null); setInfo(null) }}><span className="profile-view__edit-icon" aria-hidden /></button>
          </div>
        )}
      </div>

      <button className="profile-button profile-button--secondary profile-view__signout" type="button" onClick={handleSignOut}>Se déconnecter</button>
    </div>
  )
}

type PasswordEditFormProps = {
  onCancel: () => void
  onSuccess: () => void
  onError: (message: string) => void
}

function PasswordEditForm({ onCancel, onSuccess, onError }: PasswordEditFormProps) {
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    if (password !== confirm) {
      onError('Les mots de passe ne correspondent pas.')
      return
    }
    if (password.length < 6) {
      onError('Le mot de passe doit contenir au moins 6 caractères.')
      return
    }
    setSubmitting(true)
    const { error } = await supabase.auth.updateUser({ password })
    setSubmitting(false)
    if (error) {
      onError(error.message)
      return
    }
    setPassword('')
    setConfirm('')
    onSuccess()
  }

  return (
    <form className="profile-form profile-view__edit-form" onSubmit={handleSubmit}>
      <input className="profile-view__input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} autoComplete="new-password" placeholder="Nouveau mot de passe" />
      <input className="profile-view__input" type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} required minLength={6} autoComplete="new-password" placeholder="Confirmer le mot de passe" />
      <div className="profile-view__edit-actions">
        <button className="profile-button" type="submit" disabled={submitting}>{submitting ? 'Enregistrement…' : 'Enregistrer'}</button>
        <button className="profile-button profile-button--secondary" type="button" onClick={onCancel}>Annuler</button>
      </div>
    </form>
  )
}


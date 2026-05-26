export function formatMemberSince(dateStr: string) {
  return new Intl.DateTimeFormat('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date(dateStr))
}

export function displayProfileName(profile: {
  username: string | null
  display_name: string | null
}) {
  return profile.display_name ?? profile.username ?? 'Utilisateur'
}

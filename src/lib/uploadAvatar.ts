import { supabase } from './supabase'

const BUCKET = 'avatars'
const MAX_SIZE = 2 * 1024 * 1024
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']

export function validateAvatarFile(file: File): string | null {
  if (!ALLOWED_TYPES.includes(file.type)) {
    return 'Format accepté : JPEG, PNG, WebP ou GIF.'
  }
  if (file.size > MAX_SIZE) {
    return 'Image trop volumineuse (max 2 Mo).'
  }
  return null
}

export async function uploadAvatar(userId: string, file: File): Promise<string> {
  const validationError = validateAvatarFile(file)
  if (validationError) {
    throw new Error(validationError)
  }

  const ext = file.name.split('.').pop()?.toLowerCase() ?? 'jpg'
  const safeExt = ['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(ext) ? ext : 'jpg'
  const filePath = `${userId}/avatar.${safeExt}`

  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(filePath, file, { upsert: true, contentType: file.type })

  if (uploadError) {
    throw uploadError
  }

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(filePath)
  return `${data.publicUrl}?t=${Date.now()}`
}

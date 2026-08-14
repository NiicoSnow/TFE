export type Profile = {
  id: string
  username: string | null
  display_name: string | null
  avatar_url: string | null
  library_public: boolean
  quiz_unique_days: number
  quiz_streak_current: number
  quiz_streak_best: number
  last_quiz_activity_date: string | null
  created_at: string
  updated_at: string
}

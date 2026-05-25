import type { Profile } from './profile'

export type FriendshipStatus = 'pending' | 'accepted' | 'rejected'

export type Friendship = {
  id: string
  requester_id: string
  addressee_id: string
  status: FriendshipStatus
  created_at: string
  updated_at: string
}

export type FriendListItem = {
  friendshipId: string
  profile: Pick<Profile, 'id' | 'username' | 'display_name' | 'avatar_url'>
}

export type FriendRequestItem = {
  friendshipId: string
  profile: Pick<Profile, 'id' | 'username' | 'display_name' | 'avatar_url'>
}

export type SearchProfileResult = Pick<Profile, 'id' | 'username' | 'display_name' | 'avatar_url'>

export type FriendRelation =
  | 'none'
  | 'pending_sent'
  | 'pending_received'
  | 'accepted'
  | 'self'

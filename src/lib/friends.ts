import { supabase } from './supabase'
import type {
  FriendListItem,
  FriendRelation,
  FriendRequestItem,
  SearchProfileResult,
} from '../types/friendship'
import type { Profile } from '../types/profile'

type ProfileRow = Pick<Profile, 'id' | 'username' | 'display_name' | 'avatar_url'>

export type FriendProfile = Pick<
  Profile,
  'id' | 'username' | 'display_name' | 'avatar_url' | 'library_public' | 'created_at'
>

async function fetchProfilesByIds(ids: string[]): Promise<ProfileRow[]> {
  if (ids.length === 0) {
    return []
  }

  const { data, error } = await supabase
    .from('profiles')
    .select('id, username, display_name, avatar_url')
    .in('id', ids)

  if (error) {
    throw error
  }

  return (data ?? []) as ProfileRow[]
}

export async function getFriends(userId: string): Promise<FriendListItem[]> {
  const { data: friendships, error } = await supabase
    .from('friendships')
    .select('id, requester_id, addressee_id')
    .eq('status', 'accepted')
    .or(`requester_id.eq.${userId},addressee_id.eq.${userId}`)

  if (error) {
    throw error
  }

  if (!friendships?.length) {
    return []
  }

  const friendIds = friendships.map((row) =>
    row.requester_id === userId ? row.addressee_id : row.requester_id,
  )

  const profiles = await fetchProfilesByIds(friendIds)
  const profileById = new Map(profiles.map((p) => [p.id, p]))

  return friendships
    .map((row) => {
      const friendId = row.requester_id === userId ? row.addressee_id : row.requester_id
      const profile = profileById.get(friendId)
      if (!profile) {
        return null
      }
      return { friendshipId: row.id, profile }
    })
    .filter((item): item is FriendListItem => item !== null)
}

export async function getPendingReceived(userId: string): Promise<FriendRequestItem[]> {
  const { data: friendships, error } = await supabase
    .from('friendships')
    .select('id, requester_id')
    .eq('addressee_id', userId)
    .eq('status', 'pending')

  if (error) {
    throw error
  }

  if (!friendships?.length) {
    return []
  }

  const profiles = await fetchProfilesByIds(friendships.map((row) => row.requester_id))
  const profileById = new Map(profiles.map((p) => [p.id, p]))

  return friendships
    .map((row) => {
      const profile = profileById.get(row.requester_id)
      if (!profile) {
        return null
      }
      return { friendshipId: row.id, profile }
    })
    .filter((item): item is FriendRequestItem => item !== null)
}

export async function searchProfiles(
  query: string,
  currentUserId: string,
): Promise<SearchProfileResult[]> {
  const trimmed = query.trim()
  if (!trimmed) {
    return []
  }

  const { data, error } = await supabase
    .from('profiles')
    .select('id, username, display_name, avatar_url')
    .or(`username.ilike.%${trimmed}%,display_name.ilike.%${trimmed}%`)
    .neq('id', currentUserId)
    .limit(10)

  if (error) {
    throw error
  }

  return (data ?? []) as SearchProfileResult[]
}

export async function getFriendProfileForViewer(
  viewerId: string,
  targetUserId: string,
): Promise<FriendProfile | null> {
  const { relation } = await getRelation(viewerId, targetUserId)
  if (relation !== 'accepted') {
    return null
  }

  const { data, error } = await supabase
    .from('profiles')
    .select('id, username, display_name, avatar_url, library_public, created_at')
    .eq('id', targetUserId)
    .maybeSingle()

  if (error) {
    throw error
  }

  return data as FriendProfile | null
}

export async function getRelation(
  currentUserId: string,
  targetUserId: string,
): Promise<{ relation: FriendRelation; friendshipId: string | null }> {
  if (currentUserId === targetUserId) {
    return { relation: 'self', friendshipId: null }
  }

  const { data, error } = await supabase
    .from('friendships')
    .select('id, status, requester_id, addressee_id')
    .or(
      `and(requester_id.eq.${currentUserId},addressee_id.eq.${targetUserId}),and(requester_id.eq.${targetUserId},addressee_id.eq.${currentUserId})`,
    )
    .maybeSingle()

  if (error) {
    throw error
  }

  if (!data) {
    return { relation: 'none', friendshipId: null }
  }

  if (data.status === 'accepted') {
    return { relation: 'accepted', friendshipId: data.id }
  }

  if (data.status === 'pending') {
    if (data.requester_id === currentUserId) {
      return { relation: 'pending_sent', friendshipId: data.id }
    }
    return { relation: 'pending_received', friendshipId: data.id }
  }

  return { relation: 'none', friendshipId: null }
}

export async function sendFriendRequest(requesterId: string, addresseeId: string) {
  const { error } = await supabase.from('friendships').insert({
    requester_id: requesterId,
    addressee_id: addresseeId,
    status: 'pending',
  })

  if (error) {
    throw error
  }
}

export async function acceptFriendRequest(friendshipId: string, userId: string) {
  const { data, error } = await supabase
    .from('friendships')
    .update({ status: 'accepted', updated_at: new Date().toISOString() })
    .eq('id', friendshipId)
    .eq('addressee_id', userId)
    .eq('status', 'pending')
    .select('id')
    .maybeSingle()

  if (error) {
    throw error
  }

  if (!data) {
    throw new Error('Impossible d’accepter la demande.')
  }
}

export async function rejectFriendRequest(friendshipId: string, userId: string) {
  const { error } = await supabase
    .from('friendships')
    .delete()
    .eq('id', friendshipId)
    .eq('addressee_id', userId)
    .eq('status', 'pending')

  if (error) {
    throw error
  }
}

export async function removeFriend(friendshipId: string, userId: string) {
  const { error } = await supabase
    .from('friendships')
    .delete()
    .eq('id', friendshipId)
    .or(`requester_id.eq.${userId},addressee_id.eq.${userId}`)

  if (error) {
    throw error
  }
}

export async function cancelFriendRequest(friendshipId: string, userId: string) {
  const { error } = await supabase
    .from('friendships')
    .delete()
    .eq('id', friendshipId)
    .eq('requester_id', userId)
    .eq('status', 'pending')

  if (error) {
    throw error
  }
}

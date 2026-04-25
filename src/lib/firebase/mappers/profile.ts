import type { Profile } from '@/types/database'

export function toProfile(doc: any): Profile {
  return {
    id: doc.id,
    email: doc.email ?? '',
    name: doc.name ?? '',
    avatar_url: doc.avatar_url ?? null,
    bio: doc.bio ?? null,
    created_at: doc.created_at ?? new Date().toISOString(),
    updated_at: doc.updated_at ?? new Date().toISOString(),
  }
}
'use client'

import { useEffect, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { where, orderBy, limit } from 'firebase/firestore'
import { auth } from '@/lib/firebase/client'
import {
  getMany, getOne, addOne, subscribeMany,
} from '@/lib/firebase/firestore'
import type { FbConversation, FbMessage, FbMessageInsert, FbUser, FbMessageThread } from '@/types/firebase'

// 既存UIとの型互換ブリッジ
export type Message = FbMessage & {
  sender_id: string
  receiver_id: string   // 既存UIの receiver_id フィールドとの互換
  is_read: boolean
  content: string
  created_at: string
}
export type MessageThread = {
  partner: FbUser
  last_message: Message
  unread_count: number
}
export type MessageInsert = FbMessageInsert

const MSG_KEY = 'messages'
const THREAD_KEY = 'message-threads'

// ── Conversation 取得または作成 ───────────────────────────────────────────────
async function getOrCreateConversation(uid: string, partnerId: string): Promise<string> {
  // 2人のdirect conversationを検索
  const existing = await getMany<FbConversation>('conversations', [
    where('participant_ids', 'array-contains', uid),
    where('type', '==', 'direct'),
  ])

  const found = existing.find((c) => c.participant_ids.includes(partnerId))
  if (found) return found.id

  // なければ作成
  const id = await addOne<Omit<FbConversation, 'id'>>('conversations', {
    participant_ids: [uid, partnerId],
    type: 'direct',
  })
  return id
}

// ── メッセージ取得 ────────────────────────────────────────────────────────────
async function fetchMessages(partnerId: string): Promise<Message[]> {
  const uid = auth.currentUser?.uid
  if (!uid || !partnerId) return []

  const convId = await getOrCreateConversation(uid, partnerId)

  const msgs = await getMany<FbMessage>('messages', [
    where('conversation_id', '==', convId),
    orderBy('created_at', 'asc'),
  ])

  // 既存UIの Message 型（receiver_id / is_read フィールド）に変換
  return msgs.map((m) => ({
    ...m,
    receiver_id: m.receiver_ids[0] ?? '',
    is_read: m.is_read ?? false,
    created_at: typeof m.created_at === 'string' ? m.created_at : new Date().toISOString(),
  }))
}

// ── スレッド一覧 ──────────────────────────────────────────────────────────────
async function fetchMessageThreads(): Promise<MessageThread[]> {
  const uid = auth.currentUser?.uid
  if (!uid) return []

  const convs = await getMany<FbConversation>('conversations', [
    where('participant_ids', 'array-contains', uid),
    where('type', '==', 'direct'),
  ])

  const threads = await Promise.all(
    convs.map(async (conv) => {
      const partnerId = conv.participant_ids.find((id) => id !== uid)
      if (!partnerId) return null

      const [partner, recentMsgs] = await Promise.all([
        getOne<FbUser>('users', partnerId),
        getMany<FbMessage>('messages', [
          where('conversation_id', '==', conv.id),
          orderBy('created_at', 'desc'),
          limit(1),
        ]),
      ])

      if (!partner) return null

      const lastMsg = recentMsgs[0]
      const unreadCount = await getMany<FbMessage>('messages', [
        where('conversation_id', '==', conv.id),
        where('sender_id', '==', partnerId),
        where('is_read', '==', false),
      ]).then((ms) => ms.length)

      const lastMessage: Message = lastMsg
        ? {
            ...lastMsg,
            receiver_id: lastMsg.receiver_ids[0] ?? '',
            is_read: lastMsg.is_read ?? false,
            created_at: typeof lastMsg.created_at === 'string' ? lastMsg.created_at : new Date().toISOString(),
          }
        : {
            id: '',
            conversation_id: conv.id,
            sender_id: uid,
            receiver_ids: [],
            receiver_id: '',
            type: 'text' as const,
            content: '',
            is_read: true,
            created_at: new Date().toISOString(),
          }

      return { partner, last_message: lastMessage, unread_count: unreadCount } as MessageThread
    })
  )

  return threads
    .filter((t): t is MessageThread => t !== null)
    .sort(
      (a, b) =>
        new Date(b.last_message.created_at).getTime() -
        new Date(a.last_message.created_at).getTime()
    )
}

export function useMessages(threadPartnerId: string) {
  return useQuery({
    queryKey: [MSG_KEY, threadPartnerId],
    queryFn: () => fetchMessages(threadPartnerId),
    enabled: !!threadPartnerId,
    staleTime: 30_000,
  })
}

export function useMessageThreads() {
  return useQuery({
    queryKey: [THREAD_KEY],
    queryFn: fetchMessageThreads,
    staleTime: 30_000,
  })
}

export function useSendMessage() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: { receiver_id: string; content: string }) => {
      const uid = auth.currentUser?.uid
      if (!uid) throw new Error('Not authenticated')

      const convId = await getOrCreateConversation(uid, input.receiver_id)
      const msg: FbMessageInsert = {
        conversation_id: convId,
        sender_id: uid,
        receiver_ids: [input.receiver_id],
        type: 'text',
        content: input.content,
        is_read: false,
        created_at: new Date().toISOString(),
      }
      const id = await addOne<FbMessageInsert>('messages', msg)
      return { id, ...msg } as FbMessage
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [MSG_KEY] })
      qc.invalidateQueries({ queryKey: [THREAD_KEY] })
    },
  })
}

// ── Realtime: messages コレクションの変更を監視 ───────────────────────────────
export function useRealtimeMessages(threadPartnerId: string) {
  const qc = useQueryClient()

  useEffect(() => {
    const uid = auth.currentUser?.uid
    if (!uid || !threadPartnerId) return

    let unsubscribe: (() => void) | undefined

    getOrCreateConversation(uid, threadPartnerId).then((convId) => {
      unsubscribe = subscribeMany<FbMessage>(
        'messages',
        [where('conversation_id', '==', convId), orderBy('created_at', 'asc')],
        () => {
          qc.invalidateQueries({ queryKey: [MSG_KEY, threadPartnerId] })
          qc.invalidateQueries({ queryKey: [THREAD_KEY] })
        }
      )
    })

    return () => unsubscribe?.()
  }, [threadPartnerId, qc])
}

import { create } from 'zustand'
import type { Notification } from '@/types/database'

interface NotificationState {
  notifications: Notification[]
  unreadCount: number
  hasMore: boolean
  page: number
  setNotifications: (notifications: Notification[]) => void
  addNotifications: (notifications: Notification[]) => void
  prependNotification: (notification: Notification) => void
  setUnreadCount: (count: number) => void
  incrementUnreadCount: () => void
  decrementUnreadCount: () => void
  markRead: (id: string) => void
  markAllRead: () => void
  setHasMore: (hasMore: boolean) => void
  setPage: (page: number) => void
  reset: () => void
}

export const useNotificationStore = create<NotificationState>()((set, get) => ({
  notifications: [],
  unreadCount: 0,
  hasMore: false,
  page: 1,

  setNotifications: (notifications) => set({ notifications }),

  addNotifications: (notifications) =>
    set((state) => ({
      notifications: [
        ...state.notifications,
        ...notifications.filter(
          (n) => !state.notifications.some((existing) => existing.id === n.id)
        ),
      ],
    })),

  prependNotification: (notification) =>
    set((state) => ({
      notifications: [notification, ...state.notifications],
      unreadCount: state.unreadCount + (notification.is_read ? 0 : 1),
    })),

  setUnreadCount: (unreadCount) => set({ unreadCount }),

  incrementUnreadCount: () =>
    set((state) => ({ unreadCount: state.unreadCount + 1 })),

  decrementUnreadCount: () =>
    set((state) => ({ unreadCount: Math.max(0, state.unreadCount - 1) })),

  markRead: (id) =>
    set((state) => {
      const notification = state.notifications.find((n) => n.id === id)
      if (!notification || notification.is_read) return state
      return {
        notifications: state.notifications.map((n) =>
          n.id === id ? { ...n, is_read: true } : n
        ),
        unreadCount: Math.max(0, state.unreadCount - 1),
      }
    }),

  markAllRead: () =>
    set((state) => ({
      notifications: state.notifications.map((n) => ({ ...n, is_read: true })),
      unreadCount: 0,
    })),

  setHasMore: (hasMore) => set({ hasMore }),

  setPage: (page) => set({ page }),

  reset: () =>
    set({
      notifications: [],
      unreadCount: 0,
      hasMore: false,
      page: 1,
    }),
}))

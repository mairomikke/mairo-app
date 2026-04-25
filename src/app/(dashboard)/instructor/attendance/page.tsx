'use client'

import { useEffect, useState } from 'react'
import { useAuthStore } from '@/stores/auth-store'
import { Card, CardContent } from '@/components/ui/card'
import { Users } from 'lucide-react'

export default function AttendancePage() {
  const { user } = useAuthStore()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(false)
  }, [])

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">出席管理</h1>
        <p className="text-sm text-gray-500 mt-1">
          QRコードで出席を確認します
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-24">
          <div className="animate-spin h-6 w-6 rounded-full border-2 border-indigo-600 border-t-transparent" />
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-gray-400">
            <Users className="h-10 w-10 mb-2 opacity-40" />
            <p className="text-sm">現在この機能は準備中です</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
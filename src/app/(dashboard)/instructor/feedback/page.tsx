'use client'

import { useState, useEffect } from 'react'
import { useAuthStore } from '@/stores/auth-store'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { MessageSquare } from 'lucide-react'

export default function InstructorFeedbackPage() {
  const { user } = useAuthStore()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(false)
  }, [])

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">フィードバック</h1>
        <p className="text-sm text-gray-500 mt-1">
          生徒へのフィードバック機能（現在準備中）
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48">
          <div className="animate-spin h-6 w-6 rounded-full border-2 border-indigo-600 border-t-transparent" />
        </div>
      ) : (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-indigo-600" />
              フィードバック機能
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center py-12 text-gray-400">
            <MessageSquare className="h-10 w-10 mb-2 opacity-40" />
            <p className="text-sm">現在この機能は準備中です</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
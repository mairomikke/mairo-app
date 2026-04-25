// DISABLED: Supabase session check → Firebase 移行済み
// import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { auth } from '@/lib/firebase/client'

export default async function Home() {
  // Firebase Auth はクライアント側で処理するため、
  // サーバー側ではダッシュボードへリダイレクトする
  redirect('/dashboard')
}

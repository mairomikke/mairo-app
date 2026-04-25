// Firebase 移行後、Supabase ミドルウェアは不要。
// このファイルは proxy.ts からの参照を維持するため残しています。
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  // Firebase Auth はクライアント側で処理するため、ここでは素通りさせる
  return NextResponse.next({ request })
}

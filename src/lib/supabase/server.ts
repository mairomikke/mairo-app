// DISABLED: Supabase → Firebase 移行済み
// このファイルは import エラーを防ぐためスタブとして残しています。

/* eslint-disable @typescript-eslint/no-explicit-any */
export async function createClient(): Promise<any> {
  console.warn('[Supabase stub] createClient() (server) is disabled. Use Firebase instead.')
  return null
}

export async function createServiceClient(): Promise<any> {
  console.warn('[Supabase stub] createServiceClient() is disabled. Use Firebase instead.')
  return null
}

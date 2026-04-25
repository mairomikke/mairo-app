import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  type QueryConstraint,
  type DocumentData,
  type Unsubscribe,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore'
import { db } from './client'

export { serverTimestamp, Timestamp }

// ── collection reference helpers ─────────────────────────────────────────────
export const col = (path: string) => collection(db, path)
export const docRef = (path: string, id: string) => doc(db, path, id)

// ── get one ──────────────────────────────────────────────────────────────────
export async function getOne<T>(colPath: string, id: string): Promise<T | null> {
  const snap = await getDoc(doc(db, colPath, id))
  if (!snap.exists()) return null
  return { id: snap.id, ...snap.data() } as T
}

// ── get many with optional constraints ───────────────────────────────────────
export async function getMany<T>(
  colPath: string,
  constraints: QueryConstraint[] = []
): Promise<T[]> {
  const q = query(collection(db, colPath), ...constraints)
  const snap = await getDocs(q)
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as T))
}

// ── add document (auto ID) ───────────────────────────────────────────────────
export async function addOne<T extends DocumentData>(
  colPath: string,
  data: T
): Promise<string> {
  const ref = await addDoc(collection(db, colPath), {
    ...data,
    created_at: serverTimestamp(),
  })
  return ref.id
}

// ── set document (explicit ID) ───────────────────────────────────────────────
export async function setOne<T extends DocumentData>(
  colPath: string,
  id: string,
  data: T
): Promise<void> {
  await setDoc(doc(db, colPath, id), {
    ...data,
    created_at: serverTimestamp(),
  })
}

// ── update document ──────────────────────────────────────────────────────────
export async function updateOne(
  colPath: string,
  id: string,
  data: Partial<DocumentData>
): Promise<void> {
  await updateDoc(doc(db, colPath, id), data)
}

// ── delete document ──────────────────────────────────────────────────────────
export async function deleteOne(colPath: string, id: string): Promise<void> {
  await deleteDoc(doc(db, colPath, id))
}

// ── realtime listener ────────────────────────────────────────────────────────
export function subscribeMany<T>(
  colPath: string,
  constraints: QueryConstraint[],
  callback: (items: T[]) => void
): Unsubscribe {
  const q = query(collection(db, colPath), ...constraints)
  return onSnapshot(q, (snap) => {
    const items = snap.docs.map((d) => ({ id: d.id, ...d.data() } as T))
    callback(items)
  })
}

// ── re-export query helpers ──────────────────────────────────────────────────
export { where, orderBy, limit, query, onSnapshot, collection, doc, getDocs, getDoc }

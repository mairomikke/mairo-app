import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { formatDistanceToNow, format, parseISO, isValid } from 'date-fns';
import { ja } from 'date-fns/locale';

// ============================================================
// CLASSNAME UTILITY
// ============================================================

/**
 * Merges Tailwind CSS class names safely, resolving conflicts.
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

// ============================================================
// CURRENCY FORMATTING
// ============================================================

/**
 * Formats a numeric amount as Japanese Yen (JPY).
 * Example: formatCurrency(5000) => "¥5,000"
 */
export function formatCurrency(
  amount: number,
  options: Intl.NumberFormatOptions = {}
): string {
  return new Intl.NumberFormat('ja-JP', {
    style: 'currency',
    currency: 'JPY',
    maximumFractionDigits: 0,
    ...options,
  }).format(amount);
}

/**
 * Formats a numeric amount with compact notation for large values.
 * Example: formatCurrencyCompact(1500000) => "¥150万"
 */
export function formatCurrencyCompact(amount: number): string {
  if (amount >= 10_000) {
    return `¥${(amount / 10_000).toFixed(amount % 10_000 === 0 ? 0 : 1)}万`;
  }
  return formatCurrency(amount);
}

// ============================================================
// DATE FORMATTING
// ============================================================

/**
 * Formats a date string or Date object to a readable date string.
 * Example: formatDate("2025-04-16T12:00:00Z") => "2025年4月16日"
 */
export function formatDate(
  date: string | Date | null | undefined,
  formatStr = 'yyyy年M月d日'
): string {
  if (!date) return '';
  const d = typeof date === 'string' ? parseISO(date) : date;
  if (!isValid(d)) return '';
  return format(d, formatStr, { locale: ja });
}

/**
 * Formats a date string to include time.
 * Example: formatDateTime("2025-04-16T12:00:00Z") => "2025年4月16日 12:00"
 */
export function formatDateTime(
  date: string | Date | null | undefined
): string {
  return formatDate(date, 'yyyy年M月d日 HH:mm');
}

/**
 * Formats a date string to show only time.
 * Example: formatTime("2025-04-16T12:30:00Z") => "12:30"
 */
export function formatTime(date: string | Date | null | undefined): string {
  return formatDate(date, 'HH:mm');
}

/**
 * Returns a relative time string from a date.
 * Example: formatRelativeTime("2025-04-15T12:00:00Z") => "1日前"
 */
export function formatRelativeTime(
  date: string | Date | null | undefined
): string {
  if (!date) return '';
  const d = typeof date === 'string' ? parseISO(date) : date;
  if (!isValid(d)) return '';
  return formatDistanceToNow(d, { addSuffix: true, locale: ja });
}

/**
 * Returns a short date format suitable for lists.
 * Example: formatShortDate("2025-04-16T12:00:00Z") => "4/16"
 */
export function formatShortDate(
  date: string | Date | null | undefined
): string {
  return formatDate(date, 'M/d');
}

// ============================================================
// STRING UTILITIES
// ============================================================

/**
 * Generates initials from a full name.
 * Example: getInitials("田中 太郎") => "田太"
 * Example: getInitials("John Doe") => "JD"
 */
export function getInitials(name: string | null | undefined): string {
  if (!name) return '?';
  const trimmed = name.trim();
  if (!trimmed) return '?';

  const parts = trimmed.split(/\s+/);
  if (parts.length === 1) {
    // Single word: take up to first 2 characters
    return trimmed.slice(0, 2).toUpperCase();
  }
  // Multi-word: take first character of first and last parts
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/**
 * Truncates a string to a maximum length, appending an ellipsis.
 * Example: truncate("Hello, world!", 8) => "Hello, w..."
 */
export function truncate(
  text: string | null | undefined,
  maxLength: number,
  ellipsis = '...'
): string {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - ellipsis.length) + ellipsis;
}

/**
 * Slugifies a string for use in URLs.
 * Example: slugify("Hello World!") => "hello-world"
 */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Capitalizes the first letter of a string.
 */
export function capitalize(text: string): string {
  if (!text) return '';
  return text.charAt(0).toUpperCase() + text.slice(1);
}

// ============================================================
// NUMBER UTILITIES
// ============================================================

/**
 * Clamps a number between a minimum and maximum value.
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/**
 * Formats a number with locale-aware separators.
 * Example: formatNumber(1234567) => "1,234,567"
 */
export function formatNumber(value: number): string {
  return new Intl.NumberFormat('ja-JP').format(value);
}

// ============================================================
// ARRAY UTILITIES
// ============================================================

/**
 * Removes duplicate values from an array.
 */
export function unique<T>(arr: T[]): T[] {
  return Array.from(new Set(arr));
}

/**
 * Groups an array of objects by a key.
 */
export function groupBy<T>(
  arr: T[],
  key: keyof T
): Record<string, T[]> {
  return arr.reduce(
    (acc, item) => {
      const groupKey = String(item[key]);
      if (!acc[groupKey]) {
        acc[groupKey] = [];
      }
      acc[groupKey].push(item);
      return acc;
    },
    {} as Record<string, T[]>
  );
}

// ============================================================
// URL UTILITIES
// ============================================================

/**
 * Constructs a URL with query parameters.
 */
export function buildUrl(
  base: string,
  params: Record<string, string | number | boolean | undefined | null>
): string {
  const url = new URL(base, process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000');
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      url.searchParams.set(key, String(value));
    }
  });
  return url.pathname + (url.search ? url.search : '');
}

// ============================================================
// VALIDATION UTILITIES
// ============================================================

/**
 * Checks whether a string is a valid UUID v4.
 */
export function isValidUUID(value: string): boolean {
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(value);
}

/**
 * Returns true if the value is a non-empty string after trimming.
 */
export function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

// ============================================================
// ASYNC UTILITIES
// ============================================================

/**
 * Pauses execution for a given number of milliseconds.
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Wraps a promise and returns [data, error] instead of throwing.
 */
export async function tryCatch<T>(
  promise: Promise<T>
): Promise<[T, null] | [null, Error]> {
  try {
    const data = await promise;
    return [data, null];
  } catch (err) {
    return [null, err instanceof Error ? err : new Error(String(err))];
  }
}

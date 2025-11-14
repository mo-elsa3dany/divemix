import type { Buffer } from 'buffer';

const buf = (globalThis as { Buffer?: typeof Buffer }).Buffer; // avoid TS error in browser

export function encodePlan(obj: unknown): string {
  const json = JSON.stringify(obj);
  const b64 =
    typeof window === 'undefined' && buf
      ? buf.from(json).toString('base64')
      : btoa(unescape(encodeURIComponent(json)));
  return b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export function decodePlan<T = unknown>(b64url: string): T | null {
  try {
    const b64 = b64url.replace(/-/g, '+').replace(/_/g, '/');
    const pad = b64.length % 4 === 0 ? '' : '='.repeat(4 - (b64.length % 4));
    const str =
      typeof window === 'undefined' && buf
        ? buf.from(b64 + pad, 'base64').toString('utf8')
        : decodeURIComponent(escape(atob(b64 + pad)));
    return JSON.parse(str) as T;
  } catch {
    return null;
  }
}

export async function copy(text: string) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

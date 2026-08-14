import { randomUUID } from 'node:crypto';

const REQUEST_TIMEOUT_MS = 10_000;

export function backendUrl() { return (process.env.FEEDBACK_API_URL || process.env.NEXT_PUBLIC_FEEDBACK_API_URL || 'http://localhost:4000').replace(/\/$/, ''); }
export function backendHeaders(request: Request, includeJson = false) { const headers = new Headers({ Accept: 'application/json', 'X-Request-ID': request.headers.get('X-Request-ID') || randomUUID() }); if (includeJson) headers.set('Content-Type', 'application/json'); if (process.env.FEEDBACK_API_KEY) headers.set('x-api-key', process.env.FEEDBACK_API_KEY); return headers; }
export async function fetchBackend(url: string | URL, init: RequestInit) { const controller = new AbortController(); const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS); try { return await fetch(url, { ...init, signal: controller.signal, cache: 'no-store' }); } finally { clearTimeout(timeout); } }
export async function proxyResponse(response: Response) { const body = await response.text(); return new Response(body, { status: response.status, headers: { 'Content-Type': response.headers.get('Content-Type') || 'application/json', 'X-Request-ID': response.headers.get('X-Request-ID') || '' } }); }
export function errorResponse(message: string, status = 502, requestId?: string) { const id = requestId || randomUUID(); return Response.json({ message, requestId: id }, { status, headers: { 'X-Request-ID': id } }); }

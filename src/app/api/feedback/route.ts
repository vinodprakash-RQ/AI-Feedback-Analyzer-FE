import { backendHeaders, backendUrl, errorResponse, fetchBackend, proxyResponse } from '@/lib/server-feedback-api';

export async function POST(request: Request) {
  const requestId = request.headers.get('X-Request-ID') || undefined;
  try {
    const body: unknown = await request.json();
    if (!body || typeof body !== 'object' || typeof (body as { message?: unknown }).message !== 'string' || !(body as { message: string }).message.trim() || (body as { message: string }).message.length > 20000) return errorResponse('Feedback message must contain between 1 and 20,000 characters.', 400, requestId);
    const response = await fetchBackend(`${backendUrl()}/api/v1/feedback`, { method: 'POST', headers: backendHeaders(request, true), body: JSON.stringify(body) });
    return proxyResponse(response);
  } catch (error) {
    return errorResponse(error instanceof DOMException && error.name === 'AbortError' ? 'Feedback service timed out.' : 'Feedback service is unavailable.', 502, requestId);
  }
}

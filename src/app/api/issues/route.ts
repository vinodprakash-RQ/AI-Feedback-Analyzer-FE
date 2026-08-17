import { backendHeaders, backendUrl, errorResponse, fetchBackend, proxyResponse } from '@/lib/server-feedback-api';

export async function GET(request: Request) {
  const requestId = request.headers.get('X-Request-ID') || undefined;
  try {
    const url = new URL('/api/issues', backendUrl());
    new URL(request.url).searchParams.forEach((value, key) => url.searchParams.set(key, value));
    const response = await fetchBackend(url, { headers: backendHeaders(request, false, 'DASHBOARD_API_KEY') });
    return proxyResponse(response);
  } catch (error) {
    return errorResponse(error instanceof DOMException && error.name === 'AbortError' ? 'Issue service timed out.' : 'Issue service is unavailable.', 502, requestId);
  }
}

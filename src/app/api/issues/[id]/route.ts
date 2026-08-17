import { backendHeaders, backendUrl, errorResponse, fetchBackend, proxyResponse } from '@/lib/server-feedback-api';

const statuses = new Set(['NEW', 'INVESTIGATING', 'RESOLVED', 'CLOSED']);

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const requestId = request.headers.get('X-Request-ID') || undefined;
  const { id } = await params;
  if (!id) return errorResponse('Issue ID is required.', 400, requestId);

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return errorResponse('Request body must be valid JSON.', 400, requestId);
  }

  const status = body && typeof body === 'object' && 'status' in body ? body.status : undefined;
  if (typeof status !== 'string' || !statuses.has(status)) return errorResponse('Status must be NEW, INVESTIGATING, RESOLVED, or CLOSED.', 400, requestId);

  try {
    const url = new URL(`/api/issues/${encodeURIComponent(id)}`, backendUrl());
    const response = await fetchBackend(url, { method: 'PATCH', headers: backendHeaders(request, true, 'DASHBOARD_API_KEY'), body: JSON.stringify({ status }) });
    return proxyResponse(response);
  } catch (error) {
    return errorResponse(error instanceof DOMException && error.name === 'AbortError' ? 'Issue service timed out.' : 'Issue service is unavailable.', 502, requestId);
  }
}

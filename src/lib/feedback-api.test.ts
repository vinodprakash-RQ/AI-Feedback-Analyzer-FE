import { afterEach, describe, expect, it, vi } from 'vitest';
import { fetchIssuePage, submitFeedback } from './feedback-api';

afterEach(() => vi.restoreAllMocks());

describe('feedback API client', () => {
  it('rejects empty feedback before making a request', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch');
    await expect(submitFeedback({ message: '   ' })).rejects.toThrow('between 1 and 20,000');
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('submits feedback through the same-origin proxy', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(JSON.stringify({ feedback_id: 'fb-1', status: 'accepted', created_at: '2026-08-14T00:00:00.000Z' }), { status: 200, headers: { 'Content-Type': 'application/json' } }));
    await submitFeedback({ message: 'A valid report' });
    expect(globalThis.fetch).toHaveBeenCalledWith('/api/feedback', expect.objectContaining({ method: 'POST', body: JSON.stringify({ message: 'A valid report' }) }));
  });

  it('validates the issue response and keeps backend pagination', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(JSON.stringify({ items: [{ id: 'i-1', summary: 'Build failed', originalFeedback: 'It fails', category: 'BUILD_FAILURE', sentiment: 'NEGATIVE', severity: 'HIGH', status: 'NEW', createdAt: '2026-08-14T00:00:00.000Z' }], pagination: { page: 2, pageSize: 10, total: 11, totalPages: 2 } }), { status: 200, headers: { 'Content-Type': 'application/json' } }));
    const result = await fetchIssuePage({ page: 2, pageSize: 10, sort: 'newest' });
    expect(result.pagination).toEqual({ page: 2, pageSize: 10, total: 11, totalPages: 2 });
    expect(result.items[0].category).toBe('Build Failure');
  });
});

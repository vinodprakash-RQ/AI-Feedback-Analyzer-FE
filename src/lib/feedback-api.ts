export type Category = 'Application Generation' | 'AI Response' | 'Build Failure' | 'UI/UX' | 'Authentication' | 'Performance' | 'Integration' | 'Other';
export type Sentiment = 'Positive' | 'Neutral' | 'Negative' | 'Frustrated';
export type Severity = 'Low' | 'Medium' | 'High' | 'Critical';
export type DashboardIssue = { id: string; title: string; category: Category; sentiment: Sentiment; severity: Severity; status: 'Open' | 'Resolved'; time: string; assignee: string; initials: string };

type ApiIssue = { id: string; summary: string; category: Uppercase<string>; sentiment: Uppercase<Sentiment>; severity: Uppercase<Severity>; status: 'NEW' | 'INVESTIGATING' | 'RESOLVED' | 'CLOSED'; createdAt: string; userReference?: string };
type IssuesResponse = { items: ApiIssue[]; pagination: { page: number; pageSize: number; total: number; totalPages: number } };

const mockIssues: DashboardIssue[] = [
  { id: 'FB-1042', title: 'Exporting reports times out for larger workspaces', category: 'Performance', sentiment: 'Frustrated', severity: 'High', status: 'Open', time: '12 min ago', assignee: 'Jordan Lee', initials: 'JL' },
  { id: 'FB-1041', title: 'Generated response missed the requested API example', category: 'AI Response', sentiment: 'Negative', severity: 'Medium', status: 'Open', time: '34 min ago', assignee: 'Maya Chen', initials: 'MC' },
  { id: 'FB-1040', title: 'Billing integration shows an old plan after upgrade', category: 'Integration', sentiment: 'Frustrated', severity: 'Critical', status: 'Open', time: '1 hr ago', assignee: 'Unassigned', initials: '—' },
  { id: 'FB-1039', title: 'Mobile navigation overlaps the feedback button', category: 'UI/UX', sentiment: 'Neutral', severity: 'Low', status: 'Resolved', time: '2 hrs ago', assignee: 'Sam Rivera', initials: 'SR' },
  { id: 'FB-1038', title: 'Build fails when generating a project with SSO enabled', category: 'Build Failure', sentiment: 'Negative', severity: 'High', status: 'Open', time: '3 hrs ago', assignee: 'Alex Morgan', initials: 'AM' },
  { id: 'FB-1037', title: 'Users cannot sign in after resetting their password', category: 'Authentication', sentiment: 'Frustrated', severity: 'Critical', status: 'Open', time: '4 hrs ago', assignee: 'Priya Shah', initials: 'PS' },
];

const categoryLabels: Record<string, Category> = { APPLICATION_GENERATION: 'Application Generation', AI_RESPONSE: 'AI Response', BUILD_FAILURE: 'Build Failure', UI_UX: 'UI/UX', AUTHENTICATION: 'Authentication', PERFORMANCE: 'Performance', INTEGRATION: 'Integration', OTHER: 'Other' };
const sentimentLabels: Record<string, Sentiment> = { POSITIVE: 'Positive', NEUTRAL: 'Neutral', NEGATIVE: 'Negative', FRUSTRATED: 'Frustrated' };
const severityLabels: Record<string, Severity> = { LOW: 'Low', MEDIUM: 'Medium', HIGH: 'High', CRITICAL: 'Critical' };

function relativeTime(value: string) { const age = Date.now() - new Date(value).getTime(); const minutes = Math.max(1, Math.round(age / 60000)); if (minutes < 60) return `${minutes} min ago`; const hours = Math.round(minutes / 60); if (hours < 24) return `${hours} hr${hours === 1 ? '' : 's'} ago`; return `${Math.round(hours / 24)} day${hours < 48 ? '' : 's'} ago`; }
function normalizeIssue(issue: ApiIssue): DashboardIssue { return { id: issue.id, title: issue.summary, category: categoryLabels[issue.category] ?? 'Other', sentiment: sentimentLabels[issue.sentiment] ?? 'Neutral', severity: severityLabels[issue.severity] ?? 'Medium', status: issue.status === 'RESOLVED' || issue.status === 'CLOSED' ? 'Resolved' : 'Open', time: relativeTime(issue.createdAt), assignee: 'Unassigned', initials: issue.userReference?.slice(0, 2).toUpperCase() || '—' }; }

export async function fetchIssues(options: { signal?: AbortSignal } = {}): Promise<DashboardIssue[]> { if (process.env.NEXT_PUBLIC_USE_MOCK_DATA === 'true') return mockIssues; const baseUrl = process.env.NEXT_PUBLIC_FEEDBACK_API_URL?.trim() || 'http://localhost:4000'; const response = await fetch(`${baseUrl.replace(/\/$/, '')}/api/issues?page=1&pageSize=100&sort=newest`, { signal: options.signal, headers: { Accept: 'application/json' }, cache: 'no-store' }); if (!response.ok) throw new Error(`Issue API returned ${response.status}`); const payload = await response.json() as IssuesResponse; return payload.items.map(normalizeIssue); }

export type SubmitFeedbackInput = { message: string; user_id?: string; conversation_id?: string; project_id?: string; source?: string; page_url?: string; user_agent?: string; metadata?: Record<string, unknown> };
export type SubmitFeedbackResponse = { feedback_id: string; status: string; created_at: string };
export type FeedbackApiError = { error?: { code?: string; message?: string; request_id?: string } };

export async function submitFeedback(input: SubmitFeedbackInput, options: { signal?: AbortSignal } = {}): Promise<SubmitFeedbackResponse> {
  const baseUrl = process.env.NEXT_PUBLIC_FEEDBACK_API_URL?.trim() || 'http://localhost:4000';
  const response = await fetch(`${baseUrl.replace(/\/$/, '')}/api/v1/feedback`, {
    method: 'POST',
    signal: options.signal,
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      'Idempotency-Key': crypto.randomUUID(),
      'X-Request-ID': crypto.randomUUID(),
    },
    body: JSON.stringify(input),
  });
  if (!response.ok) {
    const error = await response.json().catch(() => null) as FeedbackApiError | null;
    throw new Error(error?.error?.message || `Feedback API returned ${response.status}`);
  }
  return response.json() as Promise<SubmitFeedbackResponse>;
}

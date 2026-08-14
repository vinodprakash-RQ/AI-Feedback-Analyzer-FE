'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { AlertCircle, ArrowLeft, Bell, CalendarDays, ChevronDown, CircleHelp, Command, Inbox, LayoutDashboard, ListFilter, MessageSquare, MoreHorizontal, Search, Settings, SlidersHorizontal, Sparkles, Tag, Users, X } from 'lucide-react';
import { fetchDetailedIssues } from '@/lib/feedback-api';

type Category = 'Application Generation' | 'AI Response' | 'Build Failure' | 'UI/UX' | 'Authentication' | 'Performance' | 'Integration' | 'Other';
type Sentiment = 'Positive' | 'Neutral' | 'Negative' | 'Frustrated';
type Severity = 'Low' | 'Medium' | 'High' | 'Critical';
type Status = 'New' | 'Investigating' | 'Resolved' | 'Closed';
type Issue = { id: string; summary: string; feedback: string; category: Category; subcategory: string; sentiment: Sentiment; severity: Severity; status: Status; createdAt: string; userReference: string; projectReference: string; conversationId: string; confidence: number; metadata: Record<string, string> };

type ViewState = 'ready' | 'loading' | 'empty' | 'error';
const categories: Category[] = ['Application Generation', 'AI Response', 'Build Failure', 'UI/UX', 'Authentication', 'Performance', 'Integration', 'Other'];
const sentiments: Sentiment[] = ['Positive', 'Neutral', 'Negative', 'Frustrated'];
const severities: Severity[] = ['Low', 'Medium', 'High', 'Critical'];
const statuses: Status[] = ['New', 'Investigating', 'Resolved', 'Closed'];
const mockIssues: Issue[] = [
  { id: 'ISS-1001', summary: 'Generated application fails during build', feedback: 'The generated app looks correct, but the build fails with a module resolution error.', category: 'Build Failure', subcategory: 'Module resolution', sentiment: 'Frustrated', severity: 'Critical', status: 'Investigating', createdAt: '2026-08-12T14:30:00.000Z', userReference: 'user_2048', projectReference: 'project_alpha', conversationId: 'conversation_9001', confidence: .96, metadata: { Browser: 'Chrome 126', Environment: 'production', Source: 'AI builder' } },
  { id: 'ISS-1002', summary: 'AI response omitted required authentication headers', feedback: 'I asked for an authenticated API example, but the response left out the bearer token header.', category: 'AI Response', subcategory: 'Missing context', sentiment: 'Negative', severity: 'High', status: 'New', createdAt: '2026-08-11T09:15:00.000Z', userReference: 'user_1982', projectReference: 'project_delta', conversationId: 'conversation_8994', confidence: .91, metadata: { Browser: 'Safari 17', Environment: 'staging', Source: 'Chat' } },
  { id: 'ISS-1003', summary: 'Exporting reports times out for larger workspaces', feedback: 'Our team cannot export the monthly report. It spins for a while and then times out.', category: 'Performance', subcategory: 'Timeout', sentiment: 'Frustrated', severity: 'High', status: 'Investigating', createdAt: '2026-08-10T16:42:00.000Z', userReference: 'user_1871', projectReference: 'project_beta', conversationId: 'conversation_8981', confidence: .88, metadata: { Browser: 'Chrome 126', Environment: 'production', Source: 'In-app widget' } },
  { id: 'ISS-1004', summary: 'Mobile navigation overlaps feedback button', feedback: 'On a phone, the navigation covers the feedback button so I cannot submit a report.', category: 'UI/UX', subcategory: 'Responsive layout', sentiment: 'Neutral', severity: 'Medium', status: 'Resolved', createdAt: '2026-08-09T11:20:00.000Z', userReference: 'user_1755', projectReference: 'project_gamma', conversationId: 'conversation_8970', confidence: .98, metadata: { Browser: 'Mobile Safari', Environment: 'production', Source: 'In-app widget' } },
  { id: 'ISS-1005', summary: 'Users cannot sign in after password reset', feedback: 'The reset email arrives, but the new password is rejected on the next login attempt.', category: 'Authentication', subcategory: 'Password reset', sentiment: 'Negative', severity: 'Critical', status: 'New', createdAt: '2026-08-08T08:05:00.000Z', userReference: 'user_1652', projectReference: 'project_epsilon', conversationId: 'conversation_8958', confidence: .94, metadata: { Browser: 'Firefox 128', Environment: 'production', Source: 'Support inbox' } },
  { id: 'ISS-1006', summary: 'Webhook integration does not retry failed deliveries', feedback: 'When our endpoint is temporarily down, events disappear instead of being retried.', category: 'Integration', subcategory: 'Webhooks', sentiment: 'Negative', severity: 'High', status: 'Investigating', createdAt: '2026-08-06T13:12:00.000Z', userReference: 'user_1498', projectReference: 'project_zeta', conversationId: 'conversation_8940', confidence: .9, metadata: { Browser: 'Chrome 125', Environment: 'production', Source: 'Slack' } },
  { id: 'ISS-1007', summary: 'Application generation is much faster than before', feedback: 'The latest generated project was ready in seconds and the structure was easy to understand.', category: 'Application Generation', subcategory: 'Generation quality', sentiment: 'Positive', severity: 'Low', status: 'Closed', createdAt: '2026-08-04T17:25:00.000Z', userReference: 'user_1302', projectReference: 'project_eta', conversationId: 'conversation_8918', confidence: .97, metadata: { Browser: 'Edge 127', Environment: 'production', Source: 'In-app widget' } },
  { id: 'ISS-1008', summary: 'Build output is hard to scan for warnings', feedback: 'The build succeeds, but it is difficult to tell which warnings require action.', category: 'Build Failure', subcategory: 'Build output', sentiment: 'Neutral', severity: 'Low', status: 'Resolved', createdAt: '2026-08-02T10:10:00.000Z', userReference: 'user_1120', projectReference: 'project_theta', conversationId: 'conversation_8890', confidence: .87, metadata: { Browser: 'Chrome 125', Environment: 'staging', Source: 'Feedback form' } },
];

const navItems = [{ label: 'Overview', href: '/', icon: LayoutDashboard }, { label: 'Issues', href: '/issues', icon: Inbox, count: String(mockIssues.length) }, { label: 'Feedback', href: '/issues', icon: MessageSquare }, { label: 'Insights', href: '/', icon: ListFilter }];
function Badge({ children, tone }: { children: React.ReactNode; tone: string }) { return <span className={`badge ${tone}`}>{children}</span>; }
function initials(value: string) { return value.replace(/[^a-zA-Z]/g, '').slice(0, 2).toUpperCase() || '—'; }
function tone(value: string) { return value.toLowerCase().replace(/\s+/g, '-'); }
function formatDate(value: string) { return new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(value)); }

export default function IssuesClient() {
  const [mobileNav, setMobileNav] = useState(false);
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<Category | ''>('');
  const [subcategory, setSubcategory] = useState('');
  const [sentiment, setSentiment] = useState<Sentiment | ''>('');
  const [severity, setSeverity] = useState<Severity | ''>('');
  const [status, setStatus] = useState<Status | ''>('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [sort, setSort] = useState<'newest' | 'oldest' | 'severity'>('newest');
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<Issue | null>(null);
  const [issues, setIssues] = useState<Issue[]>(mockIssues);
  const [viewState, setViewState] = useState<ViewState>('loading');
  const [retryKey, setRetryKey] = useState(0);
  const pageSize = 5;

  useEffect(() => {
    const controller = new AbortController();
    setViewState('loading');
    fetchDetailedIssues({ signal: controller.signal }).then((nextIssues) => {
      setIssues(nextIssues);
      setViewState(nextIssues.length ? 'ready' : 'empty');
    }).catch((error: unknown) => {
      if (error instanceof DOMException && error.name === 'AbortError') return;
      setViewState('error');
    });
    return () => controller.abort();
  }, [retryKey]);

  const subcategories = useMemo(() => [...new Set(issues.filter((issue) => !category || issue.category === category).map((issue) => issue.subcategory))], [category, issues]);
  const filtered = useMemo(() => {
    const result = issues.filter((issue) => {
      const haystack = `${issue.summary} ${issue.feedback}`.toLowerCase();
      return (!query || haystack.includes(query.toLowerCase())) && (!category || issue.category === category) && (!subcategory || issue.subcategory === subcategory) && (!sentiment || issue.sentiment === sentiment) && (!severity || issue.severity === severity) && (!status || issue.status === status) && (!from || issue.createdAt.slice(0, 10) >= from) && (!to || issue.createdAt.slice(0, 10) <= to);
    });
    return result.sort((a, b) => sort === 'severity' ? severities.indexOf(a.severity) - severities.indexOf(b.severity) : sort === 'newest' ? b.createdAt.localeCompare(a.createdAt) : a.createdAt.localeCompare(b.createdAt));
  }, [category, from, query, sentiment, severity, sort, status, subcategory, to]);
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const visibleIssues = filtered.slice((page - 1) * pageSize, page * pageSize);
  const hasFilters = Boolean(query || category || subcategory || sentiment || severity || status || from || to);
  const clearFilters = () => { setQuery(''); setCategory(''); setSubcategory(''); setSentiment(''); setSeverity(''); setStatus(''); setFrom(''); setTo(''); setPage(1); };

  return <div className="app-shell issues-app">
    <aside className={`sidebar ${mobileNav ? 'mobile-open' : ''}`}><div className="brand"><span className="brand-mark"><Sparkles size={15} /></span><span>feedback<span className="brand-accent">desk</span></span></div><div className="workspace-switcher"><div className="workspace-icon">AC</div><div><strong>Acme Corp</strong><span>Product workspace</span></div><ChevronDown size={15} /></div><nav aria-label="Main navigation"><p className="nav-label">WORKSPACE</p>{navItems.map(({ label, href, icon: Icon, count }) => <Link key={label} href={href} className={`nav-item ${label === 'Issues' ? 'active' : ''}`}><Icon size={17} /><span>{label}</span>{count && <em>{count}</em>}</Link>)}<p className="nav-label section-label">MANAGE</p><button className="nav-item"><Tag size={17} /><span>Categories</span></button><button className="nav-item"><Users size={17} /><span>Team</span></button><button className="nav-item"><Settings size={17} /><span>Settings</span></button></nav><div className="sidebar-bottom"><div className="profile"><span className="avatar">KM</span><div><strong>Kate Miller</strong><span>Admin</span></div><MoreHorizontal size={16} /></div></div></aside>
    {mobileNav && <button className="scrim" aria-label="Close navigation" onClick={() => setMobileNav(false)} />}
    <main className="main-content"><header className="topbar"><button className="mobile-menu" onClick={() => setMobileNav(true)} aria-label="Open navigation"><Command size={19} /></button><div className="breadcrumbs"><span>Workspace</span><span>/</span><strong>Issues</strong></div><div className="top-actions"><button className="icon-button" aria-label="Help"><CircleHelp size={19} /></button><button className="icon-button notification" aria-label="Notifications"><Bell size={19} /><i /></button><span className="avatar top-user">KM</span></div></header>
      <div className="page-wrap issues-page"><section className="page-heading issues-page-heading"><div><p className="eyebrow">WORKSPACE / ISSUE MANAGEMENT</p><h1>Issues</h1><p className="subtitle">Search, triage, and understand every reported issue.</p></div><Link className="back-link" href="/"><ArrowLeft size={15} /> Overview</Link></section>
        {viewState === 'loading' ? <StatePanel type="loading" /> : viewState === 'error' ? <StatePanel type="error" onRetry={() => { setViewState('loading'); setRetryKey((value) => value + 1); }} /> : viewState === 'empty' ? <StatePanel type="empty" onRetry={() => { setViewState('loading'); setRetryKey((value) => value + 1); }} /> : <>
          <section className="issues-toolbar panel"><div className="issues-search search-box"><Search size={16} /><input value={query} onChange={(event) => { setQuery(event.target.value); setPage(1); }} placeholder="Search summary or original feedback..." aria-label="Search summary or original feedback" /></div><button className="filter-button"><ListFilter size={15} /> {filtered.length} issues</button><label className="sort-control">Sort by <select value={sort} onChange={(event) => { setSort(event.target.value as typeof sort); setPage(1); }}><option value="newest">Newest</option><option value="oldest">Oldest</option><option value="severity">Severity</option></select><ChevronDown size={13} /></label></section>
          <section className="filters-panel panel"><div className="filters-heading"><div><h2>Filter issues</h2><p>Refine the list by classification, status, or date.</p></div>{hasFilters && <button className="clear-button" onClick={clearFilters}><X size={13} /> Clear all filters</button>}</div><div className="filters-grid"><FilterSelect label="Category" value={category} options={categories} onChange={(value) => { setCategory(value as Category); setSubcategory(''); setPage(1); }} /><FilterSelect label="Sub-category" value={subcategory} options={subcategories} onChange={(value) => { setSubcategory(value); setPage(1); }} disabled={!subcategories.length} /><FilterSelect label="Sentiment" value={sentiment} options={sentiments} onChange={(value) => { setSentiment(value as Sentiment); setPage(1); }} /><FilterSelect label="Severity" value={severity} options={severities} onChange={(value) => { setSeverity(value as Severity); setPage(1); }} /><FilterSelect label="Status" value={status} options={statuses} onChange={(value) => { setStatus(value as Status); setPage(1); }} /><DateFilter label="Created from" value={from} onChange={(value) => { setFrom(value); setPage(1); }} /><DateFilter label="Created to" value={to} onChange={(value) => { setTo(value); setPage(1); }} /></div></section>
          <section className="panel issue-results"><div className="results-heading"><div><h2>All reported issues</h2><p>{filtered.length} matching issues</p></div><span className="result-meta">Page {page} of {totalPages}</span></div><div className="issues-table-wrap"><table className="issues-table"><thead><tr><th>ISSUE</th><th>ORIGINAL FEEDBACK</th><th>CATEGORY</th><th>SENTIMENT</th><th>SEVERITY</th><th>STATUS</th><th>CREATED</th><th>REFERENCE</th></tr></thead><tbody>{visibleIssues.map((issue) => <tr key={issue.id} onClick={() => setSelected(issue)} tabIndex={0} onKeyDown={(event) => event.key === 'Enter' && setSelected(issue)}><td><strong className="issue-id">{issue.id}</strong><span className="issue-summary">{issue.summary}</span></td><td><span className="feedback-preview">{issue.feedback}</span></td><td><Badge tone="tag-blue">{issue.category}</Badge><span className="subcat">{issue.subcategory}</span></td><td><Badge tone={`sentiment-${tone(issue.sentiment)}`}>{issue.sentiment}</Badge></td><td><Badge tone={`severity-${tone(issue.severity)}`}>{issue.severity}</Badge></td><td><Badge tone={`status-${tone(issue.status)}`}><i className="status-dot" />{issue.status}</Badge></td><td className="date-cell">{formatDate(issue.createdAt)}</td><td><span className="reference-cell">{issue.userReference}</span><span className="reference-cell">{issue.projectReference}</span></td></tr>)}</tbody></table>{visibleIssues.length === 0 && <div className="empty-state"><Inbox size={24} /><strong>No issues match these filters</strong><span>Clear a filter or try another search term.</span></div>}</div><Pagination page={page} totalPages={totalPages} onChange={setPage} /></section>
        </>}
      </div>
    </main>
    {selected && <IssueDetails issue={selected} onClose={() => setSelected(null)} />}
  </div>;
}

function FilterSelect({ label, value, options, onChange, disabled = false }: { label: string; value: string; options: readonly string[]; onChange: (value: string) => void; disabled?: boolean }) { return <label className="filter-field"><span>{label}</span><span className="select-wrap"><select value={value} onChange={(event) => onChange(event.target.value)} disabled={disabled}><option value="">All {label.toLowerCase()}</option>{options.map((option) => <option key={option} value={option}>{option}</option>)}</select><ChevronDown size={13} /></span></label> }
function DateFilter({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) { return <label className="filter-field"><span>{label}</span><span className="date-wrap"><input type="date" value={value} onChange={(event) => onChange(event.target.value)} /><CalendarDays size={14} /></span></label> }
function Pagination({ page, totalPages, onChange }: { page: number; totalPages: number; onChange: (page: number) => void }) { return <div className="pagination"><span>Showing page {page} of {totalPages}</span><div><button disabled={page === 1} onClick={() => onChange(page - 1)}>Previous</button>{Array.from({ length: totalPages }, (_, index) => index + 1).slice(0, 5).map((number) => <button key={number} className={page === number ? 'page-active' : ''} onClick={() => onChange(number)}>{number}</button>)}<button disabled={page === totalPages} onClick={() => onChange(page + 1)}>Next</button></div></div> }
function IssueDetails({ issue, onClose }: { issue: Issue; onClose: () => void }) { return <><button className="drawer-scrim" onClick={onClose} aria-label="Close issue details" /><aside className="issue-drawer" aria-label="Issue details"><div className="drawer-header"><div><span className="issue-id">{issue.id}</span><h2>{issue.summary}</h2></div><button className="drawer-close" onClick={onClose} aria-label="Close details"><X size={18} /></button></div><div className="drawer-body"><div className="drawer-badges"><Badge tone={`status-${tone(issue.status)}`}>{issue.status}</Badge><Badge tone={`severity-${tone(issue.severity)}`}>{issue.severity}</Badge><Badge tone={`sentiment-${tone(issue.sentiment)}`}>{issue.sentiment}</Badge></div><DetailBlock label="Original user feedback"><p className="feedback-quote">&ldquo;{issue.feedback}&rdquo;</p></DetailBlock><DetailBlock label="AI-generated summary"><p>{issue.summary}. The feedback was classified under {issue.category.toLowerCase()} and routed for team review.</p></DetailBlock><div className="detail-grid"><DetailItem label="Category" value={issue.category} /><DetailItem label="Sub-category" value={issue.subcategory} /><DetailItem label="AI confidence" value={`${Math.round(issue.confidence * 100)}%`} /><DetailItem label="Created" value={formatDate(issue.createdAt)} /></div><DetailBlock label="References"><div className="reference-list"><span><strong>Conversation</strong>{issue.conversationId}</span><span><strong>Project</strong>{issue.projectReference}</span><span><strong>User</strong>{issue.userReference}</span></div></DetailBlock><DetailBlock label="Metadata"><div className="metadata-list">{Object.entries(issue.metadata).map(([key, value]) => <span key={key}><strong>{key}</strong>{value}</span>)}</div></DetailBlock></div></aside></> }
function DetailBlock({ label, children }: { label: string; children: React.ReactNode }) { return <section className="detail-block"><h3>{label}</h3>{children}</section> }
function DetailItem({ label, value }: { label: string; value: string }) { return <div className="detail-item"><span>{label}</span><strong>{value}</strong></div> }
function StatePanel({ type, onRetry }: { type: 'loading' | 'empty' | 'error'; onRetry?: () => void }) { const content = { loading: ['Loading issues', 'Preparing the reported issue list.'], empty: ['No issues yet', 'There are no reported issues in this workspace.'], error: ['Could not load issues', 'Something went wrong while loading the issue list.'] }[type]; return <div className={`state-panel ${type}`}><span className="state-icon">{type === 'loading' ? <SlidersHorizontal /> : type === 'empty' ? <Inbox /> : <AlertCircle />}</span><strong>{content[0]}</strong><p>{content[1]}</p>{onRetry && <button className="secondary-button" onClick={onRetry}>Try again</button>}</div> }

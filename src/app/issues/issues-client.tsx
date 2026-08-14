'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { AlertCircle, ArrowLeft, Bell, CalendarDays, ChevronDown, CircleHelp, Command, Inbox, LayoutDashboard, ListFilter, MoreHorizontal, Search, SlidersHorizontal, Sparkles, X } from 'lucide-react';
import { fetchIssuePage } from '@/lib/feedback-api';

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
const navItems = [{ label: 'Overview', href: '/', icon: LayoutDashboard }, { label: 'Issues', href: '/issues', icon: Inbox }];
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
  const [issues, setIssues] = useState<Issue[]>([]);
  const [viewState, setViewState] = useState<ViewState>('loading');
  const [retryKey, setRetryKey] = useState(0);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const pageSize = 10;

  useEffect(() => {
    const controller = new AbortController();
    fetchIssuePage({ page, pageSize, search: query, category, subcategory, sentiment, severity, status, from, to, sort }, { signal: controller.signal }).then((result) => {
      setIssues(result.items);
      setTotal(result.pagination.total);
      setTotalPages(Math.max(1, result.pagination.totalPages));
      setViewState(result.items.length ? 'ready' : 'empty');
    }).catch((error: unknown) => {
      if (error instanceof DOMException && error.name === 'AbortError') return;
      setViewState('error');
    });
    return () => controller.abort();
  }, [category, from, page, pageSize, query, retryKey, sentiment, severity, sort, status, subcategory, to]);

  const subcategories = useMemo(() => [...new Set(issues.map((issue) => issue.subcategory))], [issues]);
  const filtered = issues;
  const visibleIssues = issues;
  const hasFilters = Boolean(query || category || subcategory || sentiment || severity || status || from || to);
  const clearFilters = () => { setQuery(''); setCategory(''); setSubcategory(''); setSentiment(''); setSeverity(''); setStatus(''); setFrom(''); setTo(''); setPage(1); };

  return <div className="app-shell issues-app">
    <aside className={`sidebar ${mobileNav ? 'mobile-open' : ''}`}><div className="brand"><span className="brand-mark"><Sparkles size={15} /></span><span>feedback<span className="brand-accent">desk</span></span></div><div className="workspace-switcher"><div className="workspace-icon">RA</div><div><strong>Revolte.AI</strong><span>Product workspace</span></div><ChevronDown size={15} /></div><nav aria-label="Main navigation"><p className="nav-label">WORKSPACE</p>{navItems.map(({ label, href, icon: Icon }) => <Link key={label} href={href} className={`nav-item ${label === 'Issues' ? 'active' : ''}`}><Icon size={17} /><span>{label}</span>{label === 'Issues' && <em>{issues.length}</em>}</Link>)}</nav><div className="sidebar-bottom"><div className="profile"><span className="avatar">VP</span><div><strong>VInod Prakash</strong><span>Admin</span></div><MoreHorizontal size={16} /></div></div></aside>
    {mobileNav && <button className="scrim" aria-label="Close navigation" onClick={() => setMobileNav(false)} />}
    <main className="main-content"><header className="topbar"><button className="mobile-menu" onClick={() => setMobileNav(true)} aria-label="Open navigation"><Command size={19} /></button><div className="breadcrumbs"><span>Workspace</span><span>/</span><strong>Issues</strong></div><div className="top-actions"><button className="icon-button" aria-label="Help"><CircleHelp size={19} /></button><button className="icon-button notification" aria-label="Notifications"><Bell size={19} /><i /></button><span className="avatar top-user">VP</span></div></header>
      <div className="page-wrap issues-page"><section className="page-heading issues-page-heading"><div><p className="eyebrow">WORKSPACE / ISSUE MANAGEMENT</p><h1>Issues</h1><p className="subtitle">Search, triage, and understand every reported issue.</p></div><Link className="back-link" href="/"><ArrowLeft size={15} /> Overview</Link></section>
        {viewState === 'loading' ? <StatePanel type="loading" /> : viewState === 'error' ? <StatePanel type="error" onRetry={() => { setViewState('loading'); setRetryKey((value) => value + 1); }} /> : viewState === 'empty' ? <StatePanel type="empty" onRetry={() => { setViewState('loading'); setRetryKey((value) => value + 1); }} /> : <>
          <section className="issues-toolbar panel"><div className="issues-search search-box"><Search size={16} /><input value={query} onChange={(event) => { setQuery(event.target.value); setPage(1); }} placeholder="Search summary or original feedback..." aria-label="Search summary or original feedback" /></div><button className="filter-button"><ListFilter size={15} /> {total} issues</button><label className="sort-control">Sort by <select value={sort} onChange={(event) => { setSort(event.target.value as typeof sort); setPage(1); }}><option value="newest">Newest</option><option value="oldest">Oldest</option><option value="severity">Severity</option></select><ChevronDown size={13} /></label></section>
          <section className="filters-panel panel"><div className="filters-heading"><div><h2>Filter issues</h2><p>Refine the list by classification, status, or date.</p></div>{hasFilters && <button className="clear-button" onClick={clearFilters}><X size={13} /> Clear all filters</button>}</div><div className="filters-grid"><FilterSelect label="Category" value={category} options={categories} onChange={(value) => { setCategory(value as Category); setSubcategory(''); setPage(1); }} /><FilterSelect label="Sub-category" value={subcategory} options={subcategories} onChange={(value) => { setSubcategory(value); setPage(1); }} disabled={!subcategories.length} /><FilterSelect label="Sentiment" value={sentiment} options={sentiments} onChange={(value) => { setSentiment(value as Sentiment); setPage(1); }} /><FilterSelect label="Severity" value={severity} options={severities} onChange={(value) => { setSeverity(value as Severity); setPage(1); }} /><FilterSelect label="Status" value={status} options={statuses} onChange={(value) => { setStatus(value as Status); setPage(1); }} /><DateFilter label="Created from" value={from} onChange={(value) => { setFrom(value); setPage(1); }} /><DateFilter label="Created to" value={to} onChange={(value) => { setTo(value); setPage(1); }} /></div></section>
          <section className="panel issue-results"><div className="results-heading"><div><h2>All reported issues</h2><p>{total} matching issues</p></div><span className="result-meta">Page {page} of {totalPages}</span></div><div className="issues-table-wrap"><table className="issues-table"><thead><tr><th>ISSUE</th><th>ORIGINAL FEEDBACK</th><th>CATEGORY</th><th>SENTIMENT</th><th>SEVERITY</th><th>STATUS</th><th>CREATED</th><th>REFERENCE</th></tr></thead><tbody>{visibleIssues.map((issue) => <tr key={issue.id} onClick={() => setSelected(issue)} tabIndex={0} onKeyDown={(event) => event.key === 'Enter' && setSelected(issue)}><td><strong className="issue-id">{issue.id}</strong><span className="issue-summary">{issue.summary}</span></td><td><span className="feedback-preview">{issue.feedback}</span></td><td><Badge tone="tag-blue">{issue.category}</Badge><span className="subcat">{issue.subcategory}</span></td><td><Badge tone={`sentiment-${tone(issue.sentiment)}`}>{issue.sentiment}</Badge></td><td><Badge tone={`severity-${tone(issue.severity)}`}>{issue.severity}</Badge></td><td><Badge tone={`status-${tone(issue.status)}`}><i className="status-dot" />{issue.status}</Badge></td><td className="date-cell">{formatDate(issue.createdAt)}</td><td><span className="reference-cell">{issue.userReference}</span><span className="reference-cell">{issue.projectReference}</span></td></tr>)}</tbody></table>{visibleIssues.length === 0 && <div className="empty-state"><Inbox size={24} /><strong>No issues match these filters</strong><span>Clear a filter or try another search term.</span></div>}</div><Pagination page={page} totalPages={totalPages} onChange={setPage} /></section>
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

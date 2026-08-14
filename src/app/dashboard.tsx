'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { AlertCircle, BarChart3, Bell, Check, ChevronDown, CircleHelp, Clock3, Command, Inbox, LayoutDashboard, ListFilter, MessageSquare, MoreHorizontal, Search, Settings, SlidersHorizontal, Sparkles, Tag, Users, Zap } from 'lucide-react';
import { fetchIssues, submitFeedback, type Category, type DashboardIssue as Issue, type Sentiment, type Severity } from '@/lib/feedback-api';

type DashboardState = 'ready' | 'loading' | 'empty' | 'error';
type Distribution = { label: string; value: number; color: string };

const categories: Category[] = ['Application Generation', 'AI Response', 'Build Failure', 'UI/UX', 'Authentication', 'Performance', 'Integration', 'Other'];
const sentiments: Sentiment[] = ['Positive', 'Neutral', 'Negative', 'Frustrated'];
const severities: Severity[] = ['Low', 'Medium', 'High', 'Critical'];

const navItems = [{ label: 'Overview', href: '/', icon: LayoutDashboard }, { label: 'Issue list', href: '/issues', icon: Inbox, count: '24' }, { label: 'Feedback', href: '/issues', icon: MessageSquare }, { label: 'Insights', href: '/', icon: BarChart3 }];
const categoryColors = ['#3468f5', '#8c6af5', '#f19a38', '#e86b91', '#32a78d', '#e56d61', '#55a2d8', '#a9b1bf'];
const sentimentColors = ['#3eae83', '#9aa4b5', '#e46e66', '#ed9a3c'];
const severityColors = ['#8db4f7', '#f0bd62', '#eb7c6c', '#bd5377'];

function Avatar({ initials }: { initials: string }) { return <span className="avatar small-avatar">{initials}</span>; }
function Badge({ children, tone }: { children: React.ReactNode; tone: string }) { return <span className={`badge ${tone}`}>{children}</span>; }

export default function Dashboard() {
  const [mobileNav, setMobileNav] = useState(false);
  const [query, setQuery] = useState('');
  const [selectedMetric, setSelectedMetric] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<Category | ''>('');
  const [selectedSentiment, setSelectedSentiment] = useState<Sentiment | ''>('');
  const [selectedSeverity, setSelectedSeverity] = useState<Severity | ''>('');
  const [issues, setIssues] = useState<Issue[]>([]);
  const [viewState, setViewState] = useState<DashboardState>('loading');
  const [notice, setNotice] = useState(false);
  const [retryKey, setRetryKey] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    setViewState('loading');
    fetchIssues({ signal: controller.signal }).then((nextIssues) => {
      setIssues(nextIssues);
      setViewState(nextIssues.length === 0 ? 'empty' : 'ready');
    }).catch((error: unknown) => {
      if (error instanceof DOMException && error.name === 'AbortError') return;
      setViewState('error');
    });
    return () => controller.abort();
  }, [retryKey]);

  const filteredIssues = useMemo(() => issues.filter((issue) => issue.title.toLowerCase().includes(query.toLowerCase()) && (!selectedCategory || issue.category === selectedCategory) && (!selectedSentiment || issue.sentiment === selectedSentiment) && (!selectedSeverity || issue.severity === selectedSeverity) && (!selectedMetric || (selectedMetric === 'Total issues' || selectedMetric === 'Open issues' ? issue.status === 'Open' : selectedMetric === 'Resolved issues' ? issue.status === 'Resolved' : selectedMetric === 'Critical issues' ? issue.severity === 'Critical' : selectedMetric === 'High-severity issues' ? issue.severity === 'High' : issue.sentiment === 'Negative'))), [issues, query, selectedCategory, selectedSentiment, selectedSeverity, selectedMetric]);
  const issueCount = issues.length;
  const openCount = issues.filter((issue) => issue.status === 'Open').length;
  const resolvedCount = issues.filter((issue) => issue.status === 'Resolved').length;
  const criticalCount = issues.filter((issue) => issue.severity === 'Critical').length;
  const highCount = issues.filter((issue) => issue.severity === 'High').length;
  const negativeCount = issues.filter((issue) => issue.sentiment === 'Negative').length;
  const categoryData = categories.map((label, index) => ({ label, value: issues.filter((issue) => issue.category === label).length, color: categoryColors[index] }));
  const sentimentData = sentiments.map((label, index) => ({ label, value: issues.filter((issue) => issue.sentiment === label).length, color: sentimentColors[index] }));
  const severityData = severities.map((label, index) => ({ label, value: issues.filter((issue) => issue.severity === label).length, color: severityColors[index] }));

  return <div className="app-shell">
    <aside className={`sidebar ${mobileNav ? 'mobile-open' : ''}`}>
      <div className="brand"><span className="brand-mark"><Sparkles size={15} /></span><span>feedback<span className="brand-accent">desk</span></span></div>
      <div className="workspace-switcher"><div className="workspace-icon">AC</div><div><strong>Acme Corp</strong><span>Product workspace</span></div><ChevronDown size={15} /></div>
      <nav aria-label="Main navigation"><p className="nav-label">WORKSPACE</p>{navItems.map(({ label, href, icon: Icon, count }) => <Link key={label} href={href} className={`nav-item ${label === 'Overview' ? 'active' : ''}`}><Icon size={17} /><span>{label}</span>{count && <em>{count}</em>}</Link>)}<p className="nav-label section-label">MANAGE</p><button className="nav-item"><Tag size={17} /><span>Categories</span></button><button className="nav-item"><Users size={17} /><span>Team</span></button><button className="nav-item"><Settings size={17} /><span>Settings</span></button></nav>
      <div className="sidebar-bottom"><div className="profile"><Avatar initials="KM" /><div><strong>Kate Miller</strong><span>Admin</span></div><MoreHorizontal size={16} /></div></div>
    </aside>
    {mobileNav && <button className="scrim" aria-label="Close navigation" onClick={() => setMobileNav(false)} />}
    <main className="main-content">
      <header className="topbar"><button className="mobile-menu" onClick={() => setMobileNav(true)} aria-label="Open navigation"><Command size={19} /></button><div className="breadcrumbs"><span>Workspace</span><span>/</span><strong>Dashboard</strong></div><div className="top-actions"><button className="icon-button" aria-label="Help"><CircleHelp size={19} /></button><button className="icon-button notification" aria-label="Notifications" onClick={() => setNotice(!notice)}><Bell size={19} /><i /></button><div className="top-avatar"><Avatar initials="KM" /></div></div></header>
      {notice && <div className="notification-popover"><strong>Notifications</strong><p>3 new feedback items need triage.</p><button onClick={() => setNotice(false)}>Dismiss</button></div>}
      <div className="page-wrap">
        <section className="page-heading"><div><p className="eyebrow">AI FEEDBACK ANALYZER / OVERVIEW</p><h1>Issue overview <span>✦</span></h1><p className="subtitle">A shared view of what users are reporting across the product.</p></div><div className="heading-actions"><FeedbackComposer /><div className="state-controls"><label htmlFor="view-state">Demo state</label><select id="view-state" value={viewState} onChange={(event) => setViewState(event.target.value as DashboardState)}><option value="ready">Ready</option><option value="loading">Loading</option><option value="empty">Empty</option><option value="error">Error</option></select></div></div></section>
        {viewState === 'loading' ? <StatePanel type="loading" /> : viewState === 'error' ? <StatePanel type="error" onRetry={() => { setViewState('loading'); setRetryKey((value) => value + 1); }} /> : viewState === 'empty' ? <StatePanel type="empty" onRetry={() => { setViewState('loading'); setRetryKey((value) => value + 1); }} /> : <>
          <section className="metric-grid" aria-label="Issue summary"><Metric label="Total issues" value={issueCount.toLocaleString()} change="12.5%" tone="blue" icon={<MessageSquare size={18} />} onClick={() => { setSelectedMetric('Total issues'); document.getElementById('issues')?.scrollIntoView({ behavior: 'smooth' }); }} /><Metric label="Open issues" value={openCount.toLocaleString()} change="8.2%" tone="orange" icon={<AlertCircle size={18} />} onClick={() => { setSelectedMetric('Open issues'); document.getElementById('issues')?.scrollIntoView({ behavior: 'smooth' }); }} /><Metric label="Resolved issues" value={resolvedCount.toLocaleString()} change="18.4%" tone="green" icon={<Check size={18} />} onClick={() => { setSelectedMetric('Resolved issues'); document.getElementById('issues')?.scrollIntoView({ behavior: 'smooth' }); }} /><Metric label="Critical issues" value={criticalCount.toLocaleString()} change="3.1%" tone="red" icon={<Zap size={18} />} onClick={() => { setSelectedMetric('Critical issues'); document.getElementById('issues')?.scrollIntoView({ behavior: 'smooth' }); }} /><Metric label="High-severity issues" value={highCount.toLocaleString()} change="5.7%" tone="violet" icon={<BarChart3 size={18} />} onClick={() => { setSelectedMetric('High-severity issues'); document.getElementById('issues')?.scrollIntoView({ behavior: 'smooth' }); }} /><Metric label="Negative sentiment" value={negativeCount.toLocaleString()} change="6.4%" tone="pink" icon={<MessageSquare size={18} />} onClick={() => { setSelectedMetric('Negative sentiment'); document.getElementById('issues')?.scrollIntoView({ behavior: 'smooth' }); }} /></section>
          <section className="chart-grid"><DistributionPanel title="Issues by category" subtitle="Where issues are concentrated" data={categoryData} onSelect={(value) => setSelectedCategory(selectedCategory === value as Category ? '' : value as Category)} selected={selectedCategory} /><DistributionPanel title="Issues by sentiment" subtitle="How users are feeling" data={sentimentData} onSelect={(value) => setSelectedSentiment(selectedSentiment === value as Sentiment ? '' : value as Sentiment)} selected={selectedSentiment} /><DistributionPanel title="Issues by severity" subtitle="Impact across reported issues" data={severityData} onSelect={(value) => setSelectedSeverity(selectedSeverity === value as Severity ? '' : value as Severity)} selected={selectedSeverity} /></section>
          <section className="panel timeline-panel"><div className="panel-heading"><div><h2>Issues reported over time</h2><p>Incoming issue volume across the last 30 days</p></div><button className="select-button">Last 30 days <ChevronDown size={14} /></button></div><TimelineChart /></section>
          <section className="panel issues-panel" id="issues"><div className="issues-heading"><div><h2>{selectedMetric || selectedCategory || selectedSentiment || selectedSeverity || 'Recent issues'}</h2><p>Click a summary card or chart segment to filter this list.</p></div><button className="secondary-button" onClick={() => { setSelectedMetric(''); setSelectedCategory(''); setSelectedSentiment(''); setSelectedSeverity(''); setQuery(''); }}><SlidersHorizontal size={16} /> Clear filters</button></div><div className="table-toolbar"><div className="search-box"><Search size={16} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search reported issues..." aria-label="Search reported issues" /></div><button className="filter-button"><ListFilter size={15} /> Recent <ChevronDown size={14} /></button></div><IssueTable issues={filteredIssues} /></section>
        </>}
      </div>
    </main>
  </div>;
}

function FeedbackComposer() {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [error, setError] = useState('');

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus('submitting');
    setError('');
    try {
      await submitFeedback({ message, source: 'feedback-desk', page_url: window.location.pathname, user_agent: navigator.userAgent });
      setMessage('');
      setStatus('success');
    } catch (submissionError) {
      setStatus('error');
      setError(submissionError instanceof Error ? submissionError.message : 'Unable to submit feedback.');
    }
  }

  return <><button className="primary-button" onClick={() => { setOpen(true); setStatus('idle'); }}><MessageSquare size={16} /> Submit feedback</button>{open && <div className="composer-scrim"><section className="feedback-composer" role="dialog" aria-modal="true" aria-labelledby="feedback-composer-title"><div className="composer-header"><div><p className="eyebrow">SEND TO FEEDBACK API</p><h2 id="feedback-composer-title">Submit user feedback</h2></div><button className="drawer-close" onClick={() => setOpen(false)} aria-label="Close feedback form">×</button></div><form onSubmit={handleSubmit}><label htmlFor="feedback-message">Feedback message</label><textarea id="feedback-message" value={message} onChange={(event) => setMessage(event.target.value)} placeholder="Describe the issue reported by the user..." minLength={1} maxLength={20000} required /><div className="composer-footer"><span>{status === 'success' ? 'Feedback received.' : status === 'error' ? error : 'POST /api/v1/feedback'}</span><button className="primary-button" type="submit" disabled={status === 'submitting'}>{status === 'submitting' ? 'Submitting…' : 'Submit feedback'}</button></div></form></section></div>}</>;
}

function Metric({ label, value, change, tone, icon, onClick }: { label: string; value: string; change: string; tone: string; icon: React.ReactNode; onClick: () => void }) { return <button className="metric-card" onClick={onClick}><div className="metric-top"><span>{label}</span><span className={`metric-icon ${tone}`}>{icon}</span></div><strong>{value}</strong><div className="metric-change"><span className="positive">↑ {change}</span><span>vs. last period</span></div><span className="metric-hint">View issues →</span></button> }
function DistributionPanel({ title, subtitle, data, onSelect, selected }: { title: string; subtitle: string; data: Distribution[]; onSelect: (value: string) => void; selected: string }) { const max = Math.max(...data.map((item) => item.value)); return <div className="panel distribution-panel"><div className="panel-heading"><div><h2>{title}</h2><p>{subtitle}</p></div><BarChart3 size={17} className="panel-icon" /></div><div className="distribution-list">{data.map((item) => <button className={`distribution-row ${selected === item.label ? 'selected' : ''}`} key={item.label} onClick={() => onSelect(item.label)}><span className="distribution-name"><i style={{ background: item.color }} />{item.label}</span><span className="distribution-bar"><i style={{ width: `${Math.max(8, item.value / max * 100)}%`, background: item.color }} /></span><strong>{item.value}</strong></button>)}</div></div> }
function TimelineChart() { return <div className="timeline-chart"><div className="timeline-y"><span>120</span><span>80</span><span>40</span><span>0</span></div><div className="timeline-area"><div className="grid-lines"><i /><i /><i /><i /></div><svg viewBox="0 0 900 210" preserveAspectRatio="none" role="img" aria-label="Issues reported over time"><defs><linearGradient id="timelineFill" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stopColor="#3468f5" stopOpacity=".18" /><stop offset="100%" stopColor="#3468f5" stopOpacity="0" /></linearGradient></defs><path d="M0,157 C45,149 58,169 92,147 S149,114 183,136 S236,141 273,109 S325,123 364,98 S415,137 451,105 S502,76 540,93 S587,117 623,68 S672,92 712,57 S765,70 804,42 S852,69 900,25 L900,210 L0,210 Z" fill="url(#timelineFill)" /><path d="M0,157 C45,149 58,169 92,147 S149,114 183,136 S236,141 273,109 S325,123 364,98 S415,137 451,105 S502,76 540,93 S587,117 623,68 S672,92 712,57 S765,70 804,42 S852,69 900,25" fill="none" stroke="#3468f5" strokeWidth="3" /></svg><div className="x-axis"><span>Sep 25</span><span>Oct 1</span><span>Oct 7</span><span>Oct 13</span><span>Oct 19</span><span>Oct 24</span></div></div></div> }
function IssueTable({ issues: filteredIssues }: { issues: Issue[] }) { return filteredIssues.length === 0 ? <div className="empty-state"><Inbox size={24} /><strong>No issues match these filters</strong><span>Try clearing a filter or using a different search term.</span></div> : <div className="table-wrap"><table><thead><tr><th>ISSUE</th><th>CATEGORY</th><th>SENTIMENT</th><th>SEVERITY</th><th>STATUS</th><th>ASSIGNEE</th><th></th></tr></thead><tbody>{filteredIssues.map((issue) => <tr key={issue.id}><td><div className="issue-title"><strong>{issue.title}</strong><span>{issue.id} · {issue.time}</span></div></td><td><Badge tone="tag-blue">{issue.category}</Badge></td><td><Badge tone={`sentiment-${issue.sentiment.toLowerCase()}`}>{issue.sentiment}</Badge></td><td><Badge tone={`severity-${issue.severity.toLowerCase()}`}>{issue.severity}</Badge></td><td><Badge tone={issue.status === 'Open' ? 'open' : 'resolved'}><i className="status-dot" />{issue.status}</Badge></td><td><div className="assignee"><Avatar initials={issue.initials} /><span>{issue.assignee}</span></div></td><td><button className="row-more" aria-label={`More actions for ${issue.id}`}><MoreHorizontal size={17} /></button></td></tr>)}</tbody></table></div> }
function StatePanel({ type, onRetry }: { type: 'loading' | 'empty' | 'error'; onRetry?: () => void }) { const content = { loading: { icon: <Clock3 />, title: 'Loading dashboard data', body: 'Preparing the latest issue summary.' }, empty: { icon: <Inbox />, title: 'No issue data yet', body: 'There are no reported issues to show for this workspace.' }, error: { icon: <AlertCircle />, title: 'Could not load dashboard data', body: 'The dashboard data source is unavailable. Try again.' } }[type]; return <div className={`state-panel ${type}`}><span className="state-icon">{content.icon}</span><strong>{content.title}</strong><p>{content.body}</p>{onRetry && <button className="secondary-button" onClick={onRetry}>Try again</button>}</div> }

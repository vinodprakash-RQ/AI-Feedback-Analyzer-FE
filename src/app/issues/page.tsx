import IssuesClient from './issues-client';

export const metadata = { title: 'Issues | Feedback Desk', description: 'Browse and triage reported issues' };

export default function IssuesPage() {
  return <IssuesClient />;
}

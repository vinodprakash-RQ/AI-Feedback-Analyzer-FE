import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = { title: 'Feedback Desk', description: 'Internal user feedback and issue management' };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}

import { Metadata } from 'next';
import NotificationsPageClient from './notifications-client';

export const metadata: Metadata = {
  title: 'Notifications | Luna Careers',
  description: 'View your notifications and stay updated',
};

export default function NotificationsPage() {
  return <NotificationsPageClient />;
}


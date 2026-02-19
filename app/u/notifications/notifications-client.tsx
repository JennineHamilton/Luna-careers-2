'use client';

import { useState, useEffect } from 'react';
import { Bell, Sparkles, Award, AlertCircle, GraduationCap, CheckCircle, Trash2, Filter } from 'lucide-react';
import {
  LunaCard,
  LunaCardHeader,
  LunaCardTitle,
  LunaCardSubtitle,
  LunaCardContent,
  LunaButton,
  LunaBadge,
  LunaSkeletonCard,
  LunaEmptyState,
} from '@/components/luna';
import { formatDistanceToNow } from 'date-fns';
import { useRouter } from 'next/navigation';
import { TransactionHistoryModal } from '@/components/luna/learning/modals/transaction-history-modal';

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  action_url: string | null;
  action_label: string | null;
  is_read: boolean;
  created_at: string;
  metadata?: {
    complimentary_credits?: number;
    account_type?: string;
  };
}

export default function NotificationsPageClient() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const [showTransactionHistory, setShowTransactionHistory] = useState(false);
  const router = useRouter();

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/notifications?limit=100');
      if (response.ok) {
        const data = await response.json();
        setNotifications(data.notifications || []);
      }
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (id: string) => {
    try {
      await fetch(`/api/notifications/${id}`, {
        method: 'PATCH',
      });
      setNotifications(prev =>
        prev.map(n => n.id === id ? { ...n, is_read: true } : n)
      );
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      const unreadIds = notifications.filter(n => !n.is_read).map(n => n.id);
      await Promise.all(
        unreadIds.map(id => fetch(`/api/notifications/${id}`, { method: 'PATCH' }))
      );
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    } catch (error) {
      console.error('Failed to mark all as read:', error);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await fetch(`/api/notifications/${id}`, {
        method: 'DELETE',
      });
      setNotifications(prev => prev.filter(n => n.id !== id));
    } catch (error) {
      console.error('Failed to delete notification:', error);
    }
  };

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.is_read) {
      handleMarkAsRead(notification.id);
    }

    if (notification.type === 'welcome') {
      setShowTransactionHistory(true);
    } else if (notification.action_url) {
      router.push(notification.action_url);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'welcome':
        return <Sparkles className="w-4 h-4 text-luna-gray-600" />;
      case 'scholarship_approved':
        return <Award className="w-4 h-4 text-luna-gray-600" />;
      case 'scholarship_rejected':
        return <AlertCircle className="w-4 h-4 text-luna-gray-600" />;
      case 'enrollment_confirmed':
      case 'payment_approved':
        return <GraduationCap className="w-4 h-4 text-luna-gray-600" />;
      default:
        return <Bell className="w-4 h-4 text-luna-gray-600" />;
    }
  };

  const filteredNotifications = filter === 'unread'
    ? notifications.filter(n => !n.is_read)
    : notifications;

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <LunaCard>
          <LunaCardHeader>
            <div className="flex items-start justify-between">
              <div>
                <LunaCardTitle className="flex items-center gap-2">
                  <Bell className="w-5 h-5" />
                  Notifications
                  {unreadCount > 0 && (
                    <LunaBadge variant="primary">{unreadCount} new</LunaBadge>
                  )}
                </LunaCardTitle>
                <LunaCardSubtitle>
                  Stay updated with your latest activities and announcements
                </LunaCardSubtitle>
              </div>
              <div className="flex items-center gap-2">
                {/* Filter Buttons */}
                <LunaButton
                  variant={filter === 'all' ? 'primary' : 'outline'}
                  size="sm"
                  onClick={() => setFilter('all')}
                >
                  All
                </LunaButton>
                <LunaButton
                  variant={filter === 'unread' ? 'primary' : 'outline'}
                  size="sm"
                  onClick={() => setFilter('unread')}
                >
                  Unread
                </LunaButton>
                {unreadCount > 0 && (
                  <LunaButton
                    variant="ghost"
                    size="sm"
                    onClick={handleMarkAllAsRead}
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Mark all read
                  </LunaButton>
                )}
              </div>
            </div>
          </LunaCardHeader>
        </LunaCard>

        {/* Notifications List */}
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map(i => (
              <LunaSkeletonCard key={i} />
            ))}
          </div>
        ) : filteredNotifications.length === 0 ? (
          <LunaEmptyState
            icon={Bell}
            title={filter === 'unread' ? 'No unread notifications' : 'No notifications yet'}
            description={filter === 'unread' ? 'All caught up! You have no unread notifications.' : 'We\'ll notify you when something arrives'}
          />
        ) : (
          <LunaCard>
            <LunaCardContent className="p-0">
              <div className="divide-y divide-luna-border-light">
                {filteredNotifications.map((notification) => {
                  return (
                    <div
                      key={notification.id}
                      className={`flex items-start gap-3 px-4 py-4 transition-all ${
                        !notification.is_read ? 'bg-blue-50/30' : 'bg-white'
                      }`}
                    >
                      {/* Icon */}
                      <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center bg-luna-gray-100 rounded-lg">
                        {getNotificationIcon(notification.type)}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <h3 className={`text-sm leading-tight ${!notification.is_read ? 'font-semibold text-luna-gray-900' : 'font-medium text-luna-gray-700'}`}>
                            {notification.title}
                          </h3>
                          {!notification.is_read && (
                            <div className="flex-shrink-0 w-2 h-2 bg-luna-blue rounded-full mt-1" />
                          )}
                        </div>
                        <p className="text-xs text-luna-gray-600 leading-snug mb-2">
                          {notification.message}{' '}
                          {notification.type === 'welcome' && notification.action_label && (
                            <span
                              onClick={() => handleNotificationClick(notification)}
                              className="text-luna-blue hover:text-luna-navy font-medium hover:underline cursor-pointer"
                            >
                              {notification.action_label}
                            </span>
                          )}
                        </p>
                        <div className="flex items-center justify-between gap-3">
                          <span className="text-xs text-luna-gray-500">
                            {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                          </span>
                          <div className="flex items-center gap-2">
                            {notification.action_url && (
                              <button
                                onClick={() => handleNotificationClick(notification)}
                                className="text-xs font-medium text-luna-blue hover:text-luna-navy hover:underline"
                              >
                                {notification.action_label || 'View'} →
                              </button>
                            )}
                            {!notification.is_read && (
                              <button
                                onClick={() => handleMarkAsRead(notification.id)}
                                className="text-xs text-luna-gray-500 hover:text-luna-gray-700"
                                title="Mark as read"
                              >
                                <CheckCircle className="w-4 h-4" />
                              </button>
                            )}
                            <button
                              onClick={() => handleDelete(notification.id)}
                              className="text-xs text-luna-gray-500 hover:text-red-600"
                              title="Delete"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </LunaCardContent>
          </LunaCard>
        )}
      </div>

      {/* Transaction History Modal */}
      <TransactionHistoryModal
        open={showTransactionHistory}
        onOpenChange={setShowTransactionHistory}
      />
    </>
  );
}


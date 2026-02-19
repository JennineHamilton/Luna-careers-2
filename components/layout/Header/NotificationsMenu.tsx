'use client';

import { useState, useEffect } from 'react';
import { Bell, Award, AlertCircle, GraduationCap, Sparkles } from 'lucide-react';
import {
  LunaDropdownMenu,
  LunaDropdownMenuTrigger,
  LunaDropdownMenuContent,
} from '@/components/luna';
import { useRouter } from 'next/navigation';
import { formatDistanceToNow } from 'date-fns';
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

export default function NotificationsMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedNotificationId, setExpandedNotificationId] = useState<string | null>(null);
  const [showTransactionHistory, setShowTransactionHistory] = useState(false);
  const router = useRouter();

  // Fetch notifications when component mounts or dropdown opens
  useEffect(() => {
    if (isOpen) {
      fetchNotifications();
    }
  }, [isOpen]);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/notifications?limit=10');
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

  const handleNotificationClick = async (notification: Notification) => {
    // Mark as read
    if (!notification.is_read) {
      try {
        await fetch(`/api/notifications/${notification.id}`, {
          method: 'PATCH',
        });
        // Update local state
        setNotifications(prev =>
          prev.map(n => n.id === notification.id ? { ...n, is_read: true } : n)
        );
      } catch (error) {
        console.error('Failed to mark notification as read:', error);
      }
    }

    // Navigate to action URL if available, otherwise expand/collapse
    if (notification.action_url) {
      setIsOpen(false);
      router.push(notification.action_url);
    } else {
      setExpandedNotificationId(prev => prev === notification.id ? null : notification.id);
    }
  };

  const handleViewCredits = () => {
    setIsOpen(false);
    setShowTransactionHistory(true);
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

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return (
    <>
    <LunaDropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <LunaDropdownMenuTrigger asChild>
        <button
          className="relative flex items-center justify-center w-[30px] h-[30px] bg-luna-gray-50 hover:bg-luna-gray-100 rounded-md transition-colors"
          aria-label={`Notifications (${unreadCount} unread)`}
        >
          <Bell className="w-[18px] h-[18px] text-luna-gray-600" />
          {unreadCount > 0 && (
            <div className="absolute top-0 right-0 w-1.5 h-1.5 bg-luna-error rounded-full border border-white" />
          )}
        </button>
      </LunaDropdownMenuTrigger>

      <LunaDropdownMenuContent className="w-[400px] p-0" align="end">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-luna-border-default bg-white">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold text-luna-gray-900">Notifications</h3>
            {unreadCount > 0 && (
              <span className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 text-xs font-medium text-white bg-luna-blue rounded-full">
                {unreadCount}
              </span>
            )}
          </div>
        </div>

        {/* Notifications List */}
        <div className="max-h-[450px] overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-6 h-6 border-2 border-luna-gray-300 border-t-luna-blue rounded-full animate-spin" />
            </div>
          ) : notifications.length === 0 ? (
            <div className="text-center py-12 px-4">
              <div className="w-12 h-12 bg-luna-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Bell className="w-6 h-6 text-luna-gray-400" />
              </div>
              <p className="text-sm font-medium text-luna-gray-900 mb-1">No notifications yet</p>
              <p className="text-xs text-luna-gray-500">We'll notify you when something arrives</p>
            </div>
          ) : (
            <div className="divide-y divide-luna-border-light">
              {notifications.map((notification) => {
                const isExpanded = expandedNotificationId === notification.id;
                return (
                  <button
                    key={notification.id}
                    onClick={() => handleNotificationClick(notification)}
                    className={`w-full flex items-start gap-3 px-4 py-3 text-left transition-all hover:bg-luna-gray-50 ${
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
                        <h4 className={`text-sm leading-tight ${!notification.is_read ? 'font-semibold text-luna-gray-900' : 'font-medium text-luna-gray-700'}`}>
                          {notification.title}
                        </h4>
                        {!notification.is_read && (
                          <div className="flex-shrink-0 w-2 h-2 bg-luna-blue rounded-full mt-1" />
                        )}
                      </div>
                      <p className={`text-xs text-luna-gray-600 leading-snug mb-1.5 ${isExpanded ? '' : 'line-clamp-2'}`}>
                        {notification.message}{' '}
                        {notification.type === 'welcome' && notification.action_label && isExpanded && (
                          <span
                            onClick={(e) => {
                              e.stopPropagation();
                              handleViewCredits();
                            }}
                            className="text-luna-blue hover:text-luna-navy font-medium hover:underline cursor-pointer"
                          >
                            {notification.action_label}
                          </span>
                        )}
                      </p>
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs text-luna-gray-500">
                          {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                        </span>
                        {notification.action_url && (
                          <span className="text-xs font-medium text-luna-blue">
                            {notification.action_label || 'View'} →
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        {notifications.length > 0 && (
          <div className="px-4 py-2.5 border-t border-luna-border-default bg-luna-gray-50">
            <button
              onClick={() => {
                setIsOpen(false);
                router.push('/u/notifications');
              }}
              className="w-full text-center text-xs font-medium text-luna-blue hover:text-luna-navy transition-colors py-1"
            >
              View all notifications
            </button>
          </div>
        )}
      </LunaDropdownMenuContent>
    </LunaDropdownMenu>

    {/* Transaction History Modal */}
    <TransactionHistoryModal
      open={showTransactionHistory}
      onOpenChange={setShowTransactionHistory}
    />
    </>
  );
}


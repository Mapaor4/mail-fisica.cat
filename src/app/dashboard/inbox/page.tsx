'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Header from '@/components/Header';
import EmailList from '@/components/EmailList';
import EmailDetail from '@/components/EmailDetail';
import { Email } from '@/lib/types';

type NotificationPermissionState = 'default' | 'granted' | 'denied' | 'unsupported';

export default function InboxPage() {
  const [emails, setEmails] = useState<Email[]>([]);
  const [selectedEmail, setSelectedEmail] = useState<Email | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showEmailList, setShowEmailList] = useState(true);
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermissionState>('default');
  const [isEnablingNotifications, setIsEnablingNotifications] = useState(false);
  const seenEmailIdsRef = useRef<Set<string>>(new Set());
  const hasSeededEmailsRef = useRef(false);
  const serviceWorkerRegistrationRef = useRef<ServiceWorkerRegistration | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    if ('Notification' in window) {
      setNotificationPermission(Notification.permission);
    } else {
      setNotificationPermission('unsupported');
    }
  }, []);

  useEffect(() => {
    if (notificationPermission !== 'granted' || !('serviceWorker' in navigator)) {
      return;
    }

    void navigator.serviceWorker.ready.then((registration) => {
      serviceWorkerRegistrationRef.current = registration;
    });
  }, [notificationPermission]);

  const notifyAboutNewEmails = useCallback(async (freshEmails: Email[]) => {
    if (notificationPermission !== 'granted' || freshEmails.length === 0) {
      return;
    }

    if (document.visibilityState === 'visible' && document.hasFocus()) {
      return;
    }

    if (!('serviceWorker' in navigator)) {
      return;
    }

    const registration = serviceWorkerRegistrationRef.current || await navigator.serviceWorker.ready;
    serviceWorkerRegistrationRef.current = registration;

    for (const email of freshEmails.slice(0, 3)) {
      const bodyPreview = email.body?.trim() || email.html_body?.trim() || 'Open the inbox to read the message.';

      await registration.showNotification(`New email from ${email.from_email}`, {
        body: `${email.subject}\n${bodyPreview}`.trim(),
        icon: '/pwa-icon.svg',
        badge: '/pwa-icon.svg',
        tag: `email-${email.id}`,
        data: {
          url: '/dashboard/inbox',
          emailId: email.id,
        },
      });
    }
  }, [notificationPermission]);

  const fetchEmails = useCallback(async (showRefreshing = false, notifyNewEmails = false) => {
    if (showRefreshing) setIsRefreshing(true);
    else setIsLoading(true);

    try {
      const response = await fetch('/api/emails?type=incoming', {
        cache: 'no-store',
      });
      const data = await response.json();

      if (data.success) {
        const nextEmails = data.emails as Email[];

        if (notifyNewEmails && hasSeededEmailsRef.current) {
          const freshEmails = nextEmails.filter((email) => !seenEmailIdsRef.current.has(String(email.id)));
          await notifyAboutNewEmails(freshEmails);
        }

        setEmails(nextEmails);
        seenEmailIdsRef.current = new Set(nextEmails.map((email) => String(email.id)));
        hasSeededEmailsRef.current = true;
      }
    } catch (error) {
      console.error('Error fetching emails:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [notifyAboutNewEmails]);

  const handleEnableNotifications = useCallback(async () => {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      setNotificationPermission('unsupported');
      return;
    }

    setIsEnablingNotifications(true);

    try {
      const permission = await Notification.requestPermission();
      setNotificationPermission(permission);

      if (permission === 'granted' && 'serviceWorker' in navigator) {
        serviceWorkerRegistrationRef.current = await navigator.serviceWorker.ready;
      }
    } finally {
      setIsEnablingNotifications(false);
    }
  }, []);

  useEffect(() => {
    void fetchEmails();
  }, [fetchEmails]);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      void fetchEmails(true, true);
    }, 30000);

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        void fetchEmails(true, true);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.clearInterval(intervalId);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [fetchEmails]);

  const handleEmailClick = async (email: Email) => {
    setSelectedEmail(email);
    setShowEmailList(false); // Hide list on mobile when email is selected

    // Mark as read if it's unread
    if (!email.is_read) {
      try {
        const response = await fetch('/api/emails', {
          method: 'PATCH',
          cache: 'no-store',
          credentials: 'include',
          referrerPolicy: 'same-origin',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ id: email.id, is_read: true }),
        });

        const responseText = await response.text();
        const responseData = responseText ? (() => {
          try {
            return JSON.parse(responseText) as { email?: Email; error?: string; details?: string };
          } catch {
            return null;
          }
        })() : null;

        if (!response.ok) {
          throw new Error(
            responseData?.details ||
            responseData?.error ||
            responseText ||
            'Failed to mark email as read'
          );
        }

        const updatedEmail = responseData?.email;

        if (updatedEmail) {
          setEmails(prevEmails =>
            prevEmails.map(existingEmail =>
              existingEmail.id === updatedEmail.id ? updatedEmail : existingEmail
            )
          );
          setSelectedEmail(prevEmail =>
            prevEmail?.id === updatedEmail.id ? updatedEmail : prevEmail
          );
        } else {
          setEmails(prevEmails =>
            prevEmails.map(existingEmail =>
              existingEmail.id === email.id ? { ...existingEmail, is_read: true } : existingEmail
            )
          );
        }
      } catch (error) {
        console.error('Error marking email as read:', error);
        fetchEmails(true);
      }
    }
  };

  const handleCloseEmail = () => {
    setSelectedEmail(null);
    setShowEmailList(true); // Show list when closing email on mobile
  };

  if (isLoading) {
    return (
      <div className="flex flex-col h-full">
        <Header title="Inbox" />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-gray-500 dark:text-gray-400">Loading emails...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <Header 
        title="Inbox" 
        onRefresh={() => fetchEmails(true)} 
        isRefreshing={isRefreshing}
        onEnableNotifications={handleEnableNotifications}
        isEnablingNotifications={isEnablingNotifications}
        notificationPermission={notificationPermission}
      />
      
      <div className="flex-1 overflow-hidden flex">
        {/* Email List */}
        <div className={`w-full lg:w-96 border-r border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 overflow-y-auto ${
          showEmailList ? 'block' : 'hidden lg:block'
        }`}>
          <EmailList 
            emails={emails}
            onEmailClick={handleEmailClick}
            selectedEmailId={selectedEmail?.id}
          />
        </div>
        {/* Email Detail */}
        <div className={`flex-1 overflow-hidden ${
          showEmailList ? 'hidden lg:block' : 'block'
        }`}>
          {selectedEmail ? (
            <EmailDetail 
              email={selectedEmail}
              onClose={handleCloseEmail}
            />
          ) : (
            <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400">
              <p>Select an email to view</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

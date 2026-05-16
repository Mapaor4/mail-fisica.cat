'use client';

import { useState, useEffect } from 'react';
import Header from '@/components/Header';
import EmailList from '@/components/EmailList';
import EmailDetail from '@/components/EmailDetail';
import { Email } from '@/lib/types';

export default function InboxPage() {
  const [emails, setEmails] = useState<Email[]>([]);
  const [selectedEmail, setSelectedEmail] = useState<Email | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showEmailList, setShowEmailList] = useState(true);

  const fetchEmails = async (showRefreshing = false) => {
    if (showRefreshing) setIsRefreshing(true);
    else setIsLoading(true);

    try {
      const response = await fetch('/api/emails?type=incoming', {
        cache: 'no-store',
      });
      const data = await response.json();
      
      if (data.success) {
        setEmails(data.emails);
      }
    } catch (error) {
      console.error('Error fetching emails:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchEmails();
  }, []);

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

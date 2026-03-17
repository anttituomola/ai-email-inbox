import { useCallback, useEffect, useMemo, useState } from 'react';
import { api } from '../api';
import { DEFAULT_EMAIL_FILTER, DEFAULT_SORT_ORDER } from '../constants/emailUi';
import {
  individualDraftGenerationManager,
  type IndividualDraftGenerationEvent,
} from '../services/individualDraftGenerationManager.ts';
import { openDraftGenerationManager } from '../services/openDraftGenerationManager.ts';
import { sortEmailsByReceivedAt } from '../utils/emailFormatting';
import type {
  AppView,
  EmailDetail,
  EmailFilter,
  EmailListItem,
  OpenDraftGenerationEvent,
  SortOrder,
} from '../types';

export function useInboxController() {
  const [emails, setEmails] = useState<EmailListItem[]>([]);
  const [selectedEmail, setSelectedEmail] = useState<EmailDetail | null>(null);
  const [view, setView] = useState<AppView>('dashboard');
  const [filter, setFilter] = useState<EmailFilter>(DEFAULT_EMAIL_FILTER);
  const [sortOrder, setSortOrder] = useState<SortOrder>(DEFAULT_SORT_ORDER);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusCounts, setStatusCounts] = useState({ open: 0, needsReview: 0 });

  const loadEmails = useCallback(async (nextFilter: EmailFilter = filter) => {
    const fetchEmailsForFilter = async (targetFilter: EmailFilter) => {
      const apiStatus = targetFilter === 'all' || targetFilter === 'unresolved' ? undefined : targetFilter;
      const data = await api.getEmails(apiStatus);
      return targetFilter === 'unresolved'
        ? data.filter((email) => email.status === 'open' || email.status === 'needs_review')
        : data;
    };

    try {
      setIsLoading(true);
      const [filteredData, stats] = await Promise.all([
        fetchEmailsForFilter(nextFilter),
        api.getStats(),
      ]);

      setStatusCounts({
        open: Math.max(0, stats.unresolved_count - stats.needs_review_count),
        needsReview: stats.needs_review_count,
      });
      setEmails(filteredData);
      setError(null);
      return filteredData;
    } catch {
      setError('Failed to load emails. Is the backend running?');
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    void loadEmails(filter);
  }, [filter, loadEmails]);

  useEffect(() => {
    return openDraftGenerationManager.subscribeEvents((event: OpenDraftGenerationEvent) => {
      if (event.type === 'progress' && event.ok) {
        setEmails((currentEmails) =>
          currentEmails.map((email) =>
            email.id === event.email_id ? { ...email, has_draft: true } : email
          )
        );
        return;
      }

      if (event.type === 'complete') {
        void loadEmails(filter);
      }
    });
  }, [filter, loadEmails]);

  useEffect(() => {
    return individualDraftGenerationManager.subscribeEvents((event: IndividualDraftGenerationEvent) => {
      if (event.type !== 'completed') {
        return;
      }

      setEmails((currentEmails) =>
        currentEmails.map((email) =>
          email.id === event.emailId ? { ...email, has_draft: true } : email
        )
      );
    });
  }, []);

  const selectDashboard = () => {
    setView('dashboard');
    setSelectedEmail(null);
  };

  const selectEmail = async (id: number) => {
    try {
      const email = await api.getEmail(id);
      setSelectedEmail(email);
      setView('email');
      setError(null);
    } catch {
      setError('Failed to load email details');
    }
  };

  const handleSelect = async (id: number | null) => {
    if (id === null) {
      selectDashboard();
      return;
    }

    await selectEmail(id);
  };

  const handleEmailUpdate = (updatedEmail: EmailDetail) => {
    setSelectedEmail((current) => current?.id === updatedEmail.id ? updatedEmail : current);
    if (filter !== 'all' && filter !== 'unresolved' && filter !== updatedEmail.status) {
      setFilter(updatedEmail.status);
    }
    void loadEmails();
  };

  const handleNextEmail = (nextEmail: EmailDetail) => {
    setSelectedEmail(nextEmail);
    setView('email');
    void loadEmails();
  };

  const handleEmailSent = () => {
    void loadEmails();
  };

  const handleUndoSentEmail = (updatedEmail: EmailDetail) => {
    if (
      filter !== 'all' &&
      filter !== 'unresolved' &&
      filter !== updatedEmail.status
    ) {
      setFilter(updatedEmail.status);
    }

    setSelectedEmail(updatedEmail);
    setView('email');
    void loadEmails();
  };

  const handleSelectNextOpenEmail = async (excludeEmailId: number) => {
    try {
      const openEmails = await api.getEmails('open');
      const nextOpenEmail = sortEmailsByReceivedAt(
        openEmails.filter((email) => email.id !== excludeEmailId),
        'asc'
      )[0];

      if (!nextOpenEmail) {
        void loadEmails();
        return false;
      }

      await selectEmail(nextOpenEmail.id);
      void loadEmails();
      return true;
    } catch {
      setError('Failed to load next open email');
      return false;
    }
  };

  const handleStartHandling = async () => {
    try {
      let openEmails = emails;

      if (filter !== 'open') {
        setFilter('open');
        openEmails = await loadEmails('open');
      }

      setSortOrder('asc');

      const unresolved = openEmails.filter((email) => email.status !== 'resolved');
      const nextEmail = sortEmailsByReceivedAt(unresolved, 'asc')[0];

      if (nextEmail) {
        await selectEmail(nextEmail.id);
      }
    } catch {
      setError('Failed to start handling emails');
    }
  };

  const sortedEmails = useMemo(
    () => sortEmailsByReceivedAt(emails, sortOrder),
    [emails, sortOrder]
  );

  return {
    error,
    filter,
    handleEmailSent,
    handleEmailUpdate,
    handleNextEmail,
    handleSelectNextOpenEmail,
    handleUndoSentEmail,
    handleSelect,
    handleStartHandling,
    isLoading,
    selectedEmail,
    setFilter,
    setSortOrder,
    sortOrder,
    statusCounts,
    sortedEmails,
    view,
  };
}

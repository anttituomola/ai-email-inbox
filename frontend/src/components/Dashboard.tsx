import { useState, useEffect, useCallback } from 'react';
import { Inbox, AlertCircle, Clock, CheckCircle2, Timer, Calendar } from 'lucide-react';
import { api } from '../api';
import type { EmailFilter, EmailStats } from '../types';
import { formatHandlingTime } from '../utils/emailFormatting';
import { GenerateOpenDraftsControl } from './GenerateOpenDraftsControl.tsx';
import { TicTacToe } from './TicTacToe';
import { InfoTooltip, StatCard, LoadingState, ErrorState, Button } from './shared';

const MEDIAN_TIME_TOOLTIP = {
  today: [
    'Calculated from resolved emails sent today.',
    'For each resolved email, handling time is measured from received to sent. This card shows the median of those times.',
    'Improve it by replying faster, using Generate Draft earlier, and clearing older unresolved emails before they pile up.',
  ],
  week: [
    'Calculated from resolved emails sent since the start of this week.',
    'For each resolved email, handling time is measured from received to sent. This card shows the median of those times.',
    'Improve it by keeping daily response times low and resolving emails consistently throughout the week.',
  ],
} as const;

interface DashboardProps {
  onStartHandling: () => void;
  onNavigateToFilter?: (filter: EmailFilter) => void;
}

export function Dashboard({ onStartHandling, onNavigateToFilter }: DashboardProps) {
  const [stats, setStats] = useState<EmailStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadStats = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await api.getStats();
      setStats(data);
      setError(null);
    } catch {
      setError('Failed to load dashboard statistics');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadStats();
  }, [loadStats]);

  if (isLoading) {
    return <LoadingState message="Loading dashboard..." />;
  }

  if (error || !stats) {
    return <ErrorState message={error || 'Failed to load stats'} onRetry={loadStats} />;
  }

  return (
    <div className="flex-1 flex flex-col bg-white overflow-y-auto animate-fade-in">
      <div className="p-8 max-w-5xl mx-auto w-full">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Inbox Overview</h1>
            <p className="text-gray-500 mt-1">
              {stats.unresolved_count === 0 ? "You're all caught up!" : "Here's what needs your attention today"}
            </p>
          </div>
          <div className="flex items-center gap-3">
            {stats.unresolved_count > 0 && (
              <GenerateOpenDraftsControl
                showButton={stats.unresolved_count > 0}
                onCompleted={loadStats}
              />
            )}
            {stats.unresolved_count > 0 && (
              <Button onClick={onStartHandling} size="lg">
                <span>Start Handling Emails</span>
                <span className="text-lg leading-none">→</span>
              </Button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <StatCard
            title="Unresolved Emails"
            value={stats.unresolved_count}
            subtitle="total"
            icon={Inbox}
            onClick={() => onNavigateToFilter?.('unresolved')}
          />

          <StatCard
            title="Needs Review"
            value={stats.needs_review_count}
            subtitle="emails"
            icon={AlertCircle}
            onClick={() => onNavigateToFilter?.('needs_review')}
            animationDelay="50ms"
          />

          <StatCard
            title="Over 12 Hours Old"
            value={stats.old_unresolved_count}
            subtitle="emails"
            icon={Clock}
            valueClassName={stats.old_unresolved_count > 0 ? 'text-red-600' : 'text-gray-900'}
            onClick={() => onNavigateToFilter?.('unresolved')}
            animationDelay="100ms"
          />

          <StatCard
            title="Resolved Today"
            value={stats.resolved_today_count}
            subtitle="emails"
            icon={CheckCircle2}
            onClick={() => onNavigateToFilter?.('resolved')}
            animationDelay="150ms"
          />

          <StatCard
            title="Median Time (Today)"
            value={formatHandlingTime(stats.median_handling_time_today_minutes)}
            icon={Timer}
            rightElement={<InfoTooltip content={MEDIAN_TIME_TOOLTIP.today} />}
            animationDelay="200ms"
          />

          <StatCard
            title="Median Time (Week)"
            value={formatHandlingTime(stats.median_handling_time_week_minutes)}
            icon={Calendar}
            rightElement={<InfoTooltip content={MEDIAN_TIME_TOOLTIP.week} />}
            animationDelay="250ms"
          />
        </div>

        {stats.unresolved_count === 0 && <TicTacToe />}
      </div>
    </div>
  );
}

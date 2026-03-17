import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { ArrowRight, ExternalLink, Github, Lock, RefreshCcw, ShieldCheck, Video, Workflow } from 'lucide-react';
import { api } from '../api';
import { Button, Tooltip } from './shared';

interface ReviewerLandingPageProps {
  onOpenApp: () => void;
  isAuthenticated: boolean;
  onAuthChange: (authenticated: boolean) => void;
}

const futureIdeas = [
  <>Expand seeded data into <strong>richer customer profiles</strong>, email threads, FAQs, and hotel knowledge sources.</>,
  <>Add <strong>snoozing, delegation</strong>, and clearer review ownership without cluttering the main flow.</>,
  <>Move generation and validation to a <strong>multi-layer pipeline</strong> instead of a single AI API call, so the system can get <strong>faster and cheaper</strong> as volume grows.</>,
  <><strong>Two-stage validation</strong>: deterministic checks first, then low-cost AI fact checking.</>,
  <><strong>Pre-generate</strong> likely-safe drafts and queue analytics in the background to keep review speed high.</>,
  <><strong>Track tone preferences</strong> and eventually learn from approved sent replies.</>,
] as const;

function BulletList({
  items,
  tone = 'default',
  className = 'mt-5 space-y-3 text-sm leading-6 text-gray-600'
}: {
  items: readonly ReactNode[];
  tone?: 'default' | 'soft';
  className?: string;
}) {
  const bulletClassName =
    tone === 'soft'
      ? 'mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-gray-400/70'
      : 'mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-blue-500/80';

  return (
    <ul className={className}>
      {items.map((item, index) => (
        <li key={index} className="flex gap-3">
          <span className={bulletClassName} aria-hidden="true" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

export function ReviewerLandingPage({ onOpenApp, isAuthenticated, onAuthChange }: ReviewerLandingPageProps) {
  const [resetState, setResetState] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState<string | null>(null);
  const [loginLoading, setLoginLoading] = useState(false);

  const summaryCards = useMemo(() => [
    {
      title: 'What it does',
      icon: Workflow,
      items: [
        <>Helps hotel staff review guest emails in a focused, <strong>oldest-first workflow</strong>.</>,
        <>Generates <strong>editable AI drafts</strong> from hotel information instead of sending replies automatically.</>,
        <>Keeps <strong>trust visible</strong> through citations, unanswered questions, and review items.</>,
      ],
    },
    {
      title: 'What it does not do',
      icon: ShieldCheck,
      items: [
        <>It does not replace <strong>human review</strong> or send guest-facing messages autonomously.</>,
        <>It does not try to model a <strong>full email client</strong> with folders, compose, or complex delegation.</>,
        <>It does not optimize for every edge case before the <strong>core workflow</strong> feels fast and clear.</>,
        <>The current LLM generation path is <strong>not optimized for speed, latency, or cost efficiency</strong>. So: <strong>IT'S SLOW!</strong></>,
        <>The review pass is also <strong>intentionally simple</strong> today rather than a tuned, multi-stage validation system.</>,
      ],
    },
  ], []);

  // Check session on mount
  useEffect(() => {
    api.checkSession()
      .then((session) => {
        onAuthChange(session.authenticated);
      })
      .catch(() => {
        onAuthChange(false);
      });
  }, [onAuthChange]);

  const handleOpenApp = () => {
    if (isAuthenticated) {
      onOpenApp();
    } else {
      setIsPasswordModalOpen(true);
      setPassword('');
      setLoginError(null);
    }
  };

  const handleLogin = async () => {
    if (!password.trim()) {
      setLoginError('Please enter a password');
      return;
    }

    setLoginLoading(true);
    setLoginError(null);

    try {
      const response = await api.login(password);
      if (response.success) {
        onAuthChange(true);
        setIsPasswordModalOpen(false);
        onOpenApp();
      }
    } catch (err) {
      setLoginError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setLoginLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      void handleLogin();
    }
  };

  const handleReset = () => {
    setIsResetModalOpen(true);
  };

  const confirmReset = async () => {
    setIsResetModalOpen(false);
    setResetState('loading');

    try {
      await api.resetDemoData();
      setResetState('success');
    } catch {
      setResetState('error');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <div className="mx-auto flex min-h-screen max-w-6xl flex-col px-6 py-10 lg:px-10">
        <header className="flex flex-col gap-6 border-b border-gray-300 pb-10 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <h1 className="text-4xl font-semibold tracking-tight text-gray-900 sm:text-5xl">
              AI Email Inbox
            </h1>
            <p className="mt-4 text-lg leading-8 text-gray-600">
              A <strong>trust-first</strong> review workspace for hotel guest emails. The goal is to help staff
              move faster without hiding what the AI is claiming or where those claims came from.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <Button
              onClick={handleOpenApp}
              size="lg"
              className="gap-2 bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500"
            >
              <Lock className="h-4 w-4" />
              Open app
              <ArrowRight className="h-4 w-4" />
            </Button>
            <Tooltip
              content="This resets drafts, sent replies, and statuses on the backend serving this demo."
              position="bottom"
            >
              <Button
                onClick={handleReset}
                size="lg"
                variant="secondary"
                isLoading={resetState === 'loading'}
                className="gap-2 border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
              >
                <RefreshCcw className="h-4 w-4" />
                Reset demo data
              </Button>
            </Tooltip>
          </div>
        </header>

        <section className="mt-8 rounded-2xl border border-blue-200 bg-blue-50/50 p-6">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-blue-700">Project Deliverables</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            <a
              href="https://github.com/anttituomola/ai-email-inbox"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm transition-colors hover:border-blue-300 hover:bg-blue-50"
            >
              <div className="rounded-lg bg-gray-900 p-2 text-white">
                <Github className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <p className="font-medium text-gray-900">GitHub Repository</p>
                <p className="text-sm text-gray-500 truncate">Source code & README</p>
              </div>
              <ExternalLink className="ml-auto h-4 w-4 shrink-0 text-gray-400" />
            </a>

            <a
              href="https://ai-email-inbox.vercel.app/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm transition-colors hover:border-blue-300 hover:bg-blue-50"
            >
              <div className="rounded-lg bg-blue-600 p-2 text-white">
                <ExternalLink className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <p className="font-medium text-gray-900">Live Demo</p>
                <p className="text-sm text-gray-500 truncate">Deployed on Vercel</p>
              </div>
              <ExternalLink className="ml-auto h-4 w-4 shrink-0 text-gray-400" />
            </a>

            <a
              href="https://www.loom.com/share/71f3b0586a124632b38e404db3ff9d90"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm transition-colors hover:border-blue-300 hover:bg-blue-50"
            >
              <div className="rounded-lg bg-violet-600 p-2 text-white">
                <Video className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <p className="font-medium text-gray-900">Loom Walkthrough</p>
                <p className="text-sm text-gray-500 truncate">5-minute product walkthrough</p>
              </div>
              <ExternalLink className="ml-auto h-4 w-4 shrink-0 text-gray-400" />
            </a>
          </div>
        </section>

        <section className="mt-10 grid gap-5 lg:grid-cols-2">
          {summaryCards.map(({ title, icon: Icon, items }) => (
            <article key={title} className="rounded-3xl border border-gray-300 bg-white p-7 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="rounded-2xl border border-blue-200 bg-blue-50 p-2.5 text-blue-700">
                  <Icon className="h-5 w-5" />
                </div>
                <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
              </div>
              <BulletList items={items} />
            </article>
          ))}
        </section>

        <section className="mt-10 grid gap-5 lg:grid-cols-2">
          <article className="rounded-3xl border border-gray-300 bg-white p-7 shadow-sm">
            <h2 className="text-xl font-semibold text-gray-900">Walkthrough Preview</h2>
            <p className="mt-2 text-sm leading-6 text-gray-600">
              A short recorded demo of the trust-first workflow, from dashboard overview to draft review and send flow.
            </p>
            <div className="mt-5 overflow-hidden rounded-2xl border border-gray-200 bg-gray-100 shadow-sm">
              <div className="aspect-video">
                <iframe
                  src="https://www.loom.com/embed/71f3b0586a124632b38e404db3ff9d90"
                  title="AI Email Inbox Loom Walkthrough"
                  allowFullScreen
                  className="h-full w-full"
                />
              </div>
            </div>
          </article>

          <article className="rounded-3xl border border-gray-300 bg-white p-7 shadow-sm">
            <h2 className="text-xl font-semibold text-gray-900">Future development ideas</h2>
            <p className="mt-2 text-sm leading-6 text-gray-600 max-w-3xl">
              These are <strong>intentionally not packed</strong> into the MVP to keep the product
              <strong> simple and maintainable</strong>.
            </p>
            <BulletList
              items={futureIdeas.slice(0, 4)}
              tone="soft"
              className="mt-4 space-y-3 text-sm leading-6 text-gray-600"
            />
          </article>
        </section>
      </div>

      {/* Password login modal */}
      {isPasswordModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/50 px-4">
          <div className="w-full max-w-sm rounded-xl border border-gray-200 bg-white p-6 shadow-2xl">
            <div className="mb-4 flex items-center gap-2">
              <div className="rounded-lg bg-blue-100 p-2">
                <Lock className="h-5 w-5 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Enter demo password</h3>
            </div>
            <p className="mb-4 text-sm text-gray-600">
              This is a protected demo. Please enter the password to access the app.
            </p>
            <div className="space-y-3">
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Password"
                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                autoFocus
              />
              {loginError && (
                <p className="text-sm text-red-600">{loginError}</p>
              )}
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsPasswordModalOpen(false)}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleLogin}
                isLoading={loginLoading}
              >
                Open app
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Reset confirmation modal */}
      {isResetModalOpen && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-gray-900/30 px-4">
          <div className="w-full max-w-sm rounded-lg border border-gray-300 bg-white p-5 shadow-xl">
            <p className="text-sm text-gray-800">
              <strong>Reset the demo inbox</strong> to a clean testing state? This clears <strong>drafts, sent replies, and statuses</strong>.
            </p>
            <div className="mt-4 flex justify-end gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsResetModalOpen(false)}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={confirmReset}
              >
                Reset
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

import { useMemo, useState, type ReactNode } from 'react';
import { ArrowRight, RefreshCcw, ShieldCheck, Workflow } from 'lucide-react';
import { api } from '../api';
import { Button, Tooltip } from './shared';

interface ReviewerLandingPageProps {
  onOpenApp: () => void;
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
  className = 'mt-5 space-y-3 text-sm leading-6 text-slate-600'
}: {
  items: readonly ReactNode[];
  tone?: 'default' | 'soft';
  className?: string;
}) {
  const bulletClassName =
    tone === 'soft'
      ? 'mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-slate-400/70'
      : 'mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-teal-500/80';

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

export function ReviewerLandingPage({ onOpenApp }: ReviewerLandingPageProps) {
  const [resetState, setResetState] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);

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
    <div className="min-h-screen bg-stone-50 text-slate-900">
      <div className="mx-auto flex min-h-screen max-w-6xl flex-col px-6 py-10 lg:px-10">
        <header className="flex flex-col gap-6 border-b border-slate-200 pb-10 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <h1 className="text-4xl font-semibold tracking-tight text-slate-900 sm:text-5xl">
              AI Email Inbox
            </h1>
            <p className="mt-4 text-lg leading-8 text-slate-600">
              A <strong>trust-first</strong> review workspace for hotel guest emails. The goal is to help staff
              move faster without hiding what the AI is claiming or where those claims came from.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <Button
              onClick={onOpenApp}
              size="lg"
              className="gap-2 bg-teal-700 text-white hover:bg-teal-800 focus:ring-teal-500"
            >
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
                className="gap-2 border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
              >
                <RefreshCcw className="h-4 w-4" />
                Reset demo data
              </Button>
            </Tooltip>
          </div>
        </header>

        <section className="mt-10 grid gap-5 lg:grid-cols-2">
          {summaryCards.map(({ title, icon: Icon, items }) => (
            <article key={title} className="rounded-3xl border border-slate-200 bg-white p-7 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="rounded-2xl border border-teal-200 bg-teal-50 p-2.5 text-teal-700">
                  <Icon className="h-5 w-5" />
                </div>
                <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
              </div>
              <BulletList items={items} />
            </article>
          ))}
        </section>

        <section className="mt-10">
          <article className="rounded-3xl border border-slate-200 bg-white p-7 shadow-sm">
            <h2 className="text-xl font-semibold text-slate-900">Future development ideas</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600 max-w-3xl">
              These are <strong>intentionally not packed</strong> into the MVP. The goal was to keep the current
              product <strong>simple, maintainable, and easy to trust</strong> before layering on more advanced
              automation.
            </p>
            <BulletList 
              items={futureIdeas} 
              tone="soft" 
              className="mt-6 grid gap-x-12 gap-y-4 text-sm leading-6 text-slate-600 md:grid-cols-2"
            />
          </article>
        </section>
      </div>

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

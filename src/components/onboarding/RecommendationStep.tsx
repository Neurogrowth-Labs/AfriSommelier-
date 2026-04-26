import { useMemo, useState } from 'react';
import { ArrowLeft, ArrowRight, Heart } from 'lucide-react';
import { getStarterWines, type PalateAnswers } from '../../lib/onboarding';

interface RecommendationStepProps {
  palate: PalateAnswers;
  onBack: () => void;
  onContinue: () => void;
}

export default function RecommendationStep({
  palate,
  onBack,
  onContinue,
}: RecommendationStepProps) {
  const wines = useMemo(() => getStarterWines(palate), [palate]);
  const [saved, setSaved] = useState<Set<string>>(new Set());

  const toggleSave = (key: string) => {
    setSaved((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  return (
    <section className="flex-1 flex flex-col py-12" aria-labelledby="rec-heading">
      <button
        type="button"
        onClick={onBack}
        className="self-start inline-flex items-center gap-2 text-sm font-medium opacity-80 hover:opacity-100"
        style={{ color: 'var(--text)' }}
      >
        <ArrowLeft size={16} aria-hidden="true" /> Back
      </button>
      <p
        className="mt-8 text-xs uppercase tracking-[0.3em]"
        style={{ color: 'var(--color-gold)' }}
      >
        Your starter cellar
      </p>
      <h1
        id="rec-heading"
        className="mt-3 font-serif text-4xl md:text-5xl tracking-tight"
        style={{ color: 'var(--text)' }}
      >
        Three bottles to begin with.
      </h1>
      <p
        className="mt-3 text-lg max-w-xl"
        style={{ color: 'var(--text-muted)' }}
      >
        Picked from your palate, paired to your favourite food. Save what speaks to
        you — your sommelier will keep refining.
      </p>

      <ul className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-5 list-none">
        {wines.map((wine) => {
          const key = `${wine.estate}-${wine.name}`;
          const isSaved = saved.has(key);
          return (
            <li
              key={key}
              className="rounded-3xl p-6 border flex flex-col"
              style={{
                background: 'var(--bg-elevated)',
                borderColor: 'var(--border)',
                boxShadow: '0 8px 30px var(--shadow-color)',
              }}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p
                    className="text-xs uppercase tracking-[0.18em]"
                    style={{ color: 'var(--color-gold)' }}
                  >
                    {wine.region}
                  </p>
                  <h3
                    className="mt-2 font-serif text-2xl"
                    style={{ color: 'var(--text)' }}
                  >
                    {wine.name}
                  </h3>
                  <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                    {wine.estate} · {wine.vintage}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => toggleSave(key)}
                  aria-pressed={isSaved}
                  aria-label={isSaved ? `Remove ${wine.name} from cellar` : `Save ${wine.name} to cellar`}
                  className="shrink-0 h-9 w-9 rounded-full border flex items-center justify-center transition-colors focus:outline-none focus-visible:ring-2"
                  style={{
                    borderColor: isSaved ? 'var(--color-terracotta)' : 'var(--border-strong)',
                    background: isSaved ? 'var(--color-terracotta)' : 'transparent',
                    color: isSaved ? 'var(--color-warm-ivory)' : 'var(--text)',
                  }}
                >
                  <Heart
                    size={16}
                    fill={isSaved ? 'currentColor' : 'transparent'}
                    aria-hidden="true"
                  />
                </button>
              </div>
              <div
                className="mt-5 pt-5 border-t text-sm space-y-2"
                style={{ borderColor: 'var(--border)' }}
              >
                <p style={{ color: 'var(--text)' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Tasting notes — </span>
                  {wine.flavourNotes}
                </p>
                <p style={{ color: 'var(--text)' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Pair with — </span>
                  {wine.pairing}
                </p>
              </div>
            </li>
          );
        })}
      </ul>

      <div className="mt-12 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
          {saved.size > 0
            ? `${saved.size} bottle${saved.size === 1 ? '' : 's'} added to your cellar.`
            : 'Save any that catch your eye — they\'ll be waiting in your cellar.'}
        </p>
        <button
          type="button"
          onClick={onContinue}
          className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full text-base font-semibold transition-transform hover:scale-[0.99] focus:outline-none focus-visible:ring-2"
          style={{
            background: 'var(--color-terracotta)',
            color: 'var(--color-warm-ivory)',
          }}
        >
          Continue to dashboard
          <ArrowRight size={16} aria-hidden="true" />
        </button>
      </div>
    </section>
  );
}

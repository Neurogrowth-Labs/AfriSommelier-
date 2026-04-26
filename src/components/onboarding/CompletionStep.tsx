import { useEffect, useRef } from 'react';
import { ArrowRight, Loader2 } from 'lucide-react';

interface CompletionStepProps {
  firstName: string | null;
  isSaving?: boolean;
  onFinish: () => void;
}

const CONFETTI_CDN = 'https://cdn.jsdelivr.net/npm/canvas-confetti@1.9.3/dist/confetti.browser.min.js';

interface ConfettiFn {
  (options?: Record<string, unknown>): Promise<void> | void;
}

export default function CompletionStep({
  firstName,
  isSaving,
  onFinish,
}: CompletionStepProps) {
  const firedRef = useRef(false);

  useEffect(() => {
    if (firedRef.current) return;
    firedRef.current = true;

    if (typeof window.matchMedia === 'function' &&
        window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return;
    }

    const fire = (confetti: ConfettiFn) => {
      const palette = ['#8B3A2F', '#C9933A', '#FAF7F2', '#E0B266'];
      confetti({ particleCount: 80, spread: 70, origin: { y: 0.45 }, colors: palette });
      window.setTimeout(() => {
        confetti({ particleCount: 60, angle: 60, spread: 55, origin: { x: 0 }, colors: palette });
      }, 300);
      window.setTimeout(() => {
        confetti({ particleCount: 60, angle: 120, spread: 55, origin: { x: 1 }, colors: palette });
      }, 600);
    };

    const existing = (window as unknown as { confetti?: ConfettiFn }).confetti;
    if (existing) {
      fire(existing);
      return;
    }

    const script = document.createElement('script');
    script.src = CONFETTI_CDN;
    script.async = true;
    script.onload = () => {
      const fn = (window as unknown as { confetti?: ConfettiFn }).confetti;
      if (fn) fire(fn);
    };
    document.head.appendChild(script);
  }, []);

  return (
    <section
      className="flex-1 flex flex-col items-center justify-center text-center py-16"
      aria-labelledby="done-heading"
    >
      <p
        className="text-xs uppercase tracking-[0.3em]"
        style={{ color: 'var(--color-gold)' }}
      >
        Cheers
      </p>
      <h1
        id="done-heading"
        className="mt-4 font-serif text-5xl md:text-6xl tracking-tight"
        style={{ color: 'var(--text)' }}
      >
        You're all set
        {firstName ? <>, <span className="italic">{firstName}</span></> : ''}.
      </h1>
      <p
        className="mt-5 max-w-lg text-lg"
        style={{ color: 'var(--text-muted)' }}
      >
        Your sommelier is ready. Pour something good — we'll handle the pairings, the
        notes, and the stories from here.
      </p>
      <button
        type="button"
        onClick={onFinish}
        disabled={isSaving}
        className="mt-10 inline-flex items-center gap-3 px-7 py-3.5 rounded-full text-base font-semibold transition-transform hover:scale-[0.99] disabled:opacity-70 focus:outline-none focus-visible:ring-2"
        style={{
          background: 'var(--color-terracotta)',
          color: 'var(--color-warm-ivory)',
        }}
      >
        {isSaving ? (
          <Loader2 size={18} className="animate-spin" aria-hidden="true" />
        ) : null}
        Go to dashboard
        <ArrowRight size={18} aria-hidden="true" />
      </button>
    </section>
  );
}

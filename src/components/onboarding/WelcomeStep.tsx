import { ArrowRight } from 'lucide-react';

interface WelcomeStepProps {
  firstName: string | null;
  onContinue: () => void;
}

export default function WelcomeStep({ firstName, onContinue }: WelcomeStepProps) {
  return (
    <section
      className="flex-1 flex flex-col items-center justify-center text-center py-16"
      aria-labelledby="welcome-heading"
    >
      <WineGlassFill />
      <p
        className="mt-10 text-xs uppercase tracking-[0.3em]"
        style={{ color: 'var(--color-gold)' }}
      >
        Welcome aboard
      </p>
      <h1
        id="welcome-heading"
        className="mt-4 font-serif text-5xl md:text-6xl tracking-tight"
        style={{ color: 'var(--text)' }}
      >
        Welcome to AfriSommelier
        {firstName ? <>, <span className="italic">{firstName}</span></> : ''}.
      </h1>
      <p
        className="mt-5 max-w-lg text-lg"
        style={{ color: 'var(--text-muted)' }}
      >
        We'll learn your palate in four short sips and pour your first three recommendations.
      </p>
      <button
        type="button"
        onClick={onContinue}
        className="mt-10 inline-flex items-center gap-3 px-7 py-3.5 rounded-full text-base font-semibold transition-transform hover:scale-[0.99] focus:outline-none focus-visible:ring-2"
        style={{
          background: 'var(--color-terracotta)',
          color: 'var(--color-warm-ivory)',
        }}
      >
        Let's set up your palate
        <ArrowRight size={18} aria-hidden="true" />
      </button>
    </section>
  );
}

function WineGlassFill() {
  return (
    <div className="relative w-32 h-32" aria-hidden="true">
      <svg viewBox="0 0 120 160" className="absolute inset-0 w-full h-full">
        <defs>
          <clipPath id="bowl">
            <path d="M30 10 H90 C90 50, 80 70, 60 70 C40 70, 30 50, 30 10 Z" />
          </clipPath>
          <linearGradient id="wine" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0" stopColor="#8B3A2F" />
            <stop offset="1" stopColor="#4B0F1A" />
          </linearGradient>
        </defs>
        <g clipPath="url(#bowl)">
          <rect
            x="0"
            y="0"
            width="120"
            height="80"
            fill="url(#wine)"
            className="animate-wine-fill"
          />
        </g>
        <path
          d="M30 10 H90 C90 50, 80 70, 60 70 C40 70, 30 50, 30 10 Z"
          fill="none"
          stroke="var(--color-gold)"
          strokeWidth="2"
        />
        <path
          d="M60 70 V130 M40 130 H80"
          stroke="var(--color-gold)"
          strokeWidth="2"
          strokeLinecap="round"
          fill="none"
        />
      </svg>
    </div>
  );
}

import { ArrowRight, Loader2 } from 'lucide-react';
import { motion } from 'motion/react';

interface HeroProps {
  onContinueWithGoogle: () => void;
  onExploreWines: () => void;
  isLoadingPrimary?: boolean;
  errorMessage?: string | null;
}

const HERO_IMAGE_URL =
  'https://images.unsplash.com/photo-1506377247377-2a5b3b417ebb?auto=format&fit=crop&w=2000&q=80';

export default function Hero({
  onContinueWithGoogle,
  onExploreWines,
  isLoadingPrimary,
  errorMessage,
}: HeroProps) {
  return (
    <section
      id="top"
      className="relative isolate overflow-hidden"
      aria-labelledby="hero-heading"
    >
      <div
        className="absolute inset-0 -z-10 bg-cover bg-center"
        role="img"
        aria-label="Cape Winelands sunset vineyard"
        style={{ backgroundImage: `url(${HERO_IMAGE_URL})` }}
      />
      <div
        className="absolute inset-0 -z-10"
        style={{
          background:
            'linear-gradient(180deg, rgba(26,20,16,0.55) 0%, rgba(26,20,16,0.85) 70%, var(--bg) 100%)',
        }}
      />
      <div className="grain-overlay" aria-hidden="true" />

      <div className="mx-auto max-w-7xl px-6 sm:px-8 pt-20 pb-28 md:pt-28 md:pb-36">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: 'easeOut' }}
          className="max-w-2xl"
        >
          <span
            className="inline-block text-xs uppercase tracking-[0.2em] mb-6 px-3 py-1 rounded-full border"
            style={{
              color: 'var(--color-gold-soft)',
              borderColor: 'rgba(232, 221, 213, 0.25)',
              background: 'rgba(26,20,16,0.4)',
            }}
          >
            African terroir, AI sommelier
          </span>
          <h1
            id="hero-heading"
            className="font-serif text-5xl md:text-7xl leading-[1.05] tracking-tight"
            style={{ color: 'var(--color-warm-ivory)' }}
          >
            Meet Your African
            <br />
            <span style={{ color: 'var(--color-gold-soft)' }} className="italic">
              Master Sommelier
            </span>
          </h1>
          <p
            className="mt-6 text-lg md:text-xl max-w-xl"
            style={{ color: 'rgba(232, 221, 213, 0.85)' }}
          >
            AI-powered wine discovery rooted in the terroir of the African continent
            and beyond. Crafted pairings, cellar tracking, and a story behind every glass.
          </p>

          <div className="mt-10 flex flex-col sm:flex-row gap-3 sm:items-center">
            <button
              type="button"
              onClick={onContinueWithGoogle}
              disabled={isLoadingPrimary}
              className="group inline-flex items-center justify-center gap-3 px-6 py-3.5 rounded-full text-base font-semibold transition-transform hover:scale-[0.99] disabled:opacity-70 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-black"
              style={{
                background: 'var(--color-terracotta)',
                color: 'var(--color-warm-ivory)',
              }}
            >
              {isLoadingPrimary ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              ) : (
                <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
                  <path fill="#FFFFFF" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" opacity=".95"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
              )}
              {isLoadingPrimary ? 'Connecting…' : 'Continue with Google'}
            </button>
            <button
              type="button"
              onClick={onExploreWines}
              className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-full text-base font-semibold border transition-colors hover:bg-white/10 focus:outline-none focus-visible:ring-2"
              style={{
                color: 'var(--color-warm-ivory)',
                borderColor: 'rgba(232, 221, 213, 0.4)',
                background: 'transparent',
              }}
            >
              Explore Wines
              <ArrowRight size={16} aria-hidden="true" />
            </button>
          </div>

          {errorMessage && (
            <p
              role="alert"
              className="mt-6 text-sm max-w-md px-4 py-3 rounded-xl border"
              style={{
                color: '#FFD9D2',
                background: 'rgba(139, 58, 47, 0.25)',
                borderColor: 'rgba(255, 217, 210, 0.3)',
              }}
            >
              {errorMessage}
            </p>
          )}
        </motion.div>
      </div>
    </section>
  );
}

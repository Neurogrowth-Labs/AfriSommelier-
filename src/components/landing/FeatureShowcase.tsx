import { Check } from 'lucide-react';

const FEATURES = [
  'AI Sommelier trained on 10,000+ African labels',
  'Food pairing engine for every cuisine',
  'Cellar tracker & vintage alerts',
  'Offline tasting notes',
];

const SHOWCASE_IMAGE_URL =
  'https://images.unsplash.com/photo-1474722883778-792e7990302f?auto=format&fit=crop&w=1600&q=80';

export default function FeatureShowcase() {
  return (
    <section
      id="features"
      className="py-24 md:py-32"
      style={{ background: 'var(--bg-muted)' }}
      aria-labelledby="features-heading"
    >
      <div className="mx-auto max-w-7xl px-6 sm:px-8 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
        <div className="lg:col-span-7 order-2 lg:order-1">
          <div
            className="relative overflow-hidden rounded-[2rem] aspect-[4/3] lg:aspect-[5/4]"
            style={{ boxShadow: '0 30px 60px var(--shadow-color)' }}
          >
            <img
              src={SHOWCASE_IMAGE_URL}
              alt="A hand cradling a glass of red wine in golden hour light"
              className="absolute inset-0 h-full w-full object-cover"
              loading="lazy"
            />
            <div
              aria-hidden="true"
              className="absolute inset-0"
              style={{
                background:
                  'linear-gradient(180deg, transparent 60%, rgba(26,20,16,0.35) 100%)',
              }}
            />
          </div>
        </div>

        <div className="lg:col-span-5 order-1 lg:order-2">
          <p
            className="text-xs uppercase tracking-[0.2em] mb-3"
            style={{ color: 'var(--color-terracotta)' }}
          >
            Built for the table
          </p>
          <h2
            id="features-heading"
            className="font-serif text-4xl md:text-5xl tracking-tight"
            style={{ color: 'var(--text)' }}
          >
            A sommelier in your pocket — quietly brilliant.
          </h2>
          <p
            className="mt-5 text-lg leading-relaxed max-w-md"
            style={{ color: 'var(--text-muted)' }}
          >
            Everything you'd want from a senior sommelier, distilled into a few taps —
            so you can spend less time second-guessing and more time pouring.
          </p>
          <ul className="mt-8 space-y-4">
            {FEATURES.map((feature) => (
              <li key={feature} className="flex items-start gap-3">
                <span
                  className="mt-1 inline-flex h-5 w-5 items-center justify-center"
                  aria-hidden="true"
                >
                  <Check size={18} style={{ color: 'var(--color-gold)' }} strokeWidth={2.5} />
                </span>
                <span className="text-base md:text-lg" style={{ color: 'var(--text)' }}>
                  {feature}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

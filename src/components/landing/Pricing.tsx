import { Check } from 'lucide-react';

interface PricingProps {
  onChoose: () => void;
}

const TIERS = [
  {
    name: 'Free',
    price: 'R0',
    cadence: 'forever',
    summary: 'A taste of your sommelier — perfect for casual nights in.',
    cta: 'Start tasting',
    features: [
      'Personalised palate profile',
      '5 AI pairings per week',
      'Basic cellar tracker (up to 25 bottles)',
      'Weekly African terroir digest',
    ],
    highlighted: false,
  },
  {
    name: 'Sommelier Pro',
    price: 'R149',
    cadence: '/ month',
    summary: 'The full master sommelier — for collectors and hosts.',
    cta: 'Continue with Google',
    features: [
      'Unlimited AI pairings & deep label scans',
      'Cellar tracker, vintage alerts, drink-window timing',
      'Curated discovery from 10,000+ African labels',
      'Offline tasting notes & dinner-party mode',
    ],
    highlighted: true,
  },
];

export default function Pricing({ onChoose }: PricingProps) {
  return (
    <section
      id="pricing"
      className="py-24 md:py-32"
      style={{ background: 'var(--bg-muted)' }}
      aria-labelledby="pricing-heading"
    >
      <div className="mx-auto max-w-7xl px-6 sm:px-8">
        <div className="max-w-2xl">
          <p
            className="text-xs uppercase tracking-[0.2em] mb-3"
            style={{ color: 'var(--color-terracotta)' }}
          >
            Pricing
          </p>
          <h2
            id="pricing-heading"
            className="font-serif text-4xl md:text-5xl tracking-tight"
            style={{ color: 'var(--text)' }}
          >
            Pour-by-pour, or all-in.
          </h2>
          <p className="mt-4 text-lg" style={{ color: 'var(--text-muted)' }}>
            Try AfriSommelier free for as long as you like. Upgrade when your cellar
            outgrows your spreadsheet.
          </p>
        </div>

        <div className="mt-14 grid grid-cols-1 md:grid-cols-2 gap-6">
          {TIERS.map((tier) => (
            <article
              key={tier.name}
              className="relative rounded-3xl p-8 md:p-10 border flex flex-col"
              style={{
                background: 'var(--bg-elevated)',
                borderColor: tier.highlighted ? 'var(--color-gold)' : 'var(--border)',
                boxShadow: tier.highlighted
                  ? '0 30px 60px rgba(201, 147, 58, 0.18)'
                  : '0 8px 24px var(--shadow-color)',
              }}
              aria-labelledby={`tier-${tier.name}`}
            >
              {tier.highlighted && (
                <span
                  className="absolute -top-3 left-8 text-xs font-semibold uppercase tracking-[0.18em] px-3 py-1 rounded-full"
                  style={{
                    background: 'var(--color-gold)',
                    color: 'var(--color-deep-brown)',
                  }}
                >
                  Recommended
                </span>
              )}
              <h3
                id={`tier-${tier.name}`}
                className="font-serif text-3xl"
                style={{ color: 'var(--text)' }}
              >
                {tier.name}
              </h3>
              <p className="mt-3 text-base" style={{ color: 'var(--text-muted)' }}>
                {tier.summary}
              </p>
              <p className="mt-6 flex items-baseline gap-2">
                <span
                  className="font-serif text-5xl tracking-tight"
                  style={{ color: 'var(--text)' }}
                >
                  {tier.price}
                </span>
                <span className="text-sm" style={{ color: 'var(--text-muted)' }}>
                  {tier.cadence}
                </span>
              </p>
              <ul className="mt-6 space-y-3 flex-1">
                {tier.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-3">
                    <Check
                      size={18}
                      strokeWidth={2.5}
                      aria-hidden="true"
                      style={{ color: 'var(--color-gold)', marginTop: 2 }}
                    />
                    <span style={{ color: 'var(--text)' }}>{feature}</span>
                  </li>
                ))}
              </ul>
              <button
                type="button"
                onClick={onChoose}
                className="mt-8 inline-flex items-center justify-center px-6 py-3 rounded-full text-base font-semibold transition-transform hover:scale-[0.99] focus:outline-none focus-visible:ring-2"
                style={{
                  background: tier.highlighted
                    ? 'var(--color-terracotta)'
                    : 'transparent',
                  color: tier.highlighted ? 'var(--color-warm-ivory)' : 'var(--text)',
                  border: tier.highlighted
                    ? '1px solid transparent'
                    : '1px solid var(--border-strong)',
                }}
              >
                {tier.cta}
              </button>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

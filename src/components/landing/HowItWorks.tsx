import { ClipboardList, MapPin, Wine } from 'lucide-react';

const STEPS = [
  {
    number: '01',
    title: 'Tell us your palate',
    description:
      'Take a two-minute quiz on the reds, foods, and styles you love. We translate your taste into a sommelier-grade flavour map.',
    Icon: ClipboardList,
  },
  {
    number: '02',
    title: 'Get curated pairings',
    description:
      'Snap a label, type a dish, or just tell us your mood. Our sommelier returns three matched bottles with notes you can show off at the table.',
    Icon: Wine,
  },
  {
    number: '03',
    title: 'Discover African terroir',
    description:
      'From Stellenbosch granite to Swartland schist, learn the regions, grapes, and people behind every glass — and bookmark what you love.',
    Icon: MapPin,
  },
];

export default function HowItWorks() {
  return (
    <section
      id="how-it-works"
      className="py-24 md:py-32"
      style={{ background: 'var(--bg)' }}
      aria-labelledby="how-heading"
    >
      <div className="mx-auto max-w-7xl px-6 sm:px-8">
        <div className="max-w-2xl">
          <p
            className="text-xs uppercase tracking-[0.2em] mb-3"
            style={{ color: 'var(--color-terracotta)' }}
          >
            How it works
          </p>
          <h2
            id="how-heading"
            className="font-serif text-4xl md:text-5xl tracking-tight"
            style={{ color: 'var(--text)' }}
          >
            Three sips, and your sommelier knows you
          </h2>
        </div>

        <ol className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6 list-none">
          {STEPS.map(({ number, title, description, Icon }) => (
            <li
              key={number}
              className="rounded-3xl p-8 border h-full text-left"
              style={{
                background: 'var(--bg-elevated)',
                borderColor: 'var(--border)',
                boxShadow: '0 8px 30px var(--shadow-color)',
              }}
            >
              <div className="flex items-center gap-3 mb-5">
                <Icon size={24} aria-hidden="true" style={{ color: 'var(--color-gold)' }} />
                <span
                  className="font-mono text-sm tracking-wider"
                  style={{ color: 'var(--text-muted)' }}
                >
                  {number}
                </span>
              </div>
              <h3
                className="font-serif text-2xl mb-3"
                style={{ color: 'var(--text)' }}
              >
                {title}
              </h3>
              <p className="text-base leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                {description}
              </p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

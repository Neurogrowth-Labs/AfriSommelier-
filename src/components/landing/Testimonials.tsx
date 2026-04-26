import { Quote } from 'lucide-react';

const TESTIMONIALS = [
  {
    name: 'Thandiwe Mokoena',
    location: 'Johannesburg, ZA',
    body:
      'I went from "what is Pinotage" to hosting a Stellenbosch tasting at home. The pairings for our braai nights are absurdly good.',
  },
  {
    name: 'Kwame Asante',
    location: 'Accra, GH',
    body:
      'AfriSommelier finally got me into Cape whites. The Chenin Blanc rec for grilled tilapia was a religious experience.',
  },
  {
    name: 'Aaliyah Khumalo',
    location: 'Cape Town, ZA',
    body:
      'My cellar used to be chaos. Now I get vintage alerts before bottles peak — and the food matches actually feel like our food.',
  },
];

export default function Testimonials() {
  return (
    <section
      className="py-24 md:py-32"
      style={{ background: 'var(--bg)' }}
      aria-labelledby="testimonials-heading"
    >
      <div className="mx-auto max-w-7xl px-6 sm:px-8">
        <div className="max-w-2xl">
          <p
            className="text-xs uppercase tracking-[0.2em] mb-3"
            style={{ color: 'var(--color-terracotta)' }}
          >
            Loved across the continent
          </p>
          <h2
            id="testimonials-heading"
            className="font-serif text-4xl md:text-5xl tracking-tight"
            style={{ color: 'var(--text)' }}
          >
            Wine talk that actually sounds like you.
          </h2>
        </div>

        <div className="mt-14 -mx-6 sm:mx-0 overflow-x-auto sm:overflow-visible">
          <ul
            className="flex gap-6 px-6 sm:px-0 sm:grid sm:grid-cols-2 lg:grid-cols-3 list-none snap-x snap-mandatory"
          >
            {TESTIMONIALS.map((t) => (
              <li
                key={t.name}
                className="snap-start min-w-[80%] sm:min-w-0 rounded-3xl p-8 border"
                style={{
                  background: 'var(--bg-elevated)',
                  borderColor: 'var(--border)',
                  boxShadow: '0 8px 24px var(--shadow-color)',
                }}
              >
                <Quote
                  size={22}
                  aria-hidden="true"
                  style={{ color: 'var(--color-gold)' }}
                />
                <p
                  className="mt-4 font-serif text-xl leading-relaxed italic"
                  style={{ color: 'var(--text)' }}
                >
                  “{t.body}”
                </p>
                <div className="mt-6 flex flex-col">
                  <span className="text-sm font-semibold" style={{ color: 'var(--text)' }}>
                    {t.name}
                  </span>
                  <span className="text-sm" style={{ color: 'var(--text-muted)' }}>
                    {t.location}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

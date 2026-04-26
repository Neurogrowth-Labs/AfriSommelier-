const ESTATES = [
  'Kanonkop',
  'Boekenhoutskloof',
  'Mullineux',
  'Meerlust',
  'Klein Constantia',
];

export default function SocialProof() {
  return (
    <section
      className="border-y"
      style={{
        background: 'var(--bg-muted)',
        borderColor: 'var(--border)',
      }}
      aria-label="Social proof"
    >
      <div className="mx-auto max-w-7xl px-6 sm:px-8 py-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
        <p
          className="text-sm font-medium uppercase tracking-[0.18em]"
          style={{ color: 'var(--text-muted)' }}
        >
          Trusted by 2,400+ wine lovers across Africa
        </p>
        <ul className="flex flex-wrap items-center gap-x-8 gap-y-3" aria-label="Featured estates">
          {ESTATES.map((name) => (
            <li
              key={name}
              className="font-serif italic text-base md:text-lg"
              style={{ color: 'var(--text-muted)' }}
            >
              {name}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

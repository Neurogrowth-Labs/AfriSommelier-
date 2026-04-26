import Logo from './Logo';

const SOCIAL_LINKS = [
  {
    label: 'X (Twitter)',
    href: 'https://x.com/afrisommelier',
    iconUrl: 'https://cdn.simpleicons.org/x',
  },
  {
    label: 'Instagram',
    href: 'https://instagram.com/afrisommelier',
    iconUrl: 'https://cdn.simpleicons.org/instagram',
  },
  {
    label: 'LinkedIn',
    href: 'https://linkedin.com/company/afrisommelier',
    iconUrl: 'https://cdn.simpleicons.org/linkedin',
  },
];

const LINK_GROUPS = [
  {
    title: 'Product',
    items: [
      { label: 'Features', href: '#features' },
      { label: 'How it works', href: '#how-it-works' },
      { label: 'Pricing', href: '#pricing' },
    ],
  },
  {
    title: 'Company',
    items: [
      { label: 'Blog', href: '#blog' },
      { label: 'Press', href: '#press' },
      { label: 'Contact', href: 'mailto:hello@afrisommelier.app' },
    ],
  },
  {
    title: 'Legal',
    items: [
      { label: 'Privacy', href: '#privacy' },
      { label: 'Terms', href: '#terms' },
    ],
  },
];

export default function Footer() {
  return (
    <footer
      className="border-t"
      style={{ background: 'var(--bg)', borderColor: 'var(--border)' }}
    >
      <div className="mx-auto max-w-7xl px-6 sm:px-8 py-16 grid grid-cols-1 md:grid-cols-4 gap-10">
        <div className="md:col-span-1">
          <Logo />
          <p
            className="mt-4 text-sm font-serif italic max-w-xs"
            style={{ color: 'var(--text-muted)' }}
          >
            Your personal master sommelier — rooted in the African continent.
          </p>
        </div>

        {LINK_GROUPS.map((group) => (
          <nav key={group.title} aria-label={group.title}>
            <h3
              className="text-xs uppercase tracking-[0.18em] mb-4 font-semibold"
              style={{ color: 'var(--text-muted)' }}
            >
              {group.title}
            </h3>
            <ul className="space-y-3">
              {group.items.map((item) => (
                <li key={item.label}>
                  <a
                    href={item.href}
                    className="text-sm hover:opacity-100 opacity-80 transition-opacity"
                    style={{ color: 'var(--text)' }}
                  >
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        ))}
      </div>

      <div
        className="border-t"
        style={{ borderColor: 'var(--border)' }}
      >
        <div className="mx-auto max-w-7xl px-6 sm:px-8 py-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            Made with passion in Cape Town 🇿🇦 · © {new Date().getFullYear()} AfriSommelier
          </p>
          <ul className="flex items-center gap-4" aria-label="Social media">
            {SOCIAL_LINKS.map((social) => (
              <li key={social.label}>
                <a
                  href={social.href}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={social.label}
                  className="inline-flex items-center justify-center h-9 w-9 rounded-full border transition-colors hover:opacity-80"
                  style={{
                    borderColor: 'var(--border)',
                    background: 'var(--bg-elevated)',
                  }}
                >
                  <img
                    src={social.iconUrl}
                    alt=""
                    aria-hidden="true"
                    width={16}
                    height={16}
                    style={{ filter: 'grayscale(0.2)' }}
                  />
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </footer>
  );
}

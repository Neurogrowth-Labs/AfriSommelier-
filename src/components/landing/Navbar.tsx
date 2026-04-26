import { useState } from 'react';
import { Menu, Moon, Sun, X } from 'lucide-react';
import Logo from './Logo';
import { useTheme } from '../../lib/theme';

interface NavbarProps {
  onPrimaryCta: () => void;
  isLoadingCta?: boolean;
}

const NAV_LINKS: { label: string; href: string }[] = [
  { label: 'Features', href: '#features' },
  { label: 'How It Works', href: '#how-it-works' },
  { label: 'Pricing', href: '#pricing' },
  { label: 'Blog', href: '#blog' },
];

export default function Navbar({ onPrimaryCta, isLoadingCta = false }: NavbarProps) {
  const { theme, toggleTheme } = useTheme();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header
      className="sticky top-0 z-30 border-b backdrop-blur"
      style={{
        background: 'color-mix(in srgb, var(--bg) 88%, transparent)',
        borderColor: 'var(--border)',
      }}
    >
      <div className="mx-auto max-w-7xl px-6 sm:px-8 h-16 flex items-center justify-between">
        <a href="#top" className="flex items-center" aria-label="AfriSommelier home">
          <Logo />
        </a>

        <nav className="hidden md:flex items-center gap-8" aria-label="Primary">
          {NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-sm font-medium hover:opacity-100 opacity-75 transition-opacity"
              style={{ color: 'var(--text)' }}
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={toggleTheme}
            aria-label={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
            className="p-2 rounded-full transition-colors hover:opacity-80 focus:outline-none focus-visible:ring-2"
            style={{ color: 'var(--text)' }}
          >
            {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
          </button>
          <button
            type="button"
            onClick={onPrimaryCta}
            disabled={isLoadingCta}
            className="hidden sm:inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold transition-transform hover:scale-[0.98] disabled:opacity-70 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
            style={{
              background: 'var(--color-terracotta)',
              color: 'var(--color-warm-ivory)',
            }}
          >
            Start Tasting
          </button>
          <button
            type="button"
            onClick={() => setMobileOpen((v) => !v)}
            className="md:hidden p-2 rounded-full"
            aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={mobileOpen}
            style={{ color: 'var(--text)' }}
          >
            {mobileOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div
          className="md:hidden border-t px-6 py-4 flex flex-col gap-3"
          style={{ borderColor: 'var(--border)', background: 'var(--bg)' }}
        >
          {NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-base font-medium py-1"
              style={{ color: 'var(--text)' }}
              onClick={() => setMobileOpen(false)}
            >
              {link.label}
            </a>
          ))}
          <button
            type="button"
            onClick={() => {
              setMobileOpen(false);
              onPrimaryCta();
            }}
            className="mt-2 w-full px-4 py-3 rounded-full text-sm font-semibold"
            style={{
              background: 'var(--color-terracotta)',
              color: 'var(--color-warm-ivory)',
            }}
          >
            Start Tasting
          </button>
        </div>
      )}
    </header>
  );
}

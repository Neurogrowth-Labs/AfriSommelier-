/**
 * AfriSommelier wordmark — wine glass cradling a stylised "A" rendered
 * with a warm gold stroke. Inline SVG so it ships zero network cost.
 */

interface LogoProps {
  size?: number;
  withWordmark?: boolean;
  className?: string;
}

export default function Logo({ size = 36, withWordmark = true, className = '' }: LogoProps) {
  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 48 48"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <path
          d="M14 6h20l-2.5 14a8.5 8.5 0 0 1-7.5 7.5V40h6"
          stroke="var(--color-gold)"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M18 40h6"
          stroke="var(--color-gold)"
          strokeWidth="2.2"
          strokeLinecap="round"
        />
        <path
          d="M19 22h10M22 16h4"
          stroke="var(--color-gold)"
          strokeWidth="1.6"
          strokeLinecap="round"
        />
        <path
          d="M19.5 20.5L24 11l4.5 9.5"
          stroke="var(--color-terracotta)"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      {withWordmark && (
        <span
          className="font-serif text-xl tracking-tight"
          style={{ color: 'var(--text)' }}
        >
          AfriSommelier
        </span>
      )}
    </span>
  );
}

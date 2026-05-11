import Link from 'next/link';
import Image from 'next/image';

/**
 * AlwardLogo.jsx — Used on auth pages (login / register).
 * Displays the official logo mark + gold wordmark on light backgrounds.
 * The image filter adjusts for dark vs light bg via `variant` prop.
 */
export default function AlwardLogo({ size = 'default', className = '', variant = 'dark' }) {
  const sizes = {
    small:   { img: 40, text: 'text-2xl' },
    default: { img: 48, text: 'text-3xl' },
    large:   { img: 64, text: 'text-4xl' },
  };
  const cfg = sizes[size] || sizes['default'];

  // On light bg (auth pages): invert to black. On dark bg: keep white.
  const imgFilter = variant === 'light'
    ? 'brightness(0)'                   // black mark on light bg
    : 'brightness(0) invert(1)';        // white mark on dark bg

  return (
    <Link href="/" className={`flex flex-col items-center gap-2 group select-none ${className}`}>
      <div
        className="transition-transform duration-300 group-hover:scale-105"
        style={{ width: cfg.img, height: cfg.img, position: 'relative' }}
      >
        <Image
          src="/alward-logo.png"
          alt="ALWARD"
          width={cfg.img}
          height={cfg.img}
          style={{ objectFit: 'contain', filter: imgFilter }}
          priority
        />
      </div>
      <span
        className={`${cfg.text} font-black uppercase`}
        style={{ color: '#C9A04A', letterSpacing: '0.22em' }}
      >
        ALWARD
      </span>
    </Link>
  );
}

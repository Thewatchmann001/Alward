import Link from 'next/link';
import Image from 'next/image';

/**
 * Logo.jsx — ALWARD Official Brand Component
 * Uses the official logo image (charcoal + gold palette).
 * The image is inverted to white for use on dark backgrounds.
 */
export default function Logo({ size = 'default', showText = true, className = '' }) {
  const sizes = {
    small:   { img: 28, text: 'text-lg' },
    default: { img: 36, text: 'text-xl' },
    medium:  { img: 36, text: 'text-xl' },
    large:   { img: 56, text: 'text-4xl md:text-5xl' },
  };

  const cfg = sizes[size] || sizes['default'];

  return (
    <Link
      href="/"
      className={`flex items-center gap-3 group select-none ${className}`}
    >
      {/* Official mark — inverted to white so it reads on dark bg */}
      <div
        className="flex-shrink-0 transition-transform duration-300 group-hover:scale-105"
        style={{ width: cfg.img, height: cfg.img, position: 'relative' }}
      >
        <Image
          src="/alward-logo.png"
          alt="ALWARD"
          width={cfg.img}
          height={cfg.img}
          style={{ objectFit: 'contain', filter: 'brightness(0) invert(1)' }}
          priority
        />
      </div>

      {/* Gold wordmark */}
      {showText && (
        <span
          className={`${cfg.text} font-black uppercase`}
          style={{ color: '#C9A04A', letterSpacing: '0.2em' }}
        >
          ALWARD
        </span>
      )}
    </Link>
  );
}

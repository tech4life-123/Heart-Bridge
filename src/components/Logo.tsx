/**
 * HeartBridge mark: a heart whose centre is a bridge arch.
 * Pure SVG, no external assets: works as favicon, app icon and wordmark companion.
 */
export function LogoMark({
  size = 32,
  className,
}: {
  size?: number;
  className?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      role="img"
      aria-label="HeartBridge"
      className={className}
    >
      <path
        d="M32 57C11 43 5 31 5 21.5 5 13.5 11 8 18.5 8 24.5 8 29.5 11 32 16c2.5-5 7.5-8 13.5-8C53 8 59 13.5 59 21.5 59 31 53 43 32 57Z"
        fill="#C93A5B"
      />
      <path
        d="M15 38C21 27 43 27 49 38"
        fill="none"
        stroke="#FFF8F2"
        strokeWidth="3.5"
        strokeLinecap="round"
      />
      <path
        d="M13 39.5h38"
        stroke="#E0A526"
        strokeWidth="3.5"
        strokeLinecap="round"
      />
      <path
        d="M23 32.5v7M32 30.5v9M41 32.5v7"
        stroke="#FFF8F2"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function Logo({ className }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2 ${className ?? ""}`}>
      <LogoMark size={32} />
      <span className="text-xl font-bold tracking-tight text-ink">
        Heart<span className="text-rose">Bridge</span>
      </span>
    </span>
  );
}

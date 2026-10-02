import Image from "next/image";
import emblem from "../../public/brand/emblem-160.png";

/** The standalone HeartBridge emblem (two people, heart, bridge, Liberia). */
export function LogoMark({
  size = 40,
  className,
}: {
  size?: number;
  className?: string;
}) {
  return (
    <Image
      src={emblem}
      alt="HeartBridge"
      width={size}
      height={size}
      className={className}
      priority
    />
  );
}

/** Emblem + live-text wordmark. Text stays crisp and costs no extra download. */
export function Logo({ className }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2 ${className ?? ""}`}>
      <LogoMark size={40} />
      <span className="text-xl font-extrabold tracking-tight text-fg">
        Heart<span className="text-gold">Bridge</span>
      </span>
    </span>
  );
}

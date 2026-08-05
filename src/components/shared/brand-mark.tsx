import { cn } from "@/lib/utils";

export function BrandMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="82 14 55 55"
      width="38"
      height="38"
      className={cn("shrink-0", className)}
      role="img"
      aria-label="NexxaByte"
    >
      <circle cx="109.3" cy="40.3" r="25.3" fill="#231F20" />
      <path
        d="M98.248 53.0599L106.933 39.6413L98.7116 27.5159H91.002L99.6387 40.0805L90.6849 53.0599H98.248Z"
        fill="#F05223"
      />
      <path d="M120.059 38.2751L127.525 27.5159H119.962L116.4 32.8589L120.059 38.2751Z" fill="white" />
      <path
        d="M109.861 53.0599L118.547 39.6413L110.325 27.5159H102.615L111.252 40.0805L102.298 53.0599H109.861Z"
        fill="#F05223"
      />
      <path d="M119.913 41.3491L116.204 47.0337L120.157 53.0842H127.915L119.913 41.3491Z" fill="white" />
    </svg>
  );
}

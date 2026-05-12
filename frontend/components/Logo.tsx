import Image from "next/image";
import clsx from "clsx";

interface LogoProps {
  compact?: boolean;
  className?: string;
  withTagline?: boolean;
}

export function Logo({
  compact = false,
  className,
  withTagline = false,
}: LogoProps) {
  if (compact) {
    return (
      <div className={clsx("flex items-center", className)}>
        <Image
          src="/zenvy-mark.svg"
          alt="ZENVY"
          width={48}
          height={48}
          priority
          className="h-12 w-12 object-contain"
        />
      </div>
    );
  }

  return (
    <div className={clsx("flex items-center gap-4", className)}>
      <Image
        src="/zenvy-mark.svg"
        alt="ZENVY"
        width={76}
        height={76}
        priority
        className="h-[4.75rem] w-[4.75rem] shrink-0 object-contain"
      />

      <div className="flex flex-col justify-center leading-none">
        <span className="text-[2.35rem] font-black tracking-[-0.065em] text-[#0f172a]">
          Zen
          <span className="bg-gradient-to-r from-[#7c3aed] via-[#db2777] to-[#fb923c] bg-clip-text text-transparent">
            vy
          </span>
        </span>

        {withTagline ? (
          <span className="mt-1.5 text-[0.62rem] font-bold uppercase tracking-[0.34em] text-slate-500">
            Shop More. Enjoy More.
          </span>
        ) : null}
      </div>
    </div>
  );
}

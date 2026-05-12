interface SectionHeadingProps {
  eyebrow: string;
  title: string;
  description: string;
}

export function SectionHeading({
  eyebrow,
  title,
  description,
}: SectionHeadingProps) {
  return (
    <div className="max-w-2xl space-y-3">
      <p className="text-xs font-semibold uppercase tracking-[0.32em] text-zenvy-rose">
        {eyebrow}
      </p>
      <h2 className="title-balance text-3xl font-semibold tracking-tight text-zenvy-ink sm:text-4xl">
        {title}
      </h2>
      <p className="text-sm leading-7 text-slate-600 sm:text-base">
        {description}
      </p>
    </div>
  );
}

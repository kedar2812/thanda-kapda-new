import clsx from "clsx";
import Link from "next/link";

type Variant = "primary" | "outline" | "cream" | "ghost";

type Common = {
  variant?: Variant;
  size?: "md" | "lg";
  arrow?: boolean;
  className?: string;
  children: React.ReactNode;
};

type AsLink = Common & { href: string; external?: boolean; onClick?: never; type?: never };
type AsButton = Common & { href?: undefined; external?: never; onClick?: () => void; type?: "button" | "submit" };

const base =
  "group/btn relative isolate inline-flex items-center justify-center gap-3 overflow-hidden rounded-full font-sans font-semibold uppercase tracking-[0.16em] transition-[transform,color,background-color,border-color] duration-500 ease-out-expo active:scale-[0.98]";

const sizes = {
  md: "h-12 px-6 text-[0.72rem]",
  lg: "h-14 px-8 text-[0.76rem]",
};

const variants: Record<Variant, string> = {
  primary: "bg-forest text-cream hover:text-cream",
  outline: "border border-ink/25 text-ink hover:border-ink hover:text-cream",
  cream: "bg-cream text-forest hover:text-cream",
  ghost: "text-ink hover:text-forest px-0",
};

const sweep: Record<Variant, string> = {
  primary: "bg-forest-deep",
  outline: "bg-ink",
  cream: "bg-forest-soft",
  ghost: "hidden",
};

function Arrow() {
  return (
    <svg
      aria-hidden
      viewBox="0 0 20 20"
      className="h-[1em] w-[1em] -translate-x-0.5 transition-transform duration-500 ease-out-expo group-hover/btn:translate-x-0.5"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 10h13M11 5l5 5-5 5" />
    </svg>
  );
}

export function Button(props: AsLink | AsButton) {
  const { variant = "primary", size = "md", arrow, className, children } = props;
  const classes = clsx(base, sizes[size], variants[variant], className);
  const inner = (
    <>
      <span
        aria-hidden
        className={clsx(
          "absolute inset-0 -z-10 origin-bottom scale-y-0 rounded-full transition-transform duration-500 ease-out-expo group-hover/btn:scale-y-100",
          sweep[variant],
        )}
      />
      <span>{children}</span>
      {arrow && <Arrow />}
    </>
  );

  if (props.href) {
    if (props.external) {
      return (
        <a href={props.href} target="_blank" rel="noopener noreferrer" className={classes}>
          {inner}
        </a>
      );
    }
    return (
      <Link href={props.href} className={classes}>
        {inner}
      </Link>
    );
  }
  return (
    <button type={props.type ?? "button"} onClick={props.onClick} className={classes}>
      {inner}
    </button>
  );
}

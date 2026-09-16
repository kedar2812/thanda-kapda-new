import clsx from "clsx";

type Side = "left" | "right" | "top" | "bottom";

/** Deterministic pseudo-random so the server and client draw the same tear. */
function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Builds an SVG path in a 0..1000 box that covers the box except for a
 * fibrous tear along one side. Amplitude is a fraction of the box.
 */
function tearPath(side: Side, seed: number, amplitude = 0.028, segments = 72) {
  const rnd = mulberry32(seed);
  const amp = amplitude * 1000;
  let drift = 0;
  const edge: string[] = [];
  for (let i = 0; i <= segments; i++) {
    const t = (i / segments) * 1000;
    drift += (rnd() - 0.5) * amp * 0.9;
    drift *= 0.72;
    const jag = (rnd() - 0.5) * amp * 0.5;
    const o = amp * 0.75 + drift + jag;
    let x: number;
    let y: number;
    switch (side) {
      case "left":
        x = o;
        y = t;
        break;
      case "right":
        x = 1000 - o;
        y = t;
        break;
      case "top":
        x = t;
        y = o;
        break;
      default:
        x = t;
        y = 1000 - o;
    }
    edge.push(`${x.toFixed(1)} ${y.toFixed(1)}`);
  }
  const corners: Record<Side, string> = {
    left: "L1000 1000 L1000 0",
    right: "L0 1000 L0 0",
    top: "L1000 1000 L0 1000",
    bottom: "L1000 0 L0 0",
  };
  return `M${edge[0]} L${edge.slice(1).join(" L")} ${corners[side]} Z`;
}

function maskUrl(side: Side, seed: number, amplitude?: number) {
  const d = tearPath(side, seed, amplitude);
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1000 1000' preserveAspectRatio='none'><path d='${d}'/></svg>`;
  return `url("data:image/svg+xml;utf8,${encodeURIComponent(svg)}")`;
}

const maskProps = (url: string): React.CSSProperties => ({
  WebkitMaskImage: url,
  maskImage: url,
  WebkitMaskSize: "100% 100%",
  maskSize: "100% 100%",
  WebkitMaskRepeat: "no-repeat",
  maskRepeat: "no-repeat",
});

/**
 * A block of colour with a torn paper edge on one side. Two stacked layers,
 * a pale fibrous underlayer and the coloured sheet, sell the effect.
 */
export function TornPanel({
  side = "left",
  seed = 7,
  className,
  children,
  color = "bg-forest",
  under = "bg-cream-50",
  amplitude,
}: {
  side?: Side;
  seed?: number;
  className?: string;
  children?: React.ReactNode;
  color?: string;
  under?: string;
  amplitude?: number;
}) {
  const front = maskUrl(side, seed, amplitude);
  const back = maskUrl(side, seed + 13, (amplitude ?? 0.028) * 1.3);
  const positioned = /\b(absolute|fixed|sticky)\b/.test(className ?? "");
  return (
    <div className={clsx(!positioned && "relative", className)} aria-hidden={children ? undefined : true}>
      <div className={clsx("absolute inset-0", under)} style={maskProps(back)} />
      <div className={clsx("absolute inset-0", color)} style={maskProps(front)} />
      {children && <div className="relative h-full w-full">{children}</div>}
    </div>
  );
}

import { MAP_H, MAP_W, map } from "@/components/map/geo";
import { MapAnimation } from "@/components/map/MapAnimation";

export function WorldMap({ className }: { className?: string }) {
  return (
    <div className={className}>
      <svg
        viewBox={`0 0 ${MAP_W} ${MAP_H}`}
        className="h-auto w-full overflow-visible"
        role="img"
        aria-label="World map showing India as the home market and the regions Thanda Kapda Co. is expanding towards"
      >
        <defs>
          {map.arcs.map((d, i) => (
            <mask key={i} id={`arc-mask-${i}`} maskUnits="userSpaceOnUse" x="0" y="0" width={MAP_W} height={MAP_H}>
              <path d={d} pathLength={1} fill="none" stroke="#fff" strokeWidth="6" strokeDasharray="1" strokeDashoffset="1" data-arc-mask />
            </mask>
          ))}
          <path id="map-india" d={map.india} />
          <radialGradient id="origin-glow" r="50%">
            <stop offset="0%" stopColor="#e3c27d" stopOpacity="0.45" />
            <stop offset="100%" stopColor="#e3c27d" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Land: sepia ink on aged paper, a faint offset shadow for print depth. The
            rest of the world is a separate cached file (it is most of the bytes);
            India stays inline because it animates. */}
        <image href="/map-land.svg" x="0" y="0" width={MAP_W} height={MAP_H} />
        <use href="#map-india" transform="translate(1.2 1.6)" fill="#3a2a10" opacity="0.2" />
        <use href="#map-india" data-india fill="#143829" stroke="#0c2419" strokeWidth="0.5" strokeLinejoin="round" />

        {/* Continent labels (small caps) and ocean labels (italic), positioned by projection */}
        {map.labels.map((l) => (
          <text
            key={l.key}
            data-map-label
            x={l.x}
            y={l.y}
            textAnchor="middle"
            fill={l.ocean ? "#6b5733" : "#3d3320"}
            fillOpacity={l.ocean ? 0.7 : 0.75}
            fontSize={l.ocean ? 9.5 : 10}
            fontStyle={l.ocean ? "italic" : "normal"}
            fontWeight={l.ocean ? 400 : 700}
            letterSpacing={l.ocean ? 1 : 2}
            fontFamily={l.ocean ? "var(--font-fraunces), serif" : "var(--font-hanken), sans-serif"}
          >
            {l.text.split("\n").map((line, i) => (
              <tspan key={line} x={l.x} dy={i === 0 ? 0 : 11}>
                {l.ocean ? line : line.toUpperCase()}
              </tspan>
            ))}
          </text>
        ))}

        {/* Arcs */}
        <g>
          {map.arcs.map((d, i) => (
            <path key={i} d={d} mask={`url(#arc-mask-${i})`} fill="none" stroke="#143829" strokeOpacity="0.75" strokeWidth="1.1" strokeDasharray="3 4" strokeLinecap="round" />
          ))}
        </g>

        {/* Origin */}
        <g data-origin transform={`translate(${map.origin.x} ${map.origin.y})`}>
          <circle r="30" fill="url(#origin-glow)" data-origin-glow />
          <circle r="7" fill="none" stroke="#e3c27d" strokeWidth="1.2" data-origin-beat />
          <circle r="7" fill="none" stroke="#e3c27d" strokeWidth="1.4" data-origin-ring />
          <circle r="3.2" fill="#e3c27d" />
        </g>

        {/* Pins */}
        {map.points.map((p, i) => (
          <g key={p.name} data-pin transform={`translate(${p.x} ${p.y})`} data-index={i}>
            <path d="M0 0c-4-6-7-9-7-13a7 7 0 0 1 14 0c0 4-3 7-7 13Z" fill="#143829" />
            <circle cy="-13" r="2.4" fill="#f4ecdc" />
          </g>
        ))}

        <MapAnimation />
      </svg>
    </div>
  );
}

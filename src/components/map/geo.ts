import { geoNaturalEarth1, geoPath } from "d3-geo";
import * as topojson from "topojson-client";
import type { FeatureCollection, Geometry } from "geojson";
import type { Topology, GeometryCollection } from "topojson-specification";
/*
 * Boundaries come from Natural Earth's India point-of-view dataset
 * (ne_10m_admin_0_countries_ind), so India is drawn with its official
 * boundaries, including all of Jammu & Kashmir, Ladakh and Arunachal Pradesh.
 * India is kept at high detail; the rest of the world is simplified.
 */
import worldRest from "@/data/geo/world-rest.json";
import indiaGeo from "@/data/geo/india.json";
import { origin, pins } from "@/data/journey";

export const MAP_W = 1000;
export const MAP_H = 500;

type CountryProps = { iso: string };
type WorldTopo = Topology<{ [key: string]: GeometryCollection<CountryProps> }>;

/** Land paths, India, projected pins and arcs. Computed once at build time. */
export function buildMap() {
  const topo = worldRest as unknown as WorldTopo;
  const objectName = Object.keys(topo.objects)[0];
  const rest = topojson.feature(topo, topo.objects[objectName]) as unknown as FeatureCollection<Geometry, CountryProps>;
  const indiaTopo = indiaGeo as unknown as WorldTopo;
  const india = topojson.feature(indiaTopo, indiaTopo.objects[Object.keys(indiaTopo.objects)[0]]) as unknown as FeatureCollection<
    Geometry,
    CountryProps
  >;

  const all: FeatureCollection<Geometry, CountryProps> = {
    type: "FeatureCollection",
    features: [...rest.features, ...india.features],
  };

  const projection = geoNaturalEarth1().fitExtent(
    [
      [8, 8],
      [MAP_W - 8, MAP_H - 8],
    ],
    all,
  );
  const path = geoPath(projection).digits(1);

  const project = (lon: number, lat: number) => {
    const p = projection([lon, lat]);
    return p ? { x: Number(p[0].toFixed(1)), y: Number(p[1].toFixed(1)) } : { x: 0, y: 0 };
  };

  const o = project(origin.lon, origin.lat);
  const points = pins.map((pin) => ({ ...pin, ...project(pin.lon, pin.lat) }));

  // Quadratic arcs that bow upward, longer arcs bowing more.
  const arcs = points.map((p) => {
    const mx = (o.x + p.x) / 2;
    const my = (o.y + p.y) / 2;
    const dx = p.x - o.x;
    const dy = p.y - o.y;
    const dist = Math.hypot(dx, dy);
    const bow = Math.min(120, dist * 0.22);
    // Normal pointing "up" on screen.
    const nx = -dy / (dist || 1);
    const ny = dx / (dist || 1);
    const sign = ny < 0 ? 1 : -1;
    const cx = mx + nx * bow * sign;
    const cy = my + ny * bow * sign;
    return `M${o.x} ${o.y} Q${cx.toFixed(1)} ${cy.toFixed(1)} ${p.x} ${p.y}`;
  });

  return {
    labels: [
      { text: "North America", lon: -102, lat: 44 },
      { text: "South America", lon: -60, lat: -14 },
      { text: "Europe", lon: 15, lat: 55 },
      { text: "Africa", lon: 20, lat: 5 },
      { text: "Asia", lon: 95, lat: 50 },
      { text: "Australia", lon: 134, lat: -25 },
      { text: "Pacific\nOcean", lon: -140, lat: 5, ocean: true },
      { text: "Atlantic\nOcean", lon: -38, lat: 22, ocean: true },
      { text: "Indian\nOcean", lon: 80, lat: -22, ocean: true },
      { text: "Pacific\nOcean", lon: 165, lat: 8, ocean: true },
    ].map((l, i) => ({ ...l, text: l.text, key: i, ...project(l.lon, l.lat) })),
    land: path(rest) ?? "",
    india: path(india) ?? "",
    origin: o,
    points,
    arcs,
  };
}

export const map = buildMap();

/** The rest of the world as a standalone SVG, served as /map-land.svg. */
export function landSvg() {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${MAP_W} ${MAP_H}"><path d="${map.land}" transform="translate(1.2 1.6)" fill="#7a5a2a" opacity="0.12"/><path d="${map.land}" fill="#d6c197" stroke="#a88b58" stroke-width="0.45" stroke-linejoin="round"/></svg>`;
}

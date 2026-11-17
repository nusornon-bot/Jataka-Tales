import { LatLon, RouteLegMetrics, UnitSystem, Waypoint } from '../types/marine';

const EARTH_RADIUS_NM = 3440.065;

export function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

export function toDeg(rad: number): number {
  return (rad * 180) / Math.PI;
}

/**
 * Great-circle Haversine distance in Nautical Miles (NM)
 */
export function distanceNm(a: LatLon, b: LatLon): number {
  const dLat = toRad(b.lat - a.lat);
  const dLon = toRad(b.lon - a.lon);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);

  const sinLat = Math.sin(dLat / 2);
  const sinLon = Math.sin(dLon / 2);
  const h = sinLat * sinLat + Math.cos(lat1) * Math.cos(lat2) * sinLon * sinLon;
  const c = 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
  return EARTH_RADIUS_NM * c;
}

/**
 * Initial true bearing from point a to point b in degrees [0, 360)
 */
export function bearingDeg(a: LatLon, b: LatLon): number {
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const dLon = toRad(b.lon - a.lon);

  const y = Math.sin(dLon) * Math.cos(lat2);
  const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLon);
  const brng = toDeg(Math.atan2(y, x));
  return (brng + 360) % 360;
}

export function trueToMagnetic(trueDeg: number, variation: number): number {
  // East variation is positive (True = Mag + Var => Mag = True - Var)
  return (trueDeg - variation + 360) % 360;
}

export function normalizeAngleDelta(targetDeg: number, currentDeg: number): number {
  let diff = ((targetDeg - currentDeg + 540) % 360) - 180;
  return diff;
}

/**
 * Format coordinate in standard maritime Degrees Decimal Minutes (DD°MM.mmm' N/S/E/W)
 */
export function formatDDM(value: number, axis: 'lat' | 'lon'): string {
  const hemi =
    axis === 'lat' ? (value >= 0 ? 'N' : 'S') : value >= 0 ? 'E' : 'W';
  const abs = Math.abs(value);
  const deg = Math.floor(abs);
  const min = (abs - deg) * 60;
  const degPad = axis === 'lat' ? String(deg).padStart(2, '0') : String(deg).padStart(3, '0');
  const minStr = min.toFixed(3).padStart(6, '0');
  return `${degPad}°${minStr}'${hemi}`;
}

export function formatDistance(nm: number, unit: UnitSystem): { value: string; label: string } {
  if (unit === 'metric') {
    const km = nm * 1.852;
    return { value: km.toFixed(2), label: 'km' };
  }
  if (unit === 'statute') {
    const mi = nm * 1.15078;
    return { value: mi.toFixed(2), label: 'mi' };
  }
  return { value: nm.toFixed(2), label: 'NM' };
}

export function formatSpeed(knots: number, unit: UnitSystem): { value: string; label: string } {
  if (unit === 'metric') {
    return { value: (knots * 1.852).toFixed(1), label: 'km/h' };
  }
  if (unit === 'statute') {
    return { value: (knots * 1.15078).toFixed(1), label: 'mph' };
  }
  return { value: knots.toFixed(1), label: 'kn' };
}

export function formatDurationMinutes(totalMinutes: number): string {
  if (!Number.isFinite(totalMinutes) || totalMinutes <= 0) return '00:00';
  const mins = Math.round(totalMinutes);
  const hrs = Math.floor(mins / 60);
  const rem = mins % 60;
  if (hrs >= 100) return `${hrs}h ${String(rem).padStart(2, '0')}m`;
  return `${String(hrs).padStart(2, '0')}:${String(rem).padStart(2, '0')}`;
}

export function computeRouteLegs(
  waypoints: Waypoint[],
  speedKnots: number,
  magneticVariation: number
): RouteLegMetrics[] {
  let cumulativeDistanceNm = 0;
  let cumulativeMinutes = 0;
  const safeSpeed = Math.max(speedKnots, 0.5);

  return waypoints.map((wp, idx) => {
    if (idx === 0) {
      return {
        waypoint: wp,
        legDistanceNm: 0,
        cumulativeDistanceNm: 0,
        trueBearingDeg: 0,
        magBearingDeg: 0,
        legMinutes: 0,
        cumulativeMinutes: 0,
      };
    }
    const prev = waypoints[idx - 1];
    const legNm = distanceNm(prev, wp);
    const trueBrg = bearingDeg(prev, wp);
    const magBrg = trueToMagnetic(trueBrg, magneticVariation);
    const legMin = (legNm / safeSpeed) * 60;

    cumulativeDistanceNm += legNm;
    cumulativeMinutes += legMin;

    return {
      waypoint: wp,
      legDistanceNm: legNm,
      cumulativeDistanceNm,
      trueBearingDeg: trueBrg,
      magBearingDeg: magBrg,
      legMinutes: legMin,
      cumulativeMinutes,
    };
  });
}

/**
 * Advance a lat/lon point along a bearing by distanceNm
 */
export function moveLatLon(origin: LatLon, trueBearing: number, distNm: number): LatLon {
  const angularDist = distNm / EARTH_RADIUS_NM;
  const brng = toRad(trueBearing);
  const lat1 = toRad(origin.lat);
  const lon1 = toRad(origin.lon);

  const lat2 = Math.asin(
    Math.sin(lat1) * Math.cos(angularDist) +
      Math.cos(lat1) * Math.sin(angularDist) * Math.cos(brng)
  );
  const lon2 =
    lon1 +
    Math.atan2(
      Math.sin(brng) * Math.sin(angularDist) * Math.cos(lat1),
      Math.cos(angularDist) - Math.sin(lat1) * Math.sin(lat2)
    );

  return {
    lat: toDeg(lat2),
    lon: toDeg(lon2),
  };
}

/**
 * Generate standard GPX 1.1 XML string for export to Garmin GPSMAP 86i
 */
export function generateGpxXml(sectorName: string, waypoints: Waypoint[]): string {
  const escapedName = sectorName.replace(/[<>&'"]/g, '');
  const nowIso = new Date().toISOString();

  const wptNodes = waypoints
    .map(
      (wp) => `  <wpt lat="${wp.lat.toFixed(6)}" lon="${wp.lon.toFixed(6)}">
    <name>${wp.name.replace(/[<>&'"]/g, '')}</name>
    <sym>${wp.symbol}</sym>
    ${wp.notes ? `<desc>${wp.notes.replace(/[<>&'"]/g, '')}</desc>` : ''}
  </wpt>`
    )
    .join('\n');

  const rtePoints = waypoints
    .map(
      (wp) => `    <rtept lat="${wp.lat.toFixed(6)}" lon="${wp.lon.toFixed(6)}">
      <name>${wp.name.replace(/[<>&'"]/g, '')}</name>
    </rtept>`
    )
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="86I Marine Workbench" xmlns="http://www.topografix.com/GPX/1/1">
  <metadata>
    <name>${escapedName} Route</name>
    <time>${nowIso}</time>
  </metadata>
${wptNodes}
  <rte>
    <name>${escapedName} Passage</name>
${rtePoints}
  </rte>
</gpx>
`;
}

/**
 * Parse uploaded GPX XML into Waypoint[]
 */
export function parseGpxXml(xmlText: string): Waypoint[] {
  const parser = new DOMParser();
  const doc = parser.parseFromString(xmlText, 'application/xml');
  const parserError = doc.querySelector('parsererror');
  if (parserError) {
    throw new Error('Invalid GPX XML file');
  }

  const wpts = Array.from(doc.querySelectorAll('wpt'));
  const rtepts = Array.from(doc.querySelectorAll('rtept'));
  const trkpts = Array.from(doc.querySelectorAll('trkpt'));

  const nodes = wpts.length > 0 ? wpts : rtepts.length > 0 ? rtepts : trkpts;
  if (nodes.length === 0) {
    throw new Error('No waypoints, route points, or track points found in GPX');
  }

  return nodes.slice(0, 40).map((node, i) => {
    const lat = parseFloat(node.getAttribute('lat') || '0');
    const lon = parseFloat(node.getAttribute('lon') || '0');
    const nameEl = node.querySelector('name');
    const descEl = node.querySelector('desc');
    const symEl = node.querySelector('sym');
    const rawSym = (symEl?.textContent || '').toLowerCase();

    let symbol: Waypoint['symbol'] = 'custom';
    if (rawSym.includes('anchor')) symbol = 'anchorage';
    else if (rawSym.includes('buoy')) symbol = 'buoy';
    else if (rawSym.includes('marina') || rawSym.includes('harbor')) symbol = 'marina';
    else if (rawSym.includes('hazard') || rawSym.includes('danger')) symbol = 'hazard';

    return {
      id: `gpx-${Date.now()}-${i}`,
      name: (nameEl?.textContent || `WPT ${String(i + 1).padStart(2, '0')}`).slice(0, 20),
      lat,
      lon,
      symbol,
      notes: descEl?.textContent || 'Imported from GPX',
    };
  });
}

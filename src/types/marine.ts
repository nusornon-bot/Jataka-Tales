export type WaypointSymbol = 'anchorage' | 'buoy' | 'marina' | 'hazard' | 'custom';

export type UnitSystem = 'nautical' | 'metric' | 'statute';

export type HandheldPage = 'trip' | 'compass' | 'satellites' | 'inreach';

export type ChartInteractionMode = 'plot' | 'pan';

export interface LatLon {
  lat: number;
  lon: number;
}

export interface Waypoint {
  id: string;
  name: string;
  lat: number;
  lon: number;
  symbol: WaypointSymbol;
  notes?: string;
  depthMeters?: number;
}

export interface NavAid {
  id: string;
  code: string;
  name: string;
  lat: number;
  lon: number;
  kind: 'lighthouse' | 'buoy-red' | 'buoy-green' | 'sector';
  characteristic?: string;
}

export interface LandPolygon {
  id: string;
  name: string;
  points: LatLon[];
}

export interface DepthContour {
  id: string;
  depthMeters: number;
  points: LatLon[];
}

export interface TideBaroPoint {
  hourOffset: number;
  label: string;
  pressureHpa: number;
  tideMeters: number;
}

export interface ChartSector {
  id: string;
  name: string;
  regionLabel: string;
  chartCode: string;
  magneticVariation: number; // East positive, West negative
  bounds: {
    minLat: number;
    maxLat: number;
    minLon: number;
    maxLon: number;
  };
  landmasses: LandPolygon[];
  contours: DepthContour[];
  navAids: NavAid[];
  defaultWaypoints: Waypoint[];
  weatherSeries: TideBaroPoint[];
}

export interface InReachMessage {
  id: string;
  direction: 'outbound' | 'inbound';
  recipient: string;
  body: string;
  timestamp: string;
  lat: number;
  lon: number;
  status: 'Queued' | 'Sent via Iridium' | 'Delivered';
}

export interface RouteLegMetrics {
  waypoint: Waypoint;
  legDistanceNm: number;
  cumulativeDistanceNm: number;
  trueBearingDeg: number;
  magBearingDeg: number;
  legMinutes: number;
  cumulativeMinutes: number;
}

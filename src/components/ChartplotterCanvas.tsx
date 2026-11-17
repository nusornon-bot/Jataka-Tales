import React, { useRef, useState } from 'react';
import {
  Crosshair,
  Layers,
  Move,
  Plus,
  Minus,
  RotateCcw,
  Anchor,
} from 'lucide-react';
import {
  ChartInteractionMode,
  ChartSector,
  LatLon,
  UnitSystem,
  Waypoint,
} from '../types/marine';
import {
  bearingDeg,
  distanceNm,
  formatDDM,
  formatDistance,
  trueToMagnetic,
} from '../utils/navigation';

interface ChartplotterCanvasProps {
  sector: ChartSector;
  waypoints: Waypoint[];
  activeWaypointId: string | null;
  vesselPos: LatLon;
  headingDeg: number;
  wakeTrail: LatLon[];
  zoom: number;
  panOffset: { x: number; y: number };
  onZoomChange: (zoom: number) => void;
  onPanChange: (offset: { x: number; y: number }) => void;
  mode: ChartInteractionMode;
  onModeChange: (mode: ChartInteractionMode) => void;
  unitSystem: UnitSystem;
  onPlotWaypoint: (latLon: LatLon) => void;
  onMoveWaypoint: (id: string, latLon: LatLon) => void;
  onSelectWaypoint: (id: string) => void;
}

const SVG_W = 1000;
const SVG_H = 620;

export const ChartplotterCanvas: React.FC<ChartplotterCanvasProps> = ({
  sector,
  waypoints,
  activeWaypointId,
  vesselPos,
  headingDeg,
  wakeTrail,
  zoom,
  panOffset,
  onZoomChange,
  onPanChange,
  mode,
  onModeChange,
  unitSystem,
  onPlotWaypoint,
  onMoveWaypoint,
  onSelectWaypoint,
}) => {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [layers, setLayers] = useState({
    contours: true,
    navAids: true,
    grid: true,
    wake: true,
  });
  const [showLayerMenu, setShowLayerMenu] = useState(false);
  const [cursorLatLon, setCursorLatLon] = useState<LatLon | null>(null);
  const [draggingWaypointId, setDraggingWaypointId] = useState<string | null>(null);
  const [isPanning, setIsPanning] = useState(false);
  const panStartRef = useRef<{ x: number; y: number; origX: number; origY: number } | null>(
    null
  );
  const didDragRef = useRef(false);

  const { minLat, maxLat, minLon, maxLon } = sector.bounds;
  const lonSpan = maxLon - minLon;
  const latSpan = maxLat - minLat;

  const toBaseXY = (pt: LatLon) => {
    const x = ((pt.lon - minLon) / lonSpan) * SVG_W;
    const y = ((maxLat - pt.lat) / latSpan) * SVG_H;
    return { x, y };
  };

  const clientToLatLon = (clientX: number, clientY: number): LatLon | null => {
    const svg = svgRef.current;
    if (!svg) return null;
    const rect = svg.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return null;

    const svgX = ((clientX - rect.left) / rect.width) * SVG_W;
    const svgY = ((clientY - rect.top) / rect.height) * SVG_H;

    const cx = SVG_W / 2;
    const cy = SVG_H / 2;
    const baseX = (svgX - cx - panOffset.x) / zoom + cx;
    const baseY = (svgY - cy - panOffset.y) / zoom + cy;

    const lon = minLon + (baseX / SVG_W) * lonSpan;
    const lat = maxLat - (baseY / SVG_H) * latSpan;
    return { lat, lon };
  };

  const handlePointerDown = (e: React.PointerEvent<SVGSVGElement>) => {
    if (draggingWaypointId) return;
    didDragRef.current = false;

    if (mode === 'pan' || e.button === 1 || e.shiftKey) {
      setIsPanning(true);
      panStartRef.current = {
        x: e.clientX,
        y: e.clientY,
        origX: panOffset.x,
        origY: panOffset.y,
      };
    }
  };

  const handlePointerMove = (e: React.PointerEvent<SVGSVGElement>) => {
    const ll = clientToLatLon(e.clientX, e.clientY);
    if (ll) setCursorLatLon(ll);

    if (draggingWaypointId && ll) {
      didDragRef.current = true;
      onMoveWaypoint(draggingWaypointId, ll);
      return;
    }

    if (isPanning && panStartRef.current && svgRef.current) {
      const rect = svgRef.current.getBoundingClientRect();
      const dx = ((e.clientX - panStartRef.current.x) / rect.width) * SVG_W;
      const dy = ((e.clientY - panStartRef.current.y) / rect.height) * SVG_H;
      if (Math.abs(dx) > 3 || Math.abs(dy) > 3) {
        didDragRef.current = true;
      }
      onPanChange({
        x: panStartRef.current.origX + dx,
        y: panStartRef.current.origY + dy,
      });
    }
  };

  const handlePointerUp = (e: React.PointerEvent<SVGSVGElement>) => {
    if (draggingWaypointId) {
      setDraggingWaypointId(null);
      return;
    }
    if (isPanning) {
      setIsPanning(false);
      panStartRef.current = null;
      if (didDragRef.current) return;
    }

    if (mode === 'plot' && !didDragRef.current) {
      const ll = clientToLatLon(e.clientX, e.clientY);
      if (ll) {
        onPlotWaypoint(ll);
      }
    }
  };

  const handleWheel = (e: React.WheelEvent<SVGSVGElement>) => {
    e.preventDefault();
    const factor = e.deltaY < 0 ? 1.15 : 0.87;
    const nextZoom = Math.max(0.75, Math.min(4.5, Number((zoom * factor).toFixed(2))));
    onZoomChange(nextZoom);
  };

  const lonTicks = Array.from({ length: 5 }, (_, i) => minLon + (lonSpan * (i + 1)) / 6);
  const latTicks = Array.from({ length: 4 }, (_, i) => minLat + (latSpan * (i + 1)) / 5);

  const activeWaypoint = waypoints.find((w) => w.id === activeWaypointId) || null;
  const vesselXY = toBaseXY(vesselPos);
  const activeTargetXY = activeWaypoint ? toBaseXY(activeWaypoint) : null;

  const cursorDist = cursorLatLon ? distanceNm(vesselPos, cursorLatLon) : null;
  const cursorDistFmt = cursorDist !== null ? formatDistance(cursorDist, unitSystem) : null;
  const cursorMagBrg = cursorLatLon
    ? trueToMagnetic(bearingDeg(vesselPos, cursorLatLon), sector.magneticVariation)
    : null;

  const routePathD =
    waypoints.length > 1
      ? waypoints
          .map((w, idx) => {
            const p = toBaseXY(w);
            return `${idx === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`;
          })
          .join(' ')
      : '';

  const wakePathD =
    wakeTrail.length > 1
      ? wakeTrail
          .map((pt, idx) => {
            const p = toBaseXY(pt);
            return `${idx === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`;
          })
          .join(' ')
      : '';

  const transformStr = `translate(${SVG_W / 2 + panOffset.x}, ${SVG_H / 2 + panOffset.y}) scale(${zoom}) translate(${-SVG_W / 2}, ${-SVG_H / 2})`;

  return (
    <div className="relative bg-[#08121D] border border-[#1C2A3B] rounded-xl overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-2.5 bg-[#0C1520] border-b border-[#1C2A3B]">
        <div className="flex items-center gap-3 text-xs">
          <span className="font-semibold text-slate-100">{sector.name}</span>
          <span className="text-slate-600" aria-hidden="true">·</span>
          <span className="text-slate-400 font-mono">{sector.chartCode}</span>
          <span className="text-slate-600 hidden sm:inline" aria-hidden="true">·</span>
          <span className="text-slate-400 font-mono hidden sm:inline tabular-nums">
            VAR {Math.abs(sector.magneticVariation).toFixed(1)}°
            {sector.magneticVariation >= 0 ? 'E' : 'W'}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center p-0.5 bg-[#070D14] border border-[#1C2A3B] rounded-md">
            <button
              type="button"
              onClick={() => onModeChange('plot')}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded transition-colors whitespace-nowrap shrink-0 ${
                mode === 'plot'
                  ? 'bg-cyan-500/20 text-cyan-300'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Crosshair className="w-3.5 h-3.5" aria-hidden="true" />
              Plot Waypoint
            </button>
            <button
              type="button"
              onClick={() => onModeChange('pan')}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded transition-colors whitespace-nowrap shrink-0 ${
                mode === 'pan'
                  ? 'bg-cyan-500/20 text-cyan-300'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Move className="w-3.5 h-3.5" aria-hidden="true" />
              Pan Chart
            </button>
          </div>

          <div className="relative">
            <button
              type="button"
              onClick={() => setShowLayerMenu((v) => !v)}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-slate-300 bg-[#111D2B] border border-[#1C2A3B] rounded-md hover:text-white transition-colors whitespace-nowrap shrink-0"
            >
              <Layers className="w-3.5 h-3.5" aria-hidden="true" />
              Layers
            </button>
            {showLayerMenu && (
              <div className="absolute right-0 mt-1.5 w-44 bg-[#0C1520] border border-[#26384E] rounded-lg p-2 shadow-xl z-20 space-y-1">
                {(
                  [
                    { key: 'contours', label: 'Depth Contours' },
                    { key: 'navAids', label: 'Lights & Buoys' },
                    { key: 'grid', label: 'Lat/Lon Graticule' },
                    { key: 'wake', label: 'Vessel Wake' },
                  ] as const
                ).map((item) => (
                  <label
                    key={item.key}
                    className="flex items-center justify-between px-2 py-1 text-xs text-slate-300 hover:bg-[#132030] rounded cursor-pointer"
                  >
                    <span>{item.label}</span>
                    <input
                      type="checkbox"
                      checked={layers[item.key]}
                      onChange={() =>
                        setLayers((prev) => ({ ...prev, [item.key]: !prev[item.key] }))
                      }
                      className="accent-cyan-400"
                    />
                  </label>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="relative w-full aspect-[16/10] min-h-[380px] max-h-[540px]">
        <svg
          ref={svgRef}
          viewBox={`0 0 ${SVG_W} ${SVG_H}`}
          preserveAspectRatio="xMidYMid slice"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerLeave={() => {
            setCursorLatLon(null);
            setIsPanning(false);
            setDraggingWaypointId(null);
          }}
          onWheel={handleWheel}
          className={`w-full h-full block touch-none ${
            mode === 'plot' ? 'cursor-crosshair' : isPanning ? 'cursor-grabbing' : 'cursor-grab'
          }`}
        >
          <defs>
            <pattern
              id="land-hatch"
              width="8"
              height="8"
              patternTransform="rotate(45 0 0)"
              patternUnits="userSpaceOnUse"
            >
              <line x1="0" y1="0" x2="0" y2="8" stroke="#1E2D3D" strokeWidth="1" />
            </pattern>
          </defs>

          <rect x="0" y="0" width={SVG_W} height={SVG_H} fill="#071320" />

          <g transform={transformStr}>
            {layers.grid && (
              <g>
                {lonTicks.map((lon) => {
                  const { x } = toBaseXY({ lat: minLat, lon });
                  return (
                    <g key={`lon-${lon}`}>
                      <line
                        x1={x}
                        y1={0}
                        x2={x}
                        y2={SVG_H}
                        stroke="#132539"
                        strokeWidth={1 / zoom}
                        strokeDasharray={`${4 / zoom} ${4 / zoom}`}
                      />
                      <text
                        x={x + 4 / zoom}
                        y={16 / zoom}
                        fill="#4B6682"
                        fontSize={10 / zoom}
                        fontFamily="IBM Plex Mono, monospace"
                      >
                        {formatDDM(lon, 'lon')}
                      </text>
                    </g>
                  );
                })}
                {latTicks.map((lat) => {
                  const { y } = toBaseXY({ lat, lon: minLon });
                  return (
                    <g key={`lat-${lat}`}>
                      <line
                        x1={0}
                        y1={y}
                        x2={SVG_W}
                        y2={y}
                        stroke="#132539"
                        strokeWidth={1 / zoom}
                        strokeDasharray={`${4 / zoom} ${4 / zoom}`}
                      />
                      <text
                        x={8 / zoom}
                        y={y - 5 / zoom}
                        fill="#4B6682"
                        fontSize={10 / zoom}
                        fontFamily="IBM Plex Mono, monospace"
                      >
                        {formatDDM(lat, 'lat')}
                      </text>
                    </g>
                  );
                })}
              </g>
            )}

            {layers.contours &&
              sector.contours.map((contour) => {
                const d = contour.points
                  .map((pt, idx) => {
                    const p = toBaseXY(pt);
                    return `${idx === 0 ? 'M' : 'L'} ${p.x} ${p.y}`;
                  })
                  .join(' ');
                const midPt = toBaseXY(
                  contour.points[Math.floor(contour.points.length / 2)]
                );
                return (
                  <g key={contour.id}>
                    <path
                      d={d}
                      fill="none"
                      stroke="#184160"
                      strokeWidth={1.5 / zoom}
                      strokeDasharray={`${5 / zoom} ${3 / zoom}`}
                    />
                    <text
                      x={midPt.x}
                      y={midPt.y - 4 / zoom}
                      fill="#387CA8"
                      fontSize={9 / zoom}
                      fontFamily="IBM Plex Mono, monospace"
                    >
                      {contour.depthMeters}m
                    </text>
                  </g>
                );
              })}

            {sector.landmasses.map((land) => {
              const pts = land.points
                .map((pt) => {
                  const p = toBaseXY(pt);
                  return `${p.x},${p.y}`;
                })
                .join(' ');
              const avgX =
                land.points.reduce((acc, pt) => acc + toBaseXY(pt).x, 0) /
                land.points.length;
              const avgY =
                land.points.reduce((acc, pt) => acc + toBaseXY(pt).y, 0) /
                land.points.length;
              return (
                <g key={land.id}>
                  <polygon
                    points={pts}
                    fill="#141F2B"
                    stroke="#2A4057"
                    strokeWidth={1.5 / zoom}
                  />
                  <polygon points={pts} fill="url(#land-hatch)" opacity="0.45" />
                  <text
                    x={avgX}
                    y={avgY}
                    textAnchor="middle"
                    fill="#6C859E"
                    fontSize={10 / zoom}
                    fontFamily="IBM Plex Sans, sans-serif"
                    fontWeight="600"
                  >
                    {land.name}
                  </text>
                </g>
              );
            })}

            {layers.navAids &&
              sector.navAids.map((aid) => {
                const p = toBaseXY(aid);
                const color =
                  aid.kind === 'lighthouse'
                    ? '#FBBF24'
                    : aid.kind === 'buoy-red'
                    ? '#F87171'
                    : '#34D399';
                return (
                  <g key={aid.id}>
                    {aid.kind === 'lighthouse' && (
                      <circle
                        cx={p.x}
                        cy={p.y}
                        r={12 / zoom}
                        fill="none"
                        stroke="#FBBF24"
                        strokeOpacity="0.28"
                        strokeWidth={1 / zoom}
                      />
                    )}
                    <circle
                      cx={p.x}
                      cy={p.y}
                      r={3.5 / zoom}
                      fill={color}
                      stroke="#071320"
                      strokeWidth={1 / zoom}
                    />
                    <text
                      x={p.x + 6 / zoom}
                      y={p.y + 3 / zoom}
                      fill="#94A3B8"
                      fontSize={9 / zoom}
                      fontFamily="IBM Plex Mono, monospace"
                    >
                      {aid.code} {aid.characteristic ? `(${aid.characteristic})` : ''}
                    </text>
                  </g>
                );
              })}

            {layers.wake && wakePathD && (
              <path
                d={wakePathD}
                fill="none"
                stroke="#0EA5E9"
                strokeOpacity="0.45"
                strokeWidth={1.5 / zoom}
                strokeDasharray={`${2 / zoom} ${3 / zoom}`}
              />
            )}

            {routePathD && (
              <path
                d={routePathD}
                fill="none"
                stroke="#06B6D4"
                strokeWidth={2.2 / zoom}
                strokeLinejoin="round"
              />
            )}

            {activeTargetXY && (
              <line
                x1={vesselXY.x}
                y1={vesselXY.y}
                x2={activeTargetXY.x}
                y2={activeTargetXY.y}
                stroke="#F59E0B"
                strokeWidth={1.5 / zoom}
                strokeDasharray={`${5 / zoom} ${4 / zoom}`}
              />
            )}

            {waypoints.map((wp, idx) => {
              const p = toBaseXY(wp);
              const isActive = wp.id === activeWaypointId;
              const markerColor =
                wp.symbol === 'hazard'
                  ? '#F43F5E'
                  : wp.symbol === 'anchorage'
                  ? '#10B981'
                  : isActive
                  ? '#F59E0B'
                  : '#22D3EE';

              return (
                <g
                  key={wp.id}
                  onPointerDown={(e) => {
                    e.stopPropagation();
                    onSelectWaypoint(wp.id);
                    setDraggingWaypointId(wp.id);
                  }}
                  className="cursor-pointer"
                >
                  {isActive && (
                    <circle
                      cx={p.x}
                      cy={p.y}
                      r={13 / zoom}
                      fill="none"
                      stroke="#F59E0B"
                      strokeWidth={1.2 / zoom}
                      strokeDasharray={`${3 / zoom} ${2 / zoom}`}
                    />
                  )}
                  <circle
                    cx={p.x}
                    cy={p.y}
                    r={6 / zoom}
                    fill="#071320"
                    stroke={markerColor}
                    strokeWidth={2 / zoom}
                  />
                  <text
                    x={p.x}
                    y={p.y + 3 / zoom}
                    textAnchor="middle"
                    fill="#F8FAFC"
                    fontSize={8 / zoom}
                    fontFamily="IBM Plex Mono, monospace"
                    fontWeight="600"
                  >
                    {idx + 1}
                  </text>
                  <text
                    x={p.x + 9 / zoom}
                    y={p.y - 6 / zoom}
                    fill={isActive ? '#FCD34D' : '#E2E8F0'}
                    fontSize={10 / zoom}
                    fontFamily="IBM Plex Mono, monospace"
                    fontWeight="600"
                  >
                    {wp.name}
                  </text>
                </g>
              );
            })}

            <g transform={`translate(${vesselXY.x}, ${vesselXY.y}) rotate(${headingDeg})`}>
              <line
                x1="0"
                y1="0"
                x2="0"
                y2={-38 / zoom}
                stroke="#22D3EE"
                strokeOpacity="0.6"
                strokeWidth={1.2 / zoom}
              />
              <polygon
                points={`0,${-11 / zoom} ${7 / zoom},${9 / zoom} 0,${5 / zoom} ${-7 / zoom},${9 / zoom}`}
                fill="#22D3EE"
                stroke="#071320"
                strokeWidth={1.2 / zoom}
              />
            </g>
          </g>
        </svg>

        <div className="pointer-events-none absolute bottom-3 left-3 bg-[#070D14]/90 border border-[#1C2A3B] rounded-md px-3 py-1.5 text-[11px] font-mono tabular-nums text-slate-300 flex flex-wrap items-center gap-3">
          {cursorLatLon ? (
            <>
              <span>{formatDDM(cursorLatLon.lat, 'lat')}</span>
              <span>{formatDDM(cursorLatLon.lon, 'lon')}</span>
              {cursorMagBrg !== null && cursorDistFmt && (
                <>
                  <span className="text-slate-600" aria-hidden="true">·</span>
                  <span className="text-cyan-300">
                    BRG {String(Math.round(cursorMagBrg)).padStart(3, '0')}°M
                  </span>
                  <span className="text-amber-300">
                    RNG {cursorDistFmt.value} {cursorDistFmt.label}
                  </span>
                </>
              )}
            </>
          ) : (
            <span className="text-slate-400 flex items-center gap-1.5">
              <Anchor className="w-3 h-3 text-cyan-400" aria-hidden="true" />
              {mode === 'plot'
                ? 'Click chart to plot waypoint · Drag markers to adjust'
                : 'Drag chart to pan · Scroll to zoom'}
            </span>
          )}
        </div>

        <div className="absolute bottom-3 right-3 flex items-center gap-1 bg-[#070D14]/90 border border-[#1C2A3B] rounded-md p-1">
          <button
            type="button"
            onClick={() => onZoomChange(Math.min(4.5, Number((zoom * 1.25).toFixed(2))))}
            aria-label="Zoom In"
            className="p-1.5 text-slate-300 hover:text-white hover:bg-[#132030] rounded transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
          <span className="px-1.5 text-[11px] font-mono tabular-nums text-slate-400">
            {zoom.toFixed(1)}x
          </span>
          <button
            type="button"
            onClick={() => onZoomChange(Math.max(0.75, Number((zoom / 1.25).toFixed(2))))}
            aria-label="Zoom Out"
            className="p-1.5 text-slate-300 hover:text-white hover:bg-[#132030] rounded transition-colors"
          >
            <Minus className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => {
              onZoomChange(1);
              onPanChange({ x: 0, y: 0 });
            }}
            aria-label="Reset View"
            className="p-1.5 text-slate-300 hover:text-white hover:bg-[#132030] rounded transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};

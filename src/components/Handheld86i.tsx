import React, { useState } from 'react';
import {
  ChevronUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  Radio,
} from 'lucide-react';
import {
  HandheldPage,
  InReachMessage,
  LatLon,
  UnitSystem,
  Waypoint,
} from '../types/marine';
import {
  bearingDeg,
  distanceNm,
  formatDDM,
  formatDistance,
  formatDurationMinutes,
  formatSpeed,
  normalizeAngleDelta,
  trueToMagnetic,
} from '../utils/navigation';

interface Handheld86iProps {
  page: HandheldPage;
  onChangePage: (page: HandheldPage) => void;
  vesselPos: LatLon;
  headingDeg: number;
  speedKnots: number;
  magneticVariation: number;
  unitSystem: UnitSystem;
  onCycleUnit: () => void;
  activeWaypoint: Waypoint | null;
  waypoints: Waypoint[];
  onSelectTargetWaypoint: (id: string) => void;
  onMarkCurrentPosition: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  messages: InReachMessage[];
  onOpenInReachTab: () => void;
  sosActive: boolean;
  onToggleSosDrill: () => void;
  tripOdometerNm: number;
}

const PAGES: HandheldPage[] = ['trip', 'compass', 'satellites', 'inreach'];

const SATELLITES = [
  { id: 'G12', sys: 'GPS', az: 42, el: 68, snr: 44 },
  { id: 'G19', sys: 'GPS', az: 138, el: 51, snr: 41 },
  { id: 'G24', sys: 'GPS', az: 245, el: 37, snr: 36 },
  { id: 'E08', sys: 'GAL', az: 310, el: 72, snr: 45 },
  { id: 'E15', sys: 'GAL', az: 88, el: 28, snr: 32 },
  { id: 'R04', sys: 'GLO', az: 196, el: 61, snr: 39 },
  { id: 'IR3', sys: 'IRD', az: 15, el: 46, snr: 47 },
];

export const Handheld86i: React.FC<Handheld86iProps> = ({
  page,
  onChangePage,
  vesselPos,
  headingDeg,
  speedKnots,
  magneticVariation,
  unitSystem,
  onCycleUnit,
  activeWaypoint,
  waypoints,
  onSelectTargetWaypoint,
  onMarkCurrentPosition,
  onZoomIn,
  onZoomOut,
  messages,
  onOpenInReachTab,
  sosActive,
  onToggleSosDrill,
  tripOdometerNm,
}) => {
  const [sosCoverOpen, setSosCoverOpen] = useState(false);

  const cyclePage = (dir: 1 | -1 = 1) => {
    const idx = PAGES.indexOf(page);
    const nextIdx = (idx + dir + PAGES.length) % PAGES.length;
    onChangePage(PAGES[nextIdx]);
  };

  const stepTargetWaypoint = (dir: 1 | -1) => {
    if (waypoints.length === 0) return;
    const idx = waypoints.findIndex((w) => w.id === activeWaypoint?.id);
    const nextIdx = idx === -1 ? 0 : (idx + dir + waypoints.length) % waypoints.length;
    onSelectTargetWaypoint(waypoints[nextIdx].id);
  };

  const distToTargetNm = activeWaypoint ? distanceNm(vesselPos, activeWaypoint) : 0;
  const trueBrgToTarget = activeWaypoint ? bearingDeg(vesselPos, activeWaypoint) : headingDeg;
  const magBrgToTarget = trueToMagnetic(trueBrgToTarget, magneticVariation);
  const magHeading = trueToMagnetic(headingDeg, magneticVariation);
  const eteMinutes =
    activeWaypoint && speedKnots > 0.2 ? (distToTargetNm / speedKnots) * 60 : 0;
  const courseDelta = normalizeAngleDelta(trueBrgToTarget, headingDeg);

  const speedFmt = formatSpeed(speedKnots, unitSystem);
  const distFmt = formatDistance(distToTargetNm, unitSystem);
  const odoFmt = formatDistance(tripOdometerNm, unitSystem);

  return (
    <div className="bg-[#0C1520] border border-[#1C2A3B] rounded-xl p-4 select-none">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h2 className="text-sm font-semibold text-slate-100">GPSMAP 86i Handheld</h2>
          <p className="text-xs text-slate-400">Interactive device console</p>
        </div>
        <span className="text-xs font-mono tabular-nums text-emerald-400">
          ● 3D GPS + IRD
        </span>
      </div>

      {/* Ruggedized Device Bezel */}
      <div className="mx-auto max-w-[300px] bg-[#141E2B] border-2 border-[#263547] rounded-[26px] p-3.5 shadow-inner">
        <div className="flex items-center justify-between px-2 mb-2.5">
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-bold tracking-wider text-slate-300">
              86i
            </span>
            <span className="text-[10px] font-mono text-slate-500">inReach</span>
          </div>
          <div className="flex gap-1" aria-hidden="true">
            <span className="w-1 h-1 rounded-full bg-slate-600" />
            <span className="w-1 h-1 rounded-full bg-slate-600" />
            <span className="w-1 h-1 rounded-full bg-slate-600" />
          </div>
        </div>

        {/* 3" Transflective Screen */}
        <div className="bg-[#060B11] border border-[#2C3E52] rounded-lg overflow-hidden">
          <div className="flex items-center justify-between px-2.5 py-1 bg-[#0E1824] border-b border-[#1C2B3B] text-[10px] font-mono tabular-nums">
            <span className={sosActive ? 'text-rose-400 font-semibold' : 'text-cyan-400'}>
              {sosActive ? 'SOS DRILL ACTIVE' : page.toUpperCase()}
            </span>
            <span className="text-slate-400">
              {formatDDM(vesselPos.lat, 'lat').slice(0, 7)}
            </span>
          </div>

          <div className="h-[224px] p-2.5 flex flex-col justify-between">
            {page === 'trip' && (
              <>
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-[#0C1622] border border-[#1A2939] rounded p-2">
                    <div className="text-[10px] font-mono text-slate-400">SOG</div>
                    <div className="text-xl font-mono font-semibold tabular-nums text-slate-100 leading-tight mt-0.5">
                      {speedFmt.value}
                      <span className="text-[10px] text-slate-400 ml-1">{speedFmt.label}</span>
                    </div>
                  </div>
                  <div className="bg-[#0C1622] border border-[#1A2939] rounded p-2">
                    <div className="text-[10px] font-mono text-slate-400">COG MAG</div>
                    <div className="text-xl font-mono font-semibold tabular-nums text-cyan-400 leading-tight mt-0.5">
                      {String(Math.round(magHeading)).padStart(3, '0')}°
                    </div>
                  </div>
                  <div className="bg-[#0C1622] border border-[#1A2939] rounded p-2">
                    <div className="text-[10px] font-mono text-slate-400">DIST NEXT</div>
                    <div className="text-lg font-mono font-semibold tabular-nums text-amber-400 leading-tight mt-0.5">
                      {activeWaypoint ? distFmt.value : '--'}
                      <span className="text-[10px] text-slate-400 ml-1">{distFmt.label}</span>
                    </div>
                  </div>
                  <div className="bg-[#0C1622] border border-[#1A2939] rounded p-2">
                    <div className="text-[10px] font-mono text-slate-400">ETE NEXT</div>
                    <div className="text-lg font-mono font-semibold tabular-nums text-slate-100 leading-tight mt-0.5">
                      {activeWaypoint && speedKnots > 0.2
                        ? formatDurationMinutes(eteMinutes)
                        : '--:--'}
                    </div>
                  </div>
                </div>

                <div className="bg-[#0C1622] border border-[#1A2939] rounded px-2.5 py-2 space-y-1 text-[11px] font-mono tabular-nums">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">TO WPT</span>
                    <span className="text-amber-300 font-medium truncate max-w-[140px]">
                      {activeWaypoint ? activeWaypoint.name : 'NO TARGET'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">TRIP LOG</span>
                    <span className="text-slate-200">
                      {odoFmt.value} {odoFmt.label}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-slate-400">
                    <span>{formatDDM(vesselPos.lat, 'lat')}</span>
                    <span>{formatDDM(vesselPos.lon, 'lon')}</span>
                  </div>
                </div>
              </>
            )}

            {page === 'compass' && (
              <div className="flex flex-col items-center justify-between h-full">
                <div className="flex items-center justify-between w-full text-[11px] font-mono tabular-nums">
                  <span className="text-slate-400">
                    HDG <strong className="text-slate-100">{String(Math.round(magHeading)).padStart(3, '0')}°M</strong>
                  </span>
                  <span className="text-amber-400">
                    BRG <strong>{String(Math.round(magBrgToTarget)).padStart(3, '0')}°M</strong>
                  </span>
                </div>

                <svg viewBox="0 0 140 140" className="w-32 h-32">
                  <circle
                    cx="70"
                    cy="70"
                    r="58"
                    fill="#0A131E"
                    stroke="#1E3044"
                    strokeWidth="1.5"
                  />
                  <g transform={`rotate(${-magHeading} 70 70)`}>
                    {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((deg) => {
                      const rad = ((deg - 90) * Math.PI) / 180;
                      const x1 = 70 + Math.cos(rad) * 50;
                      const y1 = 70 + Math.sin(rad) * 50;
                      const x2 = 70 + Math.cos(rad) * 57;
                      const y2 = 70 + Math.sin(rad) * 57;
                      return (
                        <line
                          key={deg}
                          x1={x1}
                          y1={y1}
                          x2={x2}
                          y2={y2}
                          stroke={deg === 0 ? '#22D3EE' : '#475569'}
                          strokeWidth={deg % 90 === 0 ? '2' : '1'}
                        />
                      );
                    })}
                    {[
                      { label: 'N', deg: 0, color: '#22D3EE' },
                      { label: 'E', deg: 90, color: '#94A3B8' },
                      { label: 'S', deg: 180, color: '#94A3B8' },
                      { label: 'W', deg: 270, color: '#94A3B8' },
                    ].map((c) => {
                      const rad = ((c.deg - 90) * Math.PI) / 180;
                      const x = 70 + Math.cos(rad) * 39;
                      const y = 70 + Math.sin(rad) * 39;
                      return (
                        <text
                          key={c.label}
                          x={x}
                          y={y + 3.5}
                          textAnchor="middle"
                          fill={c.color}
                          fontSize="10"
                          fontFamily="IBM Plex Mono, monospace"
                          fontWeight="600"
                        >
                          {c.label}
                        </text>
                      );
                    })}
                    {activeWaypoint && (
                      <g transform={`rotate(${magBrgToTarget} 70 70)`}>
                        <polygon points="70,12 65,23 75,23" fill="#F59E0B" />
                      </g>
                    )}
                  </g>
                  <polygon points="70,4 66,11 74,11" fill="#22D3EE" />
                  <circle cx="70" cy="70" r="3" fill="#22D3EE" />
                </svg>

                <div className="w-full bg-[#0C1622] border border-[#1A2939] rounded px-2 py-1.5">
                  <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 mb-1">
                    <span>STR L</span>
                    <span className="text-slate-200">
                      {Math.abs(Math.round(courseDelta))}° {courseDelta >= 0 ? 'STBD' : 'PORT'}
                    </span>
                    <span>R</span>
                  </div>
                  <div className="relative h-1.5 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="absolute top-0 bottom-0 w-3 bg-amber-400 rounded-full transition-transform duration-150"
                      style={{
                        left: '50%',
                        transform: `translateX(calc(-50% + ${Math.max(
                          -42,
                          Math.min(42, courseDelta)
                        )}px))`,
                      }}
                    />
                  </div>
                </div>
              </div>
            )}

            {page === 'satellites' && (
              <div className="flex flex-col justify-between h-full">
                <div className="flex items-center gap-3">
                  <svg viewBox="0 0 90 90" className="w-24 h-24 shrink-0">
                    <circle cx="45" cy="45" r="40" fill="#0A131E" stroke="#1E3044" strokeWidth="1" />
                    <circle cx="45" cy="45" r="22" fill="none" stroke="#1A2939" strokeWidth="1" strokeDasharray="2 2" />
                    <line x1="45" y1="5" x2="45" y2="85" stroke="#1A2939" strokeWidth="1" />
                    <line x1="5" y1="45" x2="85" y2="45" stroke="#1A2939" strokeWidth="1" />
                    {SATELLITES.map((s) => {
                      const r = ((90 - s.el) / 90) * 38;
                      const rad = ((s.az - 90) * Math.PI) / 180;
                      const cx = 45 + Math.cos(rad) * r;
                      const cy = 45 + Math.sin(rad) * r;
                      const fill = s.sys === 'IRD' ? '#F59E0B' : '#22D3EE';
                      return (
                        <g key={s.id}>
                          <circle cx={cx} cy={cy} r="4.5" fill={fill} fillOpacity="0.25" stroke={fill} strokeWidth="1" />
                          <text
                            x={cx}
                            y={cy + 2}
                            textAnchor="middle"
                            fontSize="5.5"
                            fill="#E2E8F0"
                            fontFamily="IBM Plex Mono, monospace"
                          >
                            {s.id}
                          </text>
                        </g>
                      );
                    })}
                  </svg>
                  <div className="flex-1 space-y-1 text-[10px] font-mono tabular-nums">
                    <div className="text-slate-300 font-semibold">WAAS 3D FIX</div>
                    <div className="text-slate-400">EPE: ±2.4 m</div>
                    <div className="text-slate-400">GPS + GAL + GLO</div>
                    <div className="text-amber-400">IRIDIUM: 4/5 BARS</div>
                  </div>
                </div>

                <div className="grid grid-cols-7 gap-1 pt-2 border-t border-[#1A2939]">
                  {SATELLITES.map((s) => (
                    <div key={s.id} className="flex flex-col items-center gap-1">
                      <div className="w-full h-12 bg-[#0C1622] rounded-sm flex items-end p-0.5">
                        <div
                          className={`w-full rounded-xs ${
                            s.sys === 'IRD' ? 'bg-amber-400' : 'bg-cyan-400'
                          }`}
                          style={{ height: `${Math.min(100, s.snr * 2)}%` }}
                        />
                      </div>
                      <span className="text-[9px] font-mono text-slate-400">{s.id}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {page === 'inreach' && (
              <div className="flex flex-col justify-between h-full">
                <div className="space-y-1.5 overflow-y-auto max-h-[168px] pr-1">
                  {messages.slice(0, 3).map((msg) => (
                    <div
                      key={msg.id}
                      className="bg-[#0C1622] border border-[#1A2939] rounded p-2 text-[11px]"
                    >
                      <div className="flex items-center justify-between font-mono text-[9px] text-slate-400 mb-0.5">
                        <span>{msg.direction === 'outbound' ? `TO: ${msg.recipient}` : `FROM: ${msg.recipient}`}</span>
                        <span>{msg.timestamp}</span>
                      </div>
                      <p className="text-slate-200 leading-snug line-clamp-2">{msg.body}</p>
                    </div>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={onOpenInReachTab}
                  className="w-full py-1.5 px-2 bg-cyan-500/15 border border-cyan-500/40 text-cyan-300 hover:bg-cyan-500/25 rounded text-[11px] font-medium transition-colors"
                >
                  Open inReach Composer
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Physical Keypad */}
        <div className="mt-3 space-y-2.5">
          <div className="grid grid-cols-4 gap-1.5">
            <button
              type="button"
              onClick={onZoomIn}
              className="py-1.5 bg-[#1B2736] hover:bg-[#243448] active:translate-y-px border border-[#2D4056] rounded text-[10px] font-mono font-semibold text-slate-200 transition-colors"
              title="Zoom In Chart"
            >
              IN +
            </button>
            <button
              type="button"
              onClick={onZoomOut}
              className="py-1.5 bg-[#1B2736] hover:bg-[#243448] active:translate-y-px border border-[#2D4056] rounded text-[10px] font-mono font-semibold text-slate-200 transition-colors"
              title="Zoom Out Chart"
            >
              OUT -
            </button>
            <button
              type="button"
              onClick={() => cyclePage(1)}
              className="py-1.5 bg-[#1B2736] hover:bg-[#243448] active:translate-y-px border border-[#2D4056] rounded text-[10px] font-mono font-semibold text-cyan-300 transition-colors"
              title="Cycle Handheld Screen"
            >
              PAGE
            </button>
            <button
              type="button"
              onClick={onCycleUnit}
              className="py-1.5 bg-[#1B2736] hover:bg-[#243448] active:translate-y-px border border-[#2D4056] rounded text-[10px] font-mono font-semibold text-slate-200 transition-colors"
              title="Cycle Units (NM / km / mi)"
            >
              UNIT
            </button>
          </div>

          <div className="flex items-center justify-between gap-2 px-1">
            <button
              type="button"
              onClick={onMarkCurrentPosition}
              className="w-14 py-2 bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/40 rounded text-[10px] font-mono font-semibold text-amber-300 transition-colors"
              title="Mark Waypoint at Vessel Position"
            >
              MARK
            </button>

            <div className="grid grid-cols-3 gap-1 w-24">
              <div />
              <button
                type="button"
                onClick={() => stepTargetWaypoint(-1)}
                aria-label="Previous Waypoint"
                className="flex items-center justify-center h-7 bg-[#1B2736] hover:bg-[#243448] border border-[#2D4056] rounded text-slate-200"
              >
                <ChevronUp className="w-3.5 h-3.5" />
              </button>
              <div />
              <button
                type="button"
                onClick={() => cyclePage(-1)}
                aria-label="Previous Screen"
                className="flex items-center justify-center h-7 bg-[#1B2736] hover:bg-[#243448] border border-[#2D4056] rounded text-slate-200"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => cyclePage(1)}
                aria-label="Select"
                className="flex items-center justify-center h-7 bg-[#243448] hover:bg-[#2E425A] border border-cyan-500/40 rounded text-[9px] font-mono font-bold text-cyan-300"
              >
                ENT
              </button>
              <button
                type="button"
                onClick={() => cyclePage(1)}
                aria-label="Next Screen"
                className="flex items-center justify-center h-7 bg-[#1B2736] hover:bg-[#243448] border border-[#2D4056] rounded text-slate-200"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
              <div />
              <button
                type="button"
                onClick={() => stepTargetWaypoint(1)}
                aria-label="Next Waypoint"
                className="flex items-center justify-center h-7 bg-[#1B2736] hover:bg-[#243448] border border-[#2D4056] rounded text-slate-200"
              >
                <ChevronDown className="w-3.5 h-3.5" />
              </button>
              <div />
            </div>

            <button
              type="button"
              onClick={() => onChangePage('trip')}
              className="w-14 py-2 bg-[#1B2736] hover:bg-[#243448] border border-[#2D4056] rounded text-[10px] font-mono font-semibold text-slate-300 transition-colors"
              title="Return to Trip Screen"
            >
              QUIT
            </button>
          </div>

          <div className="pt-2 border-t border-[#233244]">
            <div className="flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => setSosCoverOpen((prev) => !prev)}
                className="text-[10px] font-mono text-slate-400 hover:text-slate-200 transition-colors"
              >
                {sosCoverOpen ? 'Close SOS Flap' : 'Lift SOS Flap'}
              </button>
              {sosCoverOpen || sosActive ? (
                <button
                  type="button"
                  onClick={onToggleSosDrill}
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-[10px] font-mono font-semibold transition-colors ${
                    sosActive
                      ? 'bg-rose-600 text-white hover:bg-rose-500'
                      : 'bg-rose-500/15 border border-rose-500/50 text-rose-300 hover:bg-rose-500/25'
                  }`}
                >
                  <AlertTriangle className="w-3 h-3" aria-hidden="true" />
                  {sosActive ? 'Cancel SOS Drill' : 'Trigger SOS Drill'}
                </button>
              ) : (
                <span className="inline-flex items-center gap-1 text-[10px] font-mono text-slate-500">
                  <Radio className="w-3 h-3" aria-hidden="true" />
                  SOS Guarded
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

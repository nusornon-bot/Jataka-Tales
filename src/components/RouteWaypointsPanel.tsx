import React, { useRef, useState } from 'react';
import {
  ArrowDown,
  ArrowUp,
  Compass,
  RotateCcw,
  Search,
  Trash2,
  Upload,
} from 'lucide-react';
import {
  RouteLegMetrics,
  UnitSystem,
  Waypoint,
  WaypointSymbol,
} from '../types/marine';
import {
  formatDDM,
  formatDistance,
  formatDurationMinutes,
} from '../utils/navigation';

interface RouteWaypointsPanelProps {
  legs: RouteLegMetrics[];
  activeWaypointId: string | null;
  unitSystem: UnitSystem;
  onSelectTarget: (id: string) => void;
  onUpdateWaypoint: (id: string, patch: Partial<Waypoint>) => void;
  onMoveOrder: (index: number, dir: -1 | 1) => void;
  onDeleteWaypoint: (id: string) => void;
  onReverseRoute: () => void;
  onResetDefaultRoute: () => void;
  onImportGpxFile: (xmlText: string) => void;
}

const SYMBOLS: Array<{ value: WaypointSymbol; label: string }> = [
  { value: 'marina', label: 'Marina' },
  { value: 'buoy', label: 'Buoy' },
  { value: 'anchorage', label: 'Anchorage' },
  { value: 'hazard', label: 'Hazard' },
  { value: 'custom', label: 'Custom' },
];

export const RouteWaypointsPanel: React.FC<RouteWaypointsPanelProps> = ({
  legs,
  activeWaypointId,
  unitSystem,
  onSelectTarget,
  onUpdateWaypoint,
  onMoveOrder,
  onDeleteWaypoint,
  onReverseRoute,
  onResetDefaultRoute,
  onImportGpxFile,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [importError, setImportError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const filteredLegs = legs.filter((leg) =>
    leg.waypoint.name.toLowerCase().includes(searchQuery.trim().toLowerCase())
  );

  const totalDistanceNm =
    legs.length > 0 ? legs[legs.length - 1].cumulativeDistanceNm : 0;
  const totalMinutes = legs.length > 0 ? legs[legs.length - 1].cumulativeMinutes : 0;
  const totalDistFmt = formatDistance(totalDistanceNm, unitSystem);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImportError(null);
    try {
      const text = await file.text();
      onImportGpxFile(text);
    } catch (err) {
      setImportError(err instanceof Error ? err.message : 'Unable to parse GPX file.');
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <section
      id="waypoints"
      className="bg-[#0C1520] border border-[#1C2A3B] rounded-xl overflow-hidden"
    >
      {/* Header Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-4 px-5 py-3.5 border-b border-[#1C2A3B]">
        <div className="flex items-center gap-3 text-sm">
          <h2 className="font-semibold text-slate-100">Active Route & Waypoints</h2>
          <span className="text-slate-600" aria-hidden="true">·</span>
          <span className="text-xs font-mono tabular-nums text-slate-400">
            {legs.length} points · {totalDistFmt.value} {totalDistFmt.label} · ETE{' '}
            {formatDurationMinutes(totalMinutes)}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search
              className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2"
              aria-hidden="true"
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter waypoints..."
              aria-label="Filter waypoints"
              className="pl-8 pr-3 py-1.5 w-44 bg-[#070D14] border border-[#1C2A3B] rounded-md text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-cyan-400"
            />
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept=".gpx,application/gpx+xml,text/xml"
            onChange={handleFileChange}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-200 bg-[#132030] border border-[#24364B] rounded-md hover:bg-[#192A3E] transition-colors whitespace-nowrap shrink-0"
          >
            <Upload className="w-3.5 h-3.5" aria-hidden="true" />
            Import GPX
          </button>

          <button
            type="button"
            onClick={onReverseRoute}
            disabled={legs.length < 2}
            className="px-3 py-1.5 text-xs font-medium text-slate-300 bg-[#111D2B] border border-[#1C2A3B] rounded-md hover:text-white disabled:opacity-40 transition-colors whitespace-nowrap shrink-0"
          >
            Reverse
          </button>

          <button
            type="button"
            onClick={onResetDefaultRoute}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-300 bg-[#111D2B] border border-[#1C2A3B] rounded-md hover:text-white transition-colors whitespace-nowrap shrink-0"
          >
            <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
            Reset
          </button>
        </div>
      </div>

      {importError && (
        <div className="px-5 py-2 bg-rose-950/50 border-b border-rose-800/60 text-xs text-rose-300 flex items-center justify-between">
          <span>{importError}</span>
          <button
            type="button"
            onClick={() => setImportError(null)}
            className="underline hover:text-white"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* High-Density Data Table */}
      {legs.length === 0 ? (
        <div className="p-10 text-center space-y-3">
          <p className="text-sm text-slate-300">No waypoints plotted on this chart.</p>
          <p className="text-xs text-slate-500">
            Click anywhere on the chartplotter in Plot Waypoint mode, press MARK on the 86i
            handheld, or import a .gpx file.
          </p>
          <button
            type="button"
            onClick={onResetDefaultRoute}
            className="px-4 py-2 text-xs font-semibold text-[#070D14] bg-cyan-400 rounded-md hover:bg-cyan-300 transition-colors"
          >
            Load Default Passage
          </button>
        </div>
      ) : filteredLegs.length === 0 ? (
        <div className="p-8 text-center text-xs text-slate-400">
          No waypoints match "{searchQuery}".
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#1C2A3B] bg-[#09111B] text-[11px] font-mono uppercase tracking-wider text-slate-400">
                <th className="py-2.5 px-4 w-10">#</th>
                <th className="py-2.5 px-3">Waypoint</th>
                <th className="py-2.5 px-3">Type</th>
                <th className="py-2.5 px-3">Coordinates (DDM)</th>
                <th className="py-2.5 px-3 text-right">Brg Mag</th>
                <th className="py-2.5 px-3 text-right">Leg Dist</th>
                <th className="py-2.5 px-3 text-right">Cum Dist</th>
                <th className="py-2.5 px-3 text-right">Leg ETE</th>
                <th className="py-2.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#152232] text-xs">
              {filteredLegs.map((leg) => {
                const origIdx = legs.findIndex((l) => l.waypoint.id === leg.waypoint.id);
                const isTarget = leg.waypoint.id === activeWaypointId;
                const legFmt = formatDistance(leg.legDistanceNm, unitSystem);
                const cumFmt = formatDistance(leg.cumulativeDistanceNm, unitSystem);

                return (
                  <tr
                    key={leg.waypoint.id}
                    className={`transition-colors ${
                      isTarget
                        ? 'bg-amber-500/8 hover:bg-amber-500/12'
                        : 'hover:bg-[#111D2B]'
                    }`}
                  >
                    <td className="py-2 px-4 font-mono tabular-nums text-slate-400">
                      {String(origIdx + 1).padStart(2, '0')}
                    </td>
                    <td className="py-2 px-3">
                      <input
                        type="text"
                        value={leg.waypoint.name}
                        maxLength={20}
                        onChange={(e) =>
                          onUpdateWaypoint(leg.waypoint.id, {
                            name: e.target.value.toUpperCase(),
                          })
                        }
                        aria-label={`Waypoint ${origIdx + 1} name`}
                        className="w-40 bg-transparent border border-transparent hover:border-[#26384E] focus:border-cyan-400 focus:bg-[#070D14] rounded px-1.5 py-1 font-mono font-medium text-slate-100 focus:outline-none"
                      />
                    </td>
                    <td className="py-2 px-3">
                      <select
                        value={leg.waypoint.symbol}
                        onChange={(e) =>
                          onUpdateWaypoint(leg.waypoint.id, {
                            symbol: e.target.value as WaypointSymbol,
                          })
                        }
                        aria-label={`Waypoint ${origIdx + 1} symbol`}
                        className="bg-[#070D14] border border-[#1C2A3B] rounded px-2 py-1 text-xs text-slate-300 focus:outline-none focus:border-cyan-400"
                      >
                        {SYMBOLS.map((s) => (
                          <option key={s.value} value={s.value}>
                            {s.label}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="py-2 px-3 font-mono tabular-nums text-slate-300 whitespace-nowrap">
                      {formatDDM(leg.waypoint.lat, 'lat')} ·{' '}
                      {formatDDM(leg.waypoint.lon, 'lon')}
                    </td>
                    <td className="py-2 px-3 text-right font-mono tabular-nums text-cyan-300">
                      {origIdx === 0
                        ? '--'
                        : `${String(Math.round(leg.magBearingDeg)).padStart(3, '0')}°M`}
                    </td>
                    <td className="py-2 px-3 text-right font-mono tabular-nums text-slate-200">
                      {origIdx === 0 ? '--' : `${legFmt.value} ${legFmt.label}`}
                    </td>
                    <td className="py-2 px-3 text-right font-mono tabular-nums text-slate-400">
                      {cumFmt.value} {cumFmt.label}
                    </td>
                    <td className="py-2 px-3 text-right font-mono tabular-nums text-slate-300">
                      {origIdx === 0 ? '--' : formatDurationMinutes(leg.legMinutes)}
                    </td>
                    <td className="py-2 px-4">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => onSelectTarget(leg.waypoint.id)}
                          title="Set as Active Go-To Target"
                          className={`inline-flex items-center gap-1 px-2 py-1 rounded text-[11px] font-medium transition-colors ${
                            isTarget
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                              : 'text-slate-300 hover:bg-[#1A2B3F]'
                          }`}
                        >
                          <Compass className="w-3 h-3" aria-hidden="true" />
                          {isTarget ? 'Active' : 'Go To'}
                        </button>
                        <button
                          type="button"
                          onClick={() => onMoveOrder(origIdx, -1)}
                          disabled={origIdx === 0}
                          aria-label="Move waypoint earlier"
                          className="p-1 text-slate-400 hover:text-slate-100 disabled:opacity-30"
                        >
                          <ArrowUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => onMoveOrder(origIdx, 1)}
                          disabled={origIdx === legs.length - 1}
                          aria-label="Move waypoint later"
                          className="p-1 text-slate-400 hover:text-slate-100 disabled:opacity-30"
                        >
                          <ArrowDown className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => onDeleteWaypoint(leg.waypoint.id)}
                          aria-label={`Delete ${leg.waypoint.name}`}
                          className="p-1 text-slate-400 hover:text-rose-400"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
};

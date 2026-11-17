import React, { useState } from 'react';
import { TideBaroPoint } from '../types/marine';

interface BarometerTideChartProps {
  series: TideBaroPoint[];
  sectorName: string;
}

const CHART_W = 760;
const CHART_H = 220;
const PAD_L = 50;
const PAD_R = 46;
const PAD_T = 22;
const PAD_B = 30;

export const BarometerTideChart: React.FC<BarometerTideChartProps> = ({
  series,
  sectorName,
}) => {
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);

  if (series.length === 0) return null;

  const pressures = series.map((d) => d.pressureHpa);
  const tides = series.map((d) => d.tideMeters);

  const minP = Math.floor(Math.min(...pressures) - 1);
  const maxP = Math.ceil(Math.max(...pressures) + 1);
  const minT = 0;
  const maxT = Math.ceil(Math.max(...tides) * 1.15 * 10) / 10;

  const plotW = CHART_W - PAD_L - PAD_R;
  const plotH = CHART_H - PAD_T - PAD_B;

  const xForIdx = (i: number) => PAD_L + (i / (series.length - 1)) * plotW;
  const yForP = (p: number) => PAD_T + ((maxP - p) / Math.max(1, maxP - minP)) * plotH;
  const yForT = (t: number) => PAD_T + ((maxT - t) / Math.max(0.5, maxT - minT)) * plotH;

  const pressurePath = series
    .map((d, i) => `${i === 0 ? 'M' : 'L'} ${xForIdx(i).toFixed(1)} ${yForP(d.pressureHpa).toFixed(1)}`)
    .join(' ');

  const tidePath = series
    .map((d, i) => `${i === 0 ? 'M' : 'L'} ${xForIdx(i).toFixed(1)} ${yForT(d.tideMeters).toFixed(1)}`)
    .join(' ');

  const tideArea = `${tidePath} L ${xForIdx(series.length - 1).toFixed(1)} ${(PAD_T + plotH).toFixed(1)} L ${PAD_L} ${(PAD_T + plotH).toFixed(1)} Z`;

  const delta24h = series[series.length - 1].pressureHpa - series[0].pressureHpa;
  const activePoint = hoverIdx !== null ? series[hoverIdx] : series[Math.floor(series.length / 2)];
  const activeIdx = hoverIdx !== null ? hoverIdx : Math.floor(series.length / 2);

  const highTide = series.reduce((a, b) => (b.tideMeters > a.tideMeters ? b : a), series[0]);
  const lowTide = series.reduce((a, b) => (b.tideMeters < a.tideMeters ? b : a), series[0]);

  return (
    <section
      id="barometer"
      className="bg-[#0C1520] border border-[#1C2A3B] rounded-xl p-5 space-y-4"
    >
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-sm font-semibold text-slate-100">
            Barometric Trend & Tidal Curve (24h)
          </h2>
          <p className="text-xs text-slate-400">
            {sectorName} · High {highTide.tideMeters.toFixed(2)} m at {highTide.label} · Low{' '}
            {lowTide.tideMeters.toFixed(2)} m at {lowTide.label}
          </p>
        </div>

        <div className="flex items-center gap-4 text-xs font-mono tabular-nums">
          <span className="text-amber-300">
            ── Pressure {activePoint.pressureHpa.toFixed(1)} hPa
          </span>
          <span className="text-cyan-300">
            ╌╌ Tide {activePoint.tideMeters.toFixed(2)} m
          </span>
          <span
            className={
              delta24h <= -3 ? 'text-amber-400 font-semibold' : 'text-slate-400'
            }
          >
            24h Δ {delta24h >= 0 ? '+' : ''}
            {delta24h.toFixed(1)} hPa
          </span>
        </div>
      </div>

      <div className="relative w-full">
        <svg
          viewBox={`0 0 ${CHART_W} ${CHART_H}`}
          className="w-full h-auto block select-none"
          onMouseLeave={() => setHoverIdx(null)}
        >
          {/* Horizontal Grid Lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((frac) => {
            const y = PAD_T + frac * plotH;
            const pVal = maxP - frac * (maxP - minP);
            const tVal = maxT - frac * (maxT - minT);
            return (
              <g key={frac}>
                <line
                  x1={PAD_L}
                  y1={y}
                  x2={CHART_W - PAD_R}
                  y2={y}
                  stroke="#162536"
                  strokeWidth="1"
                />
                <text
                  x={PAD_L - 8}
                  y={y + 3.5}
                  textAnchor="end"
                  fill="#94A3B8"
                  fontSize="10"
                  fontFamily="IBM Plex Mono, monospace"
                >
                  {pVal.toFixed(0)}
                </text>
                <text
                  x={CHART_W - PAD_R + 8}
                  y={y + 3.5}
                  textAnchor="start"
                  fill="#67E8F9"
                  fontSize="10"
                  fontFamily="IBM Plex Mono, monospace"
                >
                  {tVal.toFixed(1)}m
                </text>
              </g>
            );
          })}

          {/* Axis Labels */}
          <text
            x={8}
            y={13}
            fill="#FBBF24"
            fontSize="10"
            fontFamily="IBM Plex Mono, monospace"
          >
            hPa
          </text>
          <text
            x={CHART_W - PAD_R + 8}
            y={13}
            fill="#22D3EE"
            fontSize="10"
            fontFamily="IBM Plex Mono, monospace"
          >
            TIDE
          </text>

          {/* Tide Area & Dashed Curve */}
          <path d={tideArea} fill="#06B6D4" fillOpacity="0.1" />
          <path
            d={tidePath}
            fill="none"
            stroke="#22D3EE"
            strokeWidth="2"
            strokeDasharray="5 3"
          />

          {/* Pressure Solid Curve */}
          <path d={pressurePath} fill="none" stroke="#F59E0B" strokeWidth="2.2" />

          {/* Active Crosshair */}
          <line
            x1={xForIdx(activeIdx)}
            y1={PAD_T}
            x2={xForIdx(activeIdx)}
            y2={PAD_T + plotH}
            stroke="#475569"
            strokeWidth="1"
            strokeDasharray="3 3"
          />
          <circle
            cx={xForIdx(activeIdx)}
            cy={yForP(activePoint.pressureHpa)}
            r="4"
            fill="#F59E0B"
            stroke="#070D14"
            strokeWidth="1.5"
          />
          <circle
            cx={xForIdx(activeIdx)}
            cy={yForT(activePoint.tideMeters)}
            r="4"
            fill="#22D3EE"
            stroke="#070D14"
            strokeWidth="1.5"
          />

          {/* X-Axis Labels + Invisible Snap Columns */}
          {series.map((d, i) => {
            const x = xForIdx(i);
            const colW = plotW / (series.length - 1);
            return (
              <g key={d.label}>
                {i % 2 === 0 && (
                  <text
                    x={x}
                    y={CHART_H - 8}
                    textAnchor="middle"
                    fill={i === activeIdx ? '#F8FAFC' : '#64748B'}
                    fontSize="10"
                    fontFamily="IBM Plex Mono, monospace"
                  >
                    {d.label}
                  </text>
                )}
                <rect
                  x={x - colW / 2}
                  y={PAD_T}
                  width={colW}
                  height={plotH}
                  fill="transparent"
                  onMouseEnter={() => setHoverIdx(i)}
                />
              </g>
            );
          })}
        </svg>
      </div>
    </section>
  );
};

import React, { useState } from 'react';
import { AlertTriangle, Send } from 'lucide-react';
import { InReachMessage, LatLon } from '../types/marine';
import { formatDDM } from '../utils/navigation';

interface InReachMessengerProps {
  messages: InReachMessage[];
  vesselPos: LatLon;
  sosActive: boolean;
  onSendMessage: (recipient: string, body: string) => void;
  onToggleSosDrill: () => void;
}

const RECIPIENTS = [
  'Harbor Master',
  'Shore Base (Ops)',
  'SV Shearwater',
  'Emergency Contact',
];

const QUICK_PRESETS = [
  'All well on board. Proceeding as planned.',
  'Making port before dusk. ETA unchanged.',
  'Requesting updated offshore wind & baro forecast.',
];

export const InReachMessenger: React.FC<InReachMessengerProps> = ({
  messages,
  vesselPos,
  sosActive,
  onSendMessage,
  onToggleSosDrill,
}) => {
  const [recipient, setRecipient] = useState(RECIPIENTS[0]);
  const [body, setBody] = useState('');
  const [includePos, setIncludePos] = useState(true);

  const maxChars = 160;
  const remaining = maxChars - body.length;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = body.trim();
    if (!trimmed) return;
    const payload = includePos
      ? `${trimmed} [${formatDDM(vesselPos.lat, 'lat')} ${formatDDM(vesselPos.lon, 'lon')}]`
      : trimmed;
    onSendMessage(recipient, payload.slice(0, maxChars));
    setBody('');
  };

  return (
    <section
      id="inreach"
      className="bg-[#0C1520] border border-[#1C2A3B] rounded-xl p-5 space-y-5"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-slate-100">
            inReach Iridium Satellite Messenger
          </h2>
          <p className="text-xs text-slate-400">
            Two-way 160-character SBD messaging and distress drill console
          </p>
        </div>

        <button
          type="button"
          onClick={onToggleSosDrill}
          className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
            sosActive
              ? 'bg-rose-600 text-white hover:bg-rose-500'
              : 'bg-rose-500/12 border border-rose-500/40 text-rose-300 hover:bg-rose-500/20'
          }`}
        >
          <AlertTriangle className="w-3.5 h-3.5" aria-hidden="true" />
          {sosActive ? 'Cancel SOS Drill' : 'Test SOS Drill'}
        </button>
      </div>

      {sosActive && (
        <div className="bg-rose-950/60 border border-rose-500/50 rounded-lg p-3.5 text-xs text-rose-100 flex flex-wrap items-center justify-between gap-3">
          <div className="space-y-0.5">
            <p className="font-semibold text-rose-200">
              DRILL MODE: Simulated SOS Beacon Broadcasting
            </p>
            <p className="font-mono tabular-nums text-rose-300">
              POS {formatDDM(vesselPos.lat, 'lat')} · {formatDDM(vesselPos.lon, 'lon')} ·
              Interval 60s
            </p>
          </div>
          <button
            type="button"
            onClick={onToggleSosDrill}
            className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white font-semibold rounded"
          >
            Stand Down Drill
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Composer */}
        <form onSubmit={handleSubmit} className="lg:col-span-5 space-y-3">
          <div className="space-y-1.5">
            <label htmlFor="inreach-recipient" className="block text-xs font-medium text-slate-300">
              Recipient
            </label>
            <select
              id="inreach-recipient"
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
              className="w-full bg-[#070D14] border border-[#1C2A3B] rounded-md px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-400"
            >
              {RECIPIENTS.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <label htmlFor="inreach-body" className="font-medium text-slate-300">
                Satellite Message
              </label>
              <span
                className={`font-mono tabular-nums ${
                  remaining < 20 ? 'text-amber-400' : 'text-slate-400'
                }`}
              >
                {body.length} / {maxChars}
              </span>
            </div>
            <textarea
              id="inreach-body"
              rows={3}
              maxLength={maxChars}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Enter check-in or weather request..."
              className="w-full bg-[#070D14] border border-[#1C2A3B] rounded-md px-3 py-2 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-cyan-400 resize-none"
            />
          </div>

          {/* Preset Quick Buttons */}
          <div className="flex flex-wrap gap-1.5">
            {QUICK_PRESETS.map((preset, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setBody(preset)}
                className="px-2.5 py-1 bg-[#111D2B] hover:bg-[#192A3E] border border-[#1C2A3B] rounded text-[11px] text-slate-300 transition-colors text-left"
              >
                {preset}
              </button>
            ))}
          </div>

          <div className="flex items-center justify-between pt-1">
            <label className="inline-flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={includePos}
                onChange={(e) => setIncludePos(e.target.checked)}
                className="accent-cyan-400"
              />
              Append Lat/Lon fix
            </label>

            <button
              type="submit"
              disabled={body.trim().length === 0}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-cyan-400 hover:bg-cyan-300 disabled:opacity-40 disabled:cursor-not-allowed text-[#070D14] text-xs font-semibold rounded-md transition-colors"
            >
              <Send className="w-3.5 h-3.5" aria-hidden="true" />
              Transmit
            </button>
          </div>
        </form>

        {/* Message Log */}
        <div className="lg:col-span-7 bg-[#070D14] border border-[#1C2A3B] rounded-lg divide-y divide-[#152232] max-h-[260px] overflow-y-auto">
          {messages.map((msg) => (
            <div key={msg.id} className="p-3.5 space-y-1">
              <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] font-mono tabular-nums">
                <span className="text-slate-200 font-medium">
                  {msg.direction === 'outbound' ? `TO ${msg.recipient}` : `FROM ${msg.recipient}`}
                </span>
                <div className="flex items-center gap-2">
                  <span
                    className={
                      msg.status === 'Delivered'
                        ? 'text-emerald-400'
                        : msg.status === 'Sent via Iridium'
                        ? 'text-cyan-400'
                        : 'text-amber-400'
                    }
                  >
                    {msg.status}
                  </span>
                  <span className="text-slate-600" aria-hidden="true">·</span>
                  <span className="text-slate-400">{msg.timestamp}</span>
                </div>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">{msg.body}</p>
              <div className="text-[10px] font-mono tabular-nums text-slate-500">
                Fix: {formatDDM(msg.lat, 'lat')} · {formatDDM(msg.lon, 'lon')}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

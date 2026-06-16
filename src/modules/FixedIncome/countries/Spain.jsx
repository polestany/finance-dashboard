import React, { useEffect, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';

const BDE_SERIES = [
  { id: 'DPUDTES00U7', label: '12M' },
  { id: 'DPUG0B1F0ZN', label: '3Y' },
  { id: 'DPUG0B1F0ZO', label: '5Y' },
  { id: 'DPUG0B1F0ZP', label: '10Y' },
  { id: 'DPUG0B1F0ZQ', label: '15Y' },
  { id: 'DPUG0B1F0ZR', label: '30Y' },
];

const SPREAD_SERIES = 'DPUG0B1F0ZPD';
const BUND_SERIES = 'DPUDNBBN308';

const FALLBACK_CURVE = [
  { label: '12M', value: 2.55 },
  { label: '3Y', value: 2.76 },
  { label: '5Y', value: 2.97 },
  { label: '10Y', value: 3.54 },
  { label: '15Y', value: 3.87 },
  { label: '30Y', value: 4.24 },
];

// Spain credit rating info
const CREDIT_RATINGS = [
  { agency: "S&P", rating: "A", outlook: "Stable" },
  { agency: "Moody's", rating: "Baa1", outlook: "Positive" },
  { agency: "Fitch", rating: "A-", outlook: "Stable" },
];

async function fetchBDE(seriesIds) {
  const ids = Array.isArray(seriesIds) ? seriesIds.join(',') : seriesIds;
  const r = await fetch(`/api/data?source=bde&series_id=${ids}`);
  return r.json();
}

function spreadSignal(bps) {
  if (bps === null) return { color: '#888', label: 'N/A', signal: 'neutral' };
  if (bps < 50) return { color: '#27ae60', label: 'Low risk', signal: 'ok' };
  if (bps < 150) return { color: '#f39c12', label: 'Moderate', signal: 'warn' };
  return { color: '#c0392b', label: 'Elevated stress', signal: 'danger' };
}

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload?.length) {
    return (
      <div style={{ background: '#1a1a1a', borderRadius: 6, padding: '8px 12px' }}>
        <div style={{ fontSize: 11, color: '#aaa' }}>{label}</div>
        <div style={{ fontSize: 15, fontWeight: 500, color: '#fff' }}>{payload[0].value.toFixed(3)}%</div>
      </div>
    );
  }
  return null;
};

export default function Spain() {
  const [curveData, setCurveData] = useState([]);
  const [spread, setSpread] = useState(null);
  const [bund, setBund] = useState(null);
  const [date, setDate] = useState('');
  const [loading, setLoading] = useState(true);
  const [usingFallback, setUsingFallback] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const allIds = [...BDE_SERIES.map(s => s.id), SPREAD_SERIES, BUND_SERIES];
        const results = await fetchBDE(allIds);

        const byId = {};
        results.forEach(r => { if (r.serie) byId[r.serie] = r; });

        const curve = BDE_SERIES
          .map(s => byId[s.id] ? { label: s.label, value: byId[s.id].valor } : null)
          .filter(Boolean);

        if (curve.length === 0) throw new Error('No data');

        setCurveData(curve);
        setSpread(byId[SPREAD_SERIES]?.valor ?? null);
        setBund(byId[BUND_SERIES]?.valor ?? null);

        const latestDate = byId[BDE_SERIES[3].id]?.fechaValor;
        if (latestDate) setDate(latestDate.split('T')[0]);
      } catch {
        setCurveData(FALLBACK_CURVE);
        setSpread(0.44);
        setBund(3.04);
        setUsingFallback(true);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const get = (label) => curveData.find(d => d.label === label)?.value;
  const v10y = get('10Y');
  const v30y = get('30Y');
  const v12m = get('12M');
  const spreadBps = spread !== null ? Math.round(spread * 100) : null;
  const { color: spreadColor, label: spreadLabel } = spreadSignal(spreadBps);

  // Slope: 30Y minus 12M
  const slope = v30y && v12m ? (v30y - v12m) : null;

  return (
    <div>
      <p className="module-subtitle">
        {loading ? 'Loading...' : usingFallback
          ? 'Sample data — BDE unavailable'
          : `Bonos del Estado · Banco de España · ${date}`}
      </p>

      {/* Key metrics */}
      <div className="metrics-grid">
        <div className="metric-card">
          <div className="metric-label">10Y Bono</div>
          <div className="metric-value">{v10y ? v10y.toFixed(3) + '%' : '—'}</div>
          <div className="metric-sub">Benchmark maturity</div>
        </div>
        <div className="metric-card">
          <div className="metric-label">30Y Obligación</div>
          <div className="metric-value">{v30y ? v30y.toFixed(3) + '%' : '—'}</div>
          <div className="metric-sub">Long end</div>
        </div>
        <div className="metric-card">
          <div className="metric-label">Risk Premium</div>
          <div className="metric-value" style={{ color: spreadColor }}>
            {spreadBps !== null ? `+${spreadBps} bps` : '—'}
          </div>
          <div className="metric-sub">vs Germany 10Y</div>
        </div>
        <div className="metric-card">
          <div className="metric-label">Curve slope</div>
          <div className="metric-value">
            {slope !== null ? (slope >= 0 ? '+' : '') + (slope * 100).toFixed(0) + ' bps' : '—'}
          </div>
          <div className="metric-sub">30Y minus 12M</div>
        </div>
      </div>

      {/* Yield curve chart */}
      <div className="section">
        <div className="section-label">Yield curve — Bonos & Obligaciones del Estado</div>
        <div className="chart-container">
          {!loading && (
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={curveData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="label" tick={{ fontSize: 12, fill: '#888' }} />
                <YAxis
                  domain={['auto', 'auto']}
                  tick={{ fontSize: 12, fill: '#888' }}
                  tickFormatter={v => v.toFixed(1) + '%'}
                />
                <Tooltip content={<CustomTooltip />} />
                {bund && (
                  <ReferenceLine
                    y={bund}
                    stroke="#aaa"
                    strokeDasharray="4 4"
                    label={{ value: `Bund 10Y ${bund.toFixed(2)}%`, position: 'insideTopRight', fontSize: 11, fill: '#aaa' }}
                  />
                )}
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke="#c0392b"
                  strokeWidth={2.5}
                  dot={{ r: 4, fill: '#c0392b' }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
        <div style={{ fontSize: 11, color: '#bbb', marginTop: 8 }}>
          Dashed line shows German 10Y Bund as benchmark. Source: Banco de España, daily data.
        </div>
      </div>

      {/* Risk premium */}
      <div className="section">
        <div className="section-label">Risk premium</div>
        <div className="spreads-grid">
          <div className="spread-card">
            <div className="spread-name">Bonos–Bund spread (10Y)</div>
            <div className="spread-value" style={{ color: spreadColor }}>
              {spreadBps !== null ? `+${spreadBps} bps` : '—'}
            </div>
            <div className="spread-desc">Spain vs Germany sovereign risk premium</div>
            <span className="signal-badge" style={{
              background: spreadBps < 50 ? '#edf7f0' : spreadBps < 150 ? '#fef9e7' : '#fdf0ee',
              color: spreadColor
            }}>
              {spreadLabel}
            </span>
          </div>
          <div className="spread-card">
            <div className="spread-name">Germany 10Y Bund</div>
            <div className="spread-value">{bund ? bund.toFixed(3) + '%' : '—'}</div>
            <div className="spread-desc">Eurozone risk-free benchmark rate</div>
            <span className="signal-badge neutral">Reference</span>
          </div>
          <div className="spread-card">
            <div className="spread-name">Historical context</div>
            <div className="spread-value" style={{ fontSize: 13, marginTop: 4 }}>
              {spreadBps !== null
                ? spreadBps < 50 ? 'Near pre-crisis lows'
                : spreadBps < 100 ? 'Normal peripheral range'
                : spreadBps < 200 ? 'Elevated — watch zone'
                : 'Crisis territory (2012 peak: ~650 bps)'
                : '—'}
            </div>
            <div className="spread-desc">2012 crisis peak was ~650 bps</div>
            <span className="signal-badge neutral">Context</span>
          </div>
        </div>
      </div>

      {/* Credit ratings */}
      <div className="section">
        <div className="section-label">Credit ratings</div>
        <div className="spreads-grid">
          {CREDIT_RATINGS.map(r => (
            <div className="spread-card" key={r.agency}>
              <div className="spread-name">{r.agency}</div>
              <div className="spread-value" style={{ color: '#1a1a1a', fontSize: 28 }}>{r.rating}</div>
              <div className="spread-desc">Outlook: {r.outlook}</div>
              <span className="signal-badge ok">Investment grade</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

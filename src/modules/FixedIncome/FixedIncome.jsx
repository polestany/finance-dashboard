import React, { useEffect, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import './FixedIncome.css';

const FRED_KEY = process.env.REACT_APP_FRED_KEY;

const SERIES = [
  { id: 'DGS1MO', label: '1M' },
  { id: 'DGS3MO', label: '3M' },
  { id: 'DGS6MO', label: '6M' },
  { id: 'DGS1', label: '1Y' },
  { id: 'DGS2', label: '2Y' },
  { id: 'DGS3', label: '3Y' },
  { id: 'DGS5', label: '5Y' },
  { id: 'DGS7', label: '7Y' },
  { id: 'DGS10', label: '10Y' },
  { id: 'DGS20', label: '20Y' },
  { id: 'DGS30', label: '30Y' },
];

async function fetchSeries(id) {
  const url = `https://api.stlouisfed.org/fred/series/observations?series_id=${id}&api_key=${FRED_KEY}&sort_order=desc&limit=5&file_type=json`;
  const r = await fetch(url);
  const d = await r.json();
  const obs = d.observations?.filter(o => o.value !== '.' && o.value !== '');
  return obs?.length > 0 ? { value: parseFloat(obs[0].value), date: obs[0].date } : null;
}

const FALLBACK = [
  { label: '1M', value: 5.32 }, { label: '3M', value: 5.28 },
  { label: '6M', value: 5.15 }, { label: '1Y', value: 4.97 },
  { label: '2Y', value: 4.72 }, { label: '3Y', value: 4.55 },
  { label: '5Y', value: 4.48 }, { label: '7Y', value: 4.51 },
  { label: '10Y', value: 4.58 }, { label: '20Y', value: 4.79 },
  { label: '30Y', value: 4.82 },
];

function SpreadCard({ name, bps, description, signal, signalText }) {
  const isNeg = bps < 0;
  return (
    <div className="spread-card">
      <div className="spread-name">{name}</div>
      <div className={`spread-value ${isNeg ? 'neg' : 'pos'}`}>
        {bps >= 0 ? '+' : ''}{bps} bps
      </div>
      <div className="spread-desc">{description}</div>
      <span className={`signal-badge ${signal}`}>{signalText}</span>
    </div>
  );
}

export default function FixedIncome() {
  const [curveData, setCurveData] = useState([]);
  const [date, setDate] = useState('');
  const [loading, setLoading] = useState(true);
  const [usingFallback, setUsingFallback] = useState(false);

  useEffect(() => {
    async function load() {
        console.log('FRED KEY:', process.env.REACT_APP_FRED_KEY);  // add this
      try {
        const results = await Promise.all(SERIES.map(s => fetchSeries(s.id)));
        const data = SERIES.map((s, i) => results[i] ? { label: s.label, value: results[i].value } : null).filter(Boolean);
        if (data.length === 0) throw new Error('No data');
        setCurveData(data);
        const d = results.find(r => r);
        if (d) setDate(d.date);
      } catch {
        setCurveData(FALLBACK);
        setUsingFallback(true);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const get = (label) => curveData.find(d => d.label === label)?.value;

  const v2y = get('2Y');
  const v10y = get('10Y');
  const v30y = get('30Y');
  const v3m = get('3M');
  const v5y = get('5Y');

  const spread2s10s = v2y && v10y ? Math.round((v10y - v2y) * 100) : null;
  const spread3m10y = v3m && v10y ? Math.round((v10y - v3m) * 100) : null;
  const spread5s30s = v5y && v30y ? Math.round((v30y - v5y) * 100) : null;

  const customTooltip = ({ active, payload, label }) => {
    if (active && payload?.length) {
      return (
        <div className="chart-tooltip">
          <div className="tooltip-label">{label}</div>
          <div className="tooltip-value">{payload[0].value.toFixed(2)}%</div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="module">
      <div className="module-header">
        <div>
          <h1 className="module-title">Fixed Income</h1>
          <p className="module-subtitle">
            {loading ? 'Loading...' : usingFallback ? 'Sample data — FRED unavailable' : `US Treasury rates · ${date}`}
          </p>
        </div>
      </div>

      <div className="metrics-grid">
        <div className="metric-card">
          <div className="metric-label">2Y yield</div>
          <div className="metric-value">{v2y ? v2y.toFixed(2) + '%' : '—'}</div>
          <div className="metric-sub">Short end</div>
        </div>
        <div className="metric-card">
          <div className="metric-label">10Y yield</div>
          <div className="metric-value">{v10y ? v10y.toFixed(2) + '%' : '—'}</div>
          <div className="metric-sub">Benchmark</div>
        </div>
        <div className="metric-card">
          <div className="metric-label">30Y yield</div>
          <div className="metric-value">{v30y ? v30y.toFixed(2) + '%' : '—'}</div>
          <div className="metric-sub">Long end</div>
        </div>
        <div className="metric-card">
          <div className="metric-label">2s10s spread</div>
          <div className={`metric-value ${spread2s10s < 0 ? 'neg' : ''}`}>
            {spread2s10s !== null ? (spread2s10s >= 0 ? '+' : '') + spread2s10s + ' bps' : '—'}
          </div>
          <div className="metric-sub">Inversion signal</div>
        </div>
      </div>

      <div className="section">
        <div className="section-label">Yield curve</div>
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
                <Tooltip content={customTooltip} />
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke="#1a1a1a"
                  strokeWidth={2}
                  dot={{ r: 3, fill: '#1a1a1a' }}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      <div className="section">
        <div className="section-label">Key spreads & signals</div>
        <div className="spreads-grid">
          {spread2s10s !== null && (
            <SpreadCard
              name="2s10s spread"
              bps={spread2s10s}
              description="Classic recession indicator"
              signal={spread2s10s < 0 ? 'warn' : 'ok'}
              signalText={spread2s10s < 0 ? 'Inverted ⚠' : 'Normal'}
            />
          )}
          {spread3m10y !== null && (
            <SpreadCard
              name="3m10y spread"
              bps={spread3m10y}
              description="Fed's preferred inversion metric"
              signal={spread3m10y < 0 ? 'warn' : 'ok'}
              signalText={spread3m10y < 0 ? 'Inverted ⚠' : 'Normal'}
            />
          )}
          {spread5s30s !== null && (
            <SpreadCard
              name="5s30s spread"
              bps={spread5s30s}
              description="Long-end steepness signal"
              signal="neutral"
              signalText="Structural"
            />
          )}
        </div>
      </div>
    </div>
  );
}
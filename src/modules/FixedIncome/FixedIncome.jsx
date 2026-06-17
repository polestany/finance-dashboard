import React, { useEffect, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip as ChartTooltip } from 'recharts';
import Europe from './countries/Europe';
import './FixedIncome.css';

const US_SERIES = [
  { id: 'DGS1MO', label: '1M' }, { id: 'DGS3MO', label: '3M' },
  { id: 'DGS6MO', label: '6M' }, { id: 'DGS1', label: '1Y' },
  { id: 'DGS2', label: '2Y' }, { id: 'DGS3', label: '3Y' },
  { id: 'DGS5', label: '5Y' }, { id: 'DGS7', label: '7Y' },
  { id: 'DGS10', label: '10Y' }, { id: 'DGS20', label: '20Y' },
  { id: 'DGS30', label: '30Y' },
];

const US_FALLBACK = [
  { label: '1M', value: 5.32 }, { label: '3M', value: 5.28 },
  { label: '6M', value: 5.15 }, { label: '1Y', value: 4.97 },
  { label: '2Y', value: 4.72 }, { label: '3Y', value: 4.55 },
  { label: '5Y', value: 4.48 }, { label: '7Y', value: 4.51 },
  { label: '10Y', value: 4.58 }, { label: '20Y', value: 4.79 },
  { label: '30Y', value: 4.82 },
];

async function fetchFRED(id) {
  const url = `/api/data?series_id=${id}`;
  const r = await fetch(url);
  const d = await r.json();
  const obs = d.observations?.filter(o => o.value !== '.' && o.value !== '');
  return obs?.length > 0 ? { value: parseFloat(obs[0].value), date: obs[0].date } : null;
}

function SpreadCard({ name, bps, description, signal, signalText }) {
  return (
    <div className="spread-card">
      <div className="spread-name">{name}</div>
      <div className={`spread-value ${bps < 0 ? 'neg' : 'pos'}`}>
        {bps >= 0 ? '+' : ''}{bps} bps
      </div>
      <div className="spread-desc">{description}</div>
      <span className={`signal-badge ${signal}`}>{signalText}</span>
    </div>
  );
}

function Tooltip({ text, children }) {
  const [show, setShow] = useState(false);
  return (
    <div style={{ position: 'relative', display: 'inline-block', width: '100%' }}
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
    >
      {children}
      {show && (
        <div style={{
          position: 'absolute', bottom: '105%', left: 0, zIndex: 100,
          background: '#1a1a1a', color: '#fff', borderRadius: 8,
          padding: '10px 14px', fontSize: 12, lineHeight: 1.6,
          width: 220, boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
          pointerEvents: 'none'
        }}>
          {text}
          <div style={{
            position: 'absolute', top: '100%', left: 20,
            borderWidth: 6, borderStyle: 'solid',
            borderColor: '#1a1a1a transparent transparent transparent'
          }} />
        </div>
      )}
    </div>
  );
}

const METRIC_EXPLANATIONS = {
  '2Y yield': 'The yield on 2-year US Treasury bills. Closely tracks Federal Reserve rate expectations — it moves when markets anticipate rate hikes or cuts.',
  '10Y yield': 'The benchmark US Treasury yield. Used globally as the risk-free rate in CAPM and DCF models. Reflects long-term growth and inflation expectations.',
  '30Y yield': 'The long-end of the curve. Driven by long-term inflation expectations and supply/demand for duration. Less sensitive to short-term Fed policy.',
  '2s10s spread': 'The difference between 10Y and 2Y yields. When negative (inverted), it has historically preceded recessions. Based on the expectations hypothesis of the yield curve.',
  '10Y real yield': 'Nominal 10Y yield minus expected inflation (from TIPS). This is what investors actually earn in purchasing power terms — the true cost of capital. Formula: r_real = r_nominal − π^e (Fisher equation).',
  'Breakeven inflation': 'The inflation rate at which a TIPS investor and a nominal Treasury investor earn the same return. Computed as: Nominal 10Y yield − 10Y TIPS yield. Represents the bond market\'s implied inflation forecast.',
  '2s10s': 'Difference between 10Y and 2Y yields. A negative value signals curve inversion — historically a reliable recession indicator.',
  '3m10y': 'The Fed\'s preferred inversion metric. More sensitive to near-term rate expectations than 2s10s.',
  '5s30s': 'Measures the steepness of the long end. A flattening here signals demand for long-duration assets or lower long-term growth expectations.',
};

function MetricCard({ label, value, sub, negative, explanation }) {
  return (
    <Tooltip text={explanation || 'No description available.'}>
      <div className="metric-card" style={{ cursor: 'default', width: '100%' }}>
        <div className="metric-label" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          {label}
          <span style={{ fontSize: 10, color: '#ccc', border: '1px solid #e0e0e0', borderRadius: '50%', width: 14, height: 14, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>?</span>
        </div>
        <div className={`metric-value ${negative ? 'neg' : ''}`}>{value}</div>
        <div className="metric-sub">{sub}</div>
      </div>
    </Tooltip>
  );
}

function USView() {
  const [curveData, setCurveData] = useState([]);
  const [date, setDate] = useState('');
  const [loading, setLoading] = useState(true);
  const [usingFallback, setUsingFallback] = useState(false);
  const [realYield, setRealYield] = useState(null);
  const [breakeven, setBreakeven] = useState(null);

  useEffect(() => {
    async function load() {
      try {
        const results = await Promise.all(US_SERIES.map(s => fetchFRED(s.id)));
        const data = US_SERIES.map((s, i) => results[i] ? { label: s.label, value: results[i].value } : null).filter(Boolean);
        if (data.length === 0) throw new Error('No data');
        setCurveData(data);
        const d = results.find(r => r);
        if (d) setDate(d.date);

        // Fetch real yield and breakeven
        const [realResult, breakevenResult] = await Promise.all([
          fetchFRED('DFII10'),
          fetchFRED('T10YIE'),
        ]);
        if (realResult) setRealYield(realResult.value);
        if (breakevenResult) setBreakeven(breakevenResult.value);
      } catch {
        setCurveData(US_FALLBACK);
        setRealYield(2.10);
        setBreakeven(2.48);
        setUsingFallback(true);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const get = (label) => curveData.find(d => d.label === label)?.value;
  const v2y = get('2Y'), v10y = get('10Y'), v30y = get('30Y');
  const v3m = get('3M'), v5y = get('5Y');
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
    <>
      <p className="module-subtitle">
        {loading ? 'Loading...' : usingFallback ? 'Sample data — FRED unavailable' : `US Treasury rates · ${date}`}
      </p>

      {/* Main metrics */}
      <div className="metrics-grid">
        <MetricCard label="2Y yield" value={v2y ? v2y.toFixed(2) + '%' : '—'} sub="Short end" explanation={METRIC_EXPLANATIONS['2Y yield']} />
        <MetricCard label="10Y yield" value={v10y ? v10y.toFixed(2) + '%' : '—'} sub="Benchmark" explanation={METRIC_EXPLANATIONS['10Y yield']} />
        <MetricCard label="30Y yield" value={v30y ? v30y.toFixed(2) + '%' : '—'} sub="Long end" explanation={METRIC_EXPLANATIONS['30Y yield']} />
        <MetricCard label="2s10s spread" value={spread2s10s !== null ? (spread2s10s >= 0 ? '+' : '') + spread2s10s + ' bps' : '—'} sub="Inversion signal" negative={spread2s10s < 0} explanation={METRIC_EXPLANATIONS['2s10s spread']} />
      </div>

      {/* Real yield & breakeven row */}
      <div className="metrics-grid" style={{ marginBottom: '2rem' }}>
        <MetricCard
          label="10Y real yield"
          value={realYield !== null ? (realYield >= 0 ? '+' : '') + realYield.toFixed(2) + '%' : '—'}
          sub="TIPS-derived · Fisher equation"
          negative={realYield < 0}
          explanation={METRIC_EXPLANATIONS['10Y real yield']}
        />
        <MetricCard
          label="Breakeven inflation"
          value={breakeven !== null ? breakeven.toFixed(2) + '%' : '—'}
          sub="Market implied 10Y inflation"
          explanation={METRIC_EXPLANATIONS['Breakeven inflation']}
        />
        <MetricCard
          label="Inflation premium"
          value={v10y && realYield !== null ? (v10y - realYield).toFixed(2) + '%' : '—'}
          sub="Nominal minus real"
          explanation="The portion of the nominal yield that compensates investors for expected inflation. Equals the breakeven inflation rate when markets are efficient."
        />
        <MetricCard
          label="Real vs nominal gap"
          value={v10y && realYield !== null ? Math.round((v10y - realYield) * 100) + ' bps' : '—'}
          sub="Inflation compensation"
          explanation="How many basis points of the 10Y yield are pure inflation compensation vs real return. A high gap means inflation expectations are elevated."
        />
      </div>

      {/* Chart */}
      <div className="section">
        <div className="section-label">Yield curve</div>
        <div className="chart-container">
          {!loading && (
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={curveData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="label" tick={{ fontSize: 12, fill: '#888' }} />
                <YAxis domain={['auto', 'auto']} tick={{ fontSize: 12, fill: '#888' }} tickFormatter={v => v.toFixed(1) + '%'} />
                <ChartTooltip content={customTooltip} />
                <Line type="monotone" dataKey="value" stroke="#1a1a1a" strokeWidth={2} dot={{ r: 3, fill: '#1a1a1a' }} activeDot={{ r: 5 }} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Spreads */}
      <div className="section">
        <div className="section-label">Key spreads & signals</div>
        <div className="spreads-grid">
          {spread2s10s !== null && <SpreadCard name="2s10s spread" bps={spread2s10s} description="Classic recession indicator" signal={spread2s10s < 0 ? 'warn' : 'ok'} signalText={spread2s10s < 0 ? 'Inverted ⚠' : 'Normal'} />}
          {spread3m10y !== null && <SpreadCard name="3m10y spread" bps={spread3m10y} description="Fed's preferred inversion metric" signal={spread3m10y < 0 ? 'warn' : 'ok'} signalText={spread3m10y < 0 ? 'Inverted ⚠' : 'Normal'} />}
          {spread5s30s !== null && <SpreadCard name="5s30s spread" bps={spread5s30s} description="Long-end steepness signal" signal="neutral" signalText="Structural" />}
        </div>
      </div>
    </>
  );
}

const COUNTRIES = [
  { id: 'US', label: 'United States' },
  { id: 'EU', label: 'Europe' },
];

export default function FixedIncome() {
  const [country, setCountry] = useState('EU');

  return (
    <div className="module">
      <div className="module-header">
        <div>
          <h1 className="module-title">Fixed Income</h1>
        </div>
        <div className="toggle-group">
          {COUNTRIES.map(c => (
            <button
              key={c.id}
              className={`toggle-btn ${country === c.id ? 'active' : ''}`}
              onClick={() => setCountry(c.id)}
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>
      {country === 'US' ? <USView /> : <Europe />}
    </div>
  );
}

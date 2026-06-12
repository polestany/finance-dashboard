import React, { useEffect, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import './FixedIncome.css';

const US_SERIES = [
  { id: 'DGS1MO', label: '1M' }, { id: 'DGS3MO', label: '3M' },
  { id: 'DGS6MO', label: '6M' }, { id: 'DGS1', label: '1Y' },
  { id: 'DGS2', label: '2Y' }, { id: 'DGS3', label: '3Y' },
  { id: 'DGS5', label: '5Y' }, { id: 'DGS7', label: '7Y' },
  { id: 'DGS10', label: '10Y' }, { id: 'DGS20', label: '20Y' },
  { id: 'DGS30', label: '30Y' },
];

const EU_SERIES = [
  { id: 'IRLTLT01DEM156N', label: 'Germany 10Y' },
  { id: 'IRLTLT01ITM156N', label: 'Italy 10Y' },
  { id: 'IRLTLT01ESM156N', label: 'Spain 10Y' },
  { id: 'ECBDFR', label: 'ECB rate' },
];

const US_FALLBACK = [
  { label: '1M', value: 5.32 }, { label: '3M', value: 5.28 },
  { label: '6M', value: 5.15 }, { label: '1Y', value: 4.97 },
  { label: '2Y', value: 4.72 }, { label: '3Y', value: 4.55 },
  { label: '5Y', value: 4.48 }, { label: '7Y', value: 4.51 },
  { label: '10Y', value: 4.58 }, { label: '20Y', value: 4.79 },
  { label: '30Y', value: 4.82 },
];

const EU_FALLBACK = {
  germany: 2.52, italy: 3.65, spain: 3.18, ecb: 2.50
};

async function fetchSeries(id) {
  const url = `/api/fred?series_id=${id}`;
  const r = await fetch(url);
  const d = await r.json();
  const obs = d.observations?.filter(o => o.value !== '.' && o.value !== '');
  return obs?.length > 0 ? { value: parseFloat(obs[0].value), date: obs[0].date } : null;
}

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

function MetricCard({ label, value, sub, negative }) {
  return (
    <div className="metric-card">
      <div className="metric-label">{label}</div>
      <div className={`metric-value ${negative ? 'neg' : ''}`}>{value}</div>
      <div className="metric-sub">{sub}</div>
    </div>
  );
}

function USView() {
  const [curveData, setCurveData] = useState([]);
  const [date, setDate] = useState('');
  const [loading, setLoading] = useState(true);
  const [usingFallback, setUsingFallback] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const results = await Promise.all(US_SERIES.map(s => fetchSeries(s.id)));
        const data = US_SERIES.map((s, i) => results[i] ? { label: s.label, value: results[i].value } : null).filter(Boolean);
        if (data.length === 0) throw new Error('No data');
        setCurveData(data);
        const d = results.find(r => r);
        if (d) setDate(d.date);
      } catch {
        setCurveData(US_FALLBACK);
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
      <div className="metrics-grid">
        <MetricCard label="2Y yield" value={v2y ? v2y.toFixed(2) + '%' : '—'} sub="Short end" />
        <MetricCard label="10Y yield" value={v10y ? v10y.toFixed(2) + '%' : '—'} sub="Benchmark" />
        <MetricCard label="30Y yield" value={v30y ? v30y.toFixed(2) + '%' : '—'} sub="Long end" />
        <MetricCard label="2s10s spread" value={spread2s10s !== null ? (spread2s10s >= 0 ? '+' : '') + spread2s10s + ' bps' : '—'} sub="Inversion signal" negative={spread2s10s < 0} />
      </div>
      <div className="section">
        <div className="section-label">Yield curve</div>
        <div className="chart-container">
          {!loading && (
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={curveData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="label" tick={{ fontSize: 12, fill: '#888' }} />
                <YAxis domain={['auto', 'auto']} tick={{ fontSize: 12, fill: '#888' }} tickFormatter={v => v.toFixed(1) + '%'} />
                <Tooltip content={customTooltip} />
                <Line type="monotone" dataKey="value" stroke="#1a1a1a" strokeWidth={2} dot={{ r: 3, fill: '#1a1a1a' }} activeDot={{ r: 5 }} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
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

function EUView() {
  const [data, setData] = useState(null);
  const [date, setDate] = useState('');
  const [loading, setLoading] = useState(true);
  const [usingFallback, setUsingFallback] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const results = await Promise.all(EU_SERIES.map(s => fetchSeries(s.id)));
        const [germany, italy, spain, ecb] = results;
        if (!germany) throw new Error('No data');
        setData({
          germany: germany.value,
          italy: italy?.value,
          spain: spain?.value,
          ecb: ecb?.value,
        });
        setDate(germany.date);
      } catch {
        setData(EU_FALLBACK);
        setUsingFallback(true);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) return <p className="module-subtitle">Loading...</p>;

  const btpBund = data.italy && data.germany ? Math.round((data.italy - data.germany) * 100) : null;
  const bonosBund = data.spain && data.germany ? Math.round((data.spain - data.germany) * 100) : null;

  const spreadSignal = (bps) => {
    if (bps === null) return { signal: 'neutral', text: '—' };
    if (bps > 200) return { signal: 'warn', text: 'Elevated stress ⚠' };
    if (bps > 100) return { signal: 'neutral', text: 'Watch zone' };
    return { signal: 'ok', text: 'Contained' };
  };

  return (
    <>
      <p className="module-subtitle">
        {usingFallback ? 'Sample data — FRED unavailable' : `Eurozone rates · ${date} · Monthly OECD data via FRED`}
      </p>
      <div className="metrics-grid">
        <MetricCard label="Germany 10Y" value={data.germany ? data.germany.toFixed(2) + '%' : '—'} sub="Bund benchmark" />
        <MetricCard label="Italy 10Y" value={data.italy ? data.italy.toFixed(2) + '%' : '—'} sub="BTP" />
        <MetricCard label="Spain 10Y" value={data.spain ? data.spain.toFixed(2) + '%' : '—'} sub="Bonos" />
        <MetricCard label="ECB deposit rate" value={data.ecb ? data.ecb.toFixed(2) + '%' : '—'} sub="Policy anchor" />
      </div>
      <div className="section">
        <div className="section-label">Sovereign spreads vs Bund</div>
        <div className="spreads-grid">
          {btpBund !== null && (
            <SpreadCard
              name="BTP–Bund spread"
              bps={btpBund}
              description="Italy vs Germany · eurozone stress gauge"
              signal={spreadSignal(btpBund).signal}
              signalText={spreadSignal(btpBund).text}
            />
          )}
          {bonosBund !== null && (
            <SpreadCard
              name="Bonos–Bund spread"
              bps={bonosBund}
              description="Spain vs Germany · peripheral risk"
              signal={spreadSignal(bonosBund).signal}
              signalText={spreadSignal(bonosBund).text}
            />
          )}
          {btpBund !== null && bonosBund !== null && (
            <SpreadCard
              name="BTP–Bonos spread"
              bps={btpBund - bonosBund}
              description="Italy vs Spain · relative peripheral risk"
              signal="neutral"
              signalText="Comparative"
            />
          )}
        </div>
      </div>
      <div className="section">
        <div className="section-label">Policy context</div>
        <div className="policy-note">
          The ECB deposit rate ({data.ecb ? data.ecb.toFixed(2) + '%' : '—'}) is the floor for eurozone overnight rates.
          Germany's 10Y Bund ({data.germany ? data.germany.toFixed(2) + '%' : '—'}) trades above it,
          implying a term premium of ~{data.ecb && data.germany ? Math.round((data.germany - data.ecb) * 100) : '—'} bps.
          Peripheral spreads reflect country-specific fiscal risk on top of this baseline.
        </div>
      </div>
    </>
  );
}

export default function FixedIncome() {
  const [region, setRegion] = useState('US');

  return (
    <div className="module">
      <div className="module-header">
        <div>
          <h1 className="module-title">Fixed Income</h1>
        </div>
        <div className="toggle-group">
          <button className={`toggle-btn ${region === 'US' ? 'active' : ''}`} onClick={() => setRegion('US')}>US</button>
          <button className={`toggle-btn ${region === 'EU' ? 'active' : ''}`} onClick={() => setRegion('EU')}>Europe</button>
        </div>
      </div>
      {region === 'US' ? <USView /> : <EUView />}
    </div>
  );
}
import React, { useEffect, useState } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip as ChartTooltip, ResponsiveContainer, ReferenceDot
} from 'recharts';

const COUNTRY_COLORS = {
  DE: '#2c3e50', FR: '#2980b9', IT: '#27ae60',
  ES: '#c0392b', PT: '#8e44ad', GR: '#e67e22',
};

const COUNTRY_LABELS = {
  DE: 'Germany', FR: 'France', IT: 'Italy',
  ES: 'Spain', PT: 'Portugal', GR: 'Greece',
};

const COUNTRY_SERIES = {
  DE: { source: 'fred', id: 'IRLTLT01DEM156N' },
  FR: { source: 'fred', id: 'IRLTLT01FRM156N' },
  IT: { source: 'fred', id: 'IRLTLT01ITM156N' },
  ES: { source: 'bde', id: 'DPUG0B1F0ZP' },
  PT: { source: 'fred', id: 'IRLTLT01PTM156N' },
  GR: { source: 'fred', id: 'IRLTLT01GRM156N' },
};

const ECB_MATURITIES = ['3M','6M','1Y','2Y','3Y','5Y','7Y','10Y','15Y','20Y','30Y'];

const COUNTRY_INFO = {
  DE: { rating: 'AAA', gdp: '4.1T', debt: '63% GDP', outlook: 'Stable' },
  FR: { rating: 'AA-', gdp: '3.0T', debt: '111% GDP', outlook: 'Negative' },
  IT: { rating: 'BBB', gdp: '2.2T', debt: '137% GDP', outlook: 'Stable' },
  ES: { rating: 'A', gdp: '1.5T', debt: '107% GDP', outlook: 'Stable' },
  PT: { rating: 'A-', gdp: '0.3T', debt: '99% GDP', outlook: 'Positive' },
  GR: { rating: 'BBB-', gdp: '0.2T', debt: '161% GDP', outlook: 'Positive' },
};

async function fetchECBCurve() {
  const results = await Promise.all(
    ECB_MATURITIES.map(m =>
      fetch(`/api/data?source=ecb&series_id=SR_${m}`)
        .then(r => r.json())
        .then(d => ({ label: m, value: d.value }))
        .catch(() => ({ label: m, value: null }))
    )
  );
  return results.filter(r => r.value !== null);
}

async function fetchFRED10Y(id) {
  const r = await fetch(`/api/data?series_id=${id}`);
  const d = await r.json();
  const obs = d.observations?.filter(o => o.value !== '.' && o.value !== '');
  return obs?.length > 0 ? { value: parseFloat(obs[0].value), date: obs[0].date } : null;
}

async function fetchBDE10Y(id) {
  const r = await fetch(`/api/data?source=bde&series_id=${id}`);
  const d = await r.json();
  const record = Array.isArray(d) ? d.find(item => item.serie === id) : null;
  return record?.valor !== undefined && record?.valor !== null
    ? { value: parseFloat(record.valor), date: record.fechaValor?.split('T')[0] }
    : null;
}

const FALLBACK_CURVE = [
  { label: '3M', value: 2.22 }, { label: '6M', value: 2.32 },
  { label: '1Y', value: 2.44 }, { label: '2Y', value: 2.52 },
  { label: '3Y', value: 2.55 }, { label: '5Y', value: 2.64 },
  { label: '7Y', value: 2.79 }, { label: '10Y', value: 3.01 },
  { label: '15Y', value: 3.29 }, { label: '20Y', value: 3.45 },
  { label: '30Y', value: 3.52 },
];

const FALLBACK_10Y = { DE: 3.05, FR: 3.74, IT: 3.82, ES: 3.54, PT: 3.42, GR: 3.75 };

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload?.length) {
    return (
      <div style={{ background: '#1a1a1a', borderRadius: 8, padding: '10px 14px' }}>
        <div style={{ fontSize: 11, color: '#aaa', marginBottom: 4 }}>{label} maturity</div>
        <div style={{ fontSize: 14, color: '#fff', fontWeight: 500 }}>
          {payload[0]?.value?.toFixed(3)}%
        </div>
        <div style={{ fontSize: 11, color: '#888', marginTop: 2 }}>ECB AAA composite</div>
      </div>
    );
  }
  return null;
};

export default function Europe() {
  const [ecbCurve, setEcbCurve] = useState([]);
  const [tenYear, setTenYear] = useState({});
  const [date, setDate] = useState('');
  const [loading, setLoading] = useState(true);
  const [usingFallback, setUsingFallback] = useState(false);
  const [active, setActive] = useState(
    Object.keys(COUNTRY_LABELS).reduce((a, k) => ({ ...a, [k]: true }), {})
  );

  useEffect(() => {
    async function load() {
      try {
        const [curve, ...fredResults] = await Promise.all([
          fetchECBCurve(),
          ...Object.entries(COUNTRY_SERIES).map(([country, series]) =>
            (series.source === 'bde' ? fetchBDE10Y(series.id) : fetchFRED10Y(series.id))
              .then(r => ({ country, value: r?.value ?? null, date: r?.date }))
          )
        ]);

        if (curve.length === 0) throw new Error('No ECB data');
        setEcbCurve(curve);

        const t10y = {};
        fredResults.forEach(r => { t10y[r.country] = r.value; });
        setTenYear(t10y);

        const latestDate = fredResults
          .map(r => r.date)
          .filter(Boolean)
          .sort((a, b) => new Date(b) - new Date(a))[0];
        if (latestDate) setDate(latestDate.split('T')[0]);

      } catch {
        setEcbCurve(FALLBACK_CURVE);
        setTenYear(FALLBACK_10Y);
        setUsingFallback(true);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const toggleCountry = (id) => setActive(prev => ({ ...prev, [id]: !prev[id] }));

  const ecb10Y = ecbCurve.find(d => d.label === '10Y')?.value;

  return (
    <div>
      <p className="module-subtitle">
        {loading ? 'Loading...' : usingFallback
          ? 'Sample data — sources unavailable'
          : `ECB AAA curve (daily) · Country 10Y: FRED/OECD (Spain via BDE) · ${date}`}
      </p>

      {/* Country toggles */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: '1.5rem' }}>
        {Object.keys(COUNTRY_LABELS).map(id => (
          <button
            key={id}
            onClick={() => toggleCountry(id)}
            style={{
              padding: '6px 16px', borderRadius: 20, fontSize: 13, cursor: 'pointer',
              border: `2px solid ${COUNTRY_COLORS[id]}`,
              background: active[id] ? COUNTRY_COLORS[id] : 'transparent',
              color: active[id] ? '#fff' : COUNTRY_COLORS[id],
              fontWeight: 500, transition: 'all 0.15s',
            }}
          >
            {COUNTRY_LABELS[id]}
          </button>
        ))}
      </div>

      {/* Chart */}
      <div className="section">
        <div className="section-label">ECB AAA yield curve + country 10Y benchmarks</div>
        <div className="chart-container">
          {!loading && (
            <ResponsiveContainer width="100%" height={340}>
              <LineChart data={ecbCurve} margin={{ top: 20, right: 40, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="label" tick={{ fontSize: 12, fill: '#888' }} />
                <YAxis
                  domain={['auto', 'auto']}
                  tick={{ fontSize: 12, fill: '#888' }}
                  tickFormatter={v => v.toFixed(1) + '%'}
                />
                <ChartTooltip content={<CustomTooltip />} />

                {/* ECB composite curve */}
                <Line
                  type="monotone" dataKey="value"
                  stroke="#bbb" strokeWidth={2}
                  strokeDasharray="6 3"
                  dot={false} activeDot={{ r: 4 }}
                  name="ECB AAA"
                />

                {/* 10Y dots per country */}
                {Object.keys(COUNTRY_LABELS).map(country =>
                  active[country] && tenYear[country] != null ? (
                    <ReferenceDot
                      key={country}
                      x="10Y"
                      y={tenYear[country]}
                      r={8}
                      fill={COUNTRY_COLORS[country]}
                      stroke="#fff"
                      strokeWidth={2}
                      label={{
                        value: `${country} ${tenYear[country]?.toFixed(2)}%`,
                        position: tenYear[country] > (ecb10Y || 3) ? 'top' : 'bottom',
                        fontSize: 11,
                        fill: COUNTRY_COLORS[country],
                        fontWeight: 600,
                      }}
                    />
                  ) : null
                )}
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
        <div style={{ fontSize: 11, color: '#bbb', marginTop: 8 }}>
          Dashed line: ECB AAA composite eurozone curve (daily). Dots: individual country 10Y yields (OECD monthly via FRED, Spain via BDE). ECB curve excludes non-AAA issuers — country dots above the curve reflect credit/fiscal risk premium.
        </div>
      </div>

      {/* Country cards */}
      <div className="section">
        <div className="section-label">Country snapshot</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
          {Object.keys(COUNTRY_LABELS).map(id => {
            const val = tenYear[id];
            const spreadVsECB = val != null && ecb10Y != null ? Math.round((val - ecb10Y) * 100) : null;
            const spreadVsBund = val != null && tenYear['DE'] != null && id !== 'DE'
              ? Math.round((val - tenYear['DE']) * 100) : null;
            const info = COUNTRY_INFO[id];
            return (
              <div
                key={id}
                className="spread-card"
                style={{
                  opacity: active[id] ? 1 : 0.35,
                  borderLeft: `3px solid ${COUNTRY_COLORS[id]}`,
                  transition: 'opacity 0.2s',
                }}
              >
                <div className="spread-name">{COUNTRY_LABELS[id]}</div>
                <div className="spread-value" style={{ color: COUNTRY_COLORS[id], fontSize: 24 }}>
                  {val ? val.toFixed(2) + '%' : '—'}
                  <span style={{ fontSize: 12, color: '#aaa', fontWeight: 400, marginLeft: 6 }}>10Y</span>
                </div>

                <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {spreadVsBund !== null && (
                    <div style={{ fontSize: 12, color: '#666' }}>
                      vs Bund: <span style={{ fontWeight: 500, color: spreadVsBund > 150 ? '#c0392b' : spreadVsBund > 75 ? '#e67e22' : '#27ae60' }}>
                        +{spreadVsBund} bps
                      </span>
                    </div>
                  )}
                  {spreadVsECB !== null && (
                    <div style={{ fontSize: 12, color: '#666' }}>
                      vs ECB AAA: <span style={{ fontWeight: 500 }}>+{spreadVsECB} bps</span>
                    </div>
                  )}
                  {id === 'DE' && ecb10Y != null && val != null && (
                    <div style={{ fontSize: 12, color: '#666' }}>
                      vs ECB AAA: <span style={{ fontWeight: 500 }}>
                        {Math.round((val - ecb10Y) * 100) > 0 ? '+' : ''}{Math.round((val - ecb10Y) * 100)} bps
                      </span>
                    </div>
                  )}
                </div>

                <div style={{ marginTop: 10, paddingTop: 10, borderTop: '1px solid #f0f0f0', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                  <div>
                    <div style={{ fontSize: 10, color: '#bbb' }}>Rating</div>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>{info.rating}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 10, color: '#bbb' }}>Outlook</div>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>{info.outlook}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 10, color: '#bbb' }}>GDP</div>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>{info.gdp}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 10, color: '#bbb' }}>Debt/GDP</div>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>{info.debt}</div>
                  </div>
                </div>

                <span className="signal-badge neutral" style={{ marginTop: 8 }}>
                  {COUNTRY_SERIES[id].source === 'bde' ? 'Daily · BDE' : 'Monthly · FRED'}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
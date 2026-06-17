import React, { useEffect, useState } from 'react';
import {
  ComposedChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip as ChartTooltip, ResponsiveContainer
} from 'recharts';

const COLORS = {
  DE: '#1a1a1a', FR: '#2980b9', IT: '#27ae60',
  ES: '#c0392b', PT: '#8e44ad', GR: '#e67e22',
};

const LABELS = {
  DE: 'Germany', FR: 'France', IT: 'Italy',
  ES: 'Spain', PT: 'Portugal', GR: 'Greece',
};

const FRED_10Y = {
  DE: 'IRLTLT01DEM156N', FR: 'IRLTLT01FRM156N',
  IT: 'IRLTLT01ITM156N', ES: 'IRLTLT01ESM156N',
  PT: 'IRLTLT01PTM156N', GR: 'IRLTLT01GRM156N',
};

const COUNTRY_INFO = {
  DE: { rating: 'AAA', debt: '63%', outlook: 'Stable' },
  FR: { rating: 'AA-', debt: '118%', outlook: 'Negative' },
  IT: { rating: 'BBB', debt: '137%', outlook: 'Stable' },
  ES: { rating: 'A', debt: '103%', outlook: 'Stable' },
  PT: { rating: 'A-', debt: '99%', outlook: 'Positive' },
  GR: { rating: 'BBB-', debt: '150%', outlook: 'Positive' },
};

const ECB_MATURITIES = ['3M','6M','1Y','2Y','3Y','5Y','7Y','10Y','15Y','20Y','30Y'];

const FALLBACK_CURVE = [
  { label: '3M', value: 2.22 }, { label: '6M', value: 2.32 },
  { label: '1Y', value: 2.44 }, { label: '2Y', value: 2.52 },
  { label: '3Y', value: 2.55 }, { label: '5Y', value: 2.64 },
  { label: '7Y', value: 2.79 }, { label: '10Y', value: 3.01 },
  { label: '15Y', value: 3.29 }, { label: '20Y', value: 3.45 },
  { label: '30Y', value: 3.52 },
];

const FALLBACK_10Y = { DE: 3.05, FR: 3.74, IT: 3.82, ES: 3.54, PT: 3.42, GR: 3.75 };

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

async function fetchFRED(id) {
  const r = await fetch(`/api/data?series_id=${id}`);
  const d = await r.json();
  const obs = d.observations?.filter(o => o.value !== '.' && o.value !== '');
  return obs?.length > 0 ? { value: parseFloat(obs[0].value), date: obs[0].date } : null;
}

const CustomDot = (props) => {
  const { cx, cy, payload, country, color } = props;
  if (!payload || payload[country] == null) return null;
  return (
    <g>
      <circle cx={cx} cy={cy} r={7} fill={color} stroke="#fff" strokeWidth={2} />
      <text x={cx} y={cy - 12} textAnchor="middle" fontSize={11} fill={color} fontWeight={600}>
        {country} {payload[country]?.toFixed(2)}%
      </text>
    </g>
  );
};

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload?.length) {
    const ecbVal = payload.find(p => p.dataKey === 'value');
    return (
      <div className="chart-tooltip">
        <div className="tooltip-label">{label}</div>
        {ecbVal && <div className="tooltip-value">ECB AAA: {ecbVal.value?.toFixed(3)}%</div>}
        {payload.filter(p => p.dataKey !== 'value' && p.value != null).map(p => (
          <div key={p.dataKey} style={{ fontSize: 12, color: COLORS[p.dataKey] || '#fff', marginTop: 2 }}>
            {LABELS[p.dataKey]}: {p.value?.toFixed(3)}%
          </div>
        ))}
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
  const [viewMode, setViewMode] = useState('cards');
  const [active, setActive] = useState(
    Object.keys(LABELS).reduce((a, k) => ({ ...a, [k]: true }), {})
  );

  useEffect(() => {
    async function load() {
      try {
        const [curve, ...fredResults] = await Promise.all([
          fetchECBCurve(),
          ...Object.entries(FRED_10Y).map(([country, id]) =>
            fetchFRED(id).then(r => ({ country, value: r?.value ?? null, date: r?.date }))
          )
        ]);

        if (curve.length === 0) throw new Error('No ECB data');
        setEcbCurve(curve);

        const t10y = {};
        fredResults.forEach(r => { t10y[r.country] = r.value; });
        setTenYear(t10y);

        const latestDate = fredResults.map(r => r.date).filter(Boolean).sort((a, b) => new Date(b) - new Date(a))[0];
        if (latestDate) setDate(latestDate);
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

  const toggle = (id) => setActive(prev => ({ ...prev, [id]: !prev[id] }));
  const ecb10Y = ecbCurve.find(d => d.label === '10Y')?.value;

  const [sortConfig, setSortConfig] = useState({ key: 'yield10y', direction: 'desc' });

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const ratingScale = {
    AAA: 1, 'AA-': 2, A: 3, 'A-': 4, BBB: 5, 'BBB-': 6,
  };

  const countriesList = Object.keys(LABELS).map(id => {
    const val = tenYear[id];
    const riskPremium = val != null && tenYear.DE != null && id !== 'DE'
      ? Math.round((val - tenYear.DE) * 100) : (id === 'DE' ? 0 : null);

    return {
      id,
      name: LABELS[id],
      yield10y: val,
      riskPremium,
      rating: COUNTRY_INFO[id].rating,
    };
  });

  const sortedCountries = [...countriesList].sort((a, b) => {
    let aValue = a[sortConfig.key];
    let bValue = b[sortConfig.key];

    if (sortConfig.key === 'rating') {
      aValue = ratingScale[a.rating] || 99;
      bValue = ratingScale[b.rating] || 99;
    }

    if (aValue == null) return 1;
    if (bValue == null) return -1;

    if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
    if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
    return 0;
  });

  const getSortIcon = (key) => {
    if (sortConfig.key !== key) return '↕';
    return sortConfig.direction === 'asc' ? '▲' : '▼';
  };

  // Inject country 10Y values into the 10Y data point
  const chartData = ecbCurve.map(point => {
    if (point.label === '10Y') {
      const enriched = { ...point };
      Object.keys(LABELS).forEach(country => {
        if (active[country] && tenYear[country] != null) {
          enriched[country] = tenYear[country];
        }
      });
      return enriched;
    }
    return point;
  });

  return (
    <>
      <p className="module-subtitle">
        {loading ? 'Loading...' : usingFallback
          ? 'Sample data — sources unavailable'
          : `ECB AAA curve (daily) · Country 10Y via FRED/OECD (monthly) · ${date}`}
      </p>

      {/* Country toggles */}
      <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', marginBottom: '1.5rem', borderBottom: '1px solid #ebebeb', paddingBottom: '1rem' }}>
        {Object.keys(LABELS).map(id => (
          <button
            key={id}
            onClick={() => toggle(id)}
            style={{
              background: 'none', border: 'none', padding: 0,
              fontSize: 13, cursor: 'pointer',
              color: active[id] ? COLORS[id] : '#ccc',
              fontWeight: active[id] ? 500 : 400,
              fontFamily: 'inherit',
              transition: 'color 0.15s',
              display: 'flex', alignItems: 'center', gap: 6,
            }}
          >
            <span style={{
              width: 6, height: 6, borderRadius: '50%',
              background: active[id] ? COLORS[id] : '#ddd',
              display: 'inline-block', flexShrink: 0,
              transition: 'background 0.15s',
            }} />
            {LABELS[id]}
          </button>
        ))}
      </div>

      {/* Chart */}
      <div className="section">
        <div className="section-label">ECB AAA yield curve · country 10Y benchmarks</div>
        <div className="chart-container">
          {!loading && (
            <ResponsiveContainer width="100%" height={340}>
              <ComposedChart data={chartData} margin={{ top: 24, right: 50, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="label" tick={{ fontSize: 12, fill: '#888' }} />
                <YAxis
                  domain={['auto', 'auto']}
                  tick={{ fontSize: 12, fill: '#888' }}
                  tickFormatter={v => v.toFixed(1) + '%'}
                />
                <ChartTooltip content={<CustomTooltip />} />

                {/* ECB AAA curve */}
                <Line
                  type="monotone" dataKey="value"
                  stroke="#ddd" strokeWidth={2}
                  strokeDasharray="5 3" dot={false}
                  name="ECB AAA"
                />

                {/* Country dots at 10Y */}
                {Object.keys(LABELS).map(country =>
                  active[country] ? (
                    <Line
                      key={country}
                      dataKey={country}
                      stroke={COLORS[country]}
                      dot={(props) => <CustomDot {...props} country={country} color={COLORS[country]} />}
                      activeDot={false}
                      strokeWidth={0}
                      legendType="none"
                      connectNulls={false}
                    />
                  ) : null
                )}
              </ComposedChart>
            </ResponsiveContainer>
          )}
        </div>
        <div style={{ fontSize: 11, color: '#ccc', marginTop: 8, lineHeight: 1.5 }}>
          Dashed line: ECB AAA composite curve (daily). Dots: country 10Y yields (OECD monthly via FRED). Dots above the curve reflect sovereign risk premium.
        </div>
      </div>

      <div className="toggle-group" style={{ marginBottom: '1.5rem' }}>
        <button
          type="button"
          className={`toggle-btn ${viewMode === 'cards' ? 'active' : ''}`}
          onClick={() => setViewMode('cards')}
        >
          Cards
        </button>
        <button
          type="button"
          className={`toggle-btn ${viewMode === 'table' ? 'active' : ''}`}
          onClick={() => setViewMode('table')}
        >
          Table
        </button>
      </div>

      {viewMode === 'cards' ? (
        <div className="section">
          <div className="section-label">Country snapshot · 10Y yields & spreads</div>
          <div className="spreads-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
            {Object.keys(LABELS).map(id => {
              const val = tenYear[id];
              const spreadVsBund = val != null && tenYear.DE != null && id !== 'DE'
                ? Math.round((val - tenYear.DE) * 100) : null;
              const spreadVsECB = val != null && ecb10Y != null
                ? Math.round((val - ecb10Y) * 100) : null;
              const info = COUNTRY_INFO[id];
              const ratingColor = info.rating.startsWith('AA') ? '#27ae60' : info.rating.startsWith('A') ? '#27ae60' : '#e67e22';

              return (
                <div
                  key={id}
                  className="spread-card"
                  style={{ opacity: active[id] ? 1 : 0.3, transition: 'opacity 0.2s' }}
                >
                  <div className="spread-name" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: COLORS[id], display: 'inline-block' }} />
                    {LABELS[id]}
                  </div>
                  <div className="spread-value" style={{ color: COLORS[id] }}>
                    {val ? val.toFixed(2) + '%' : '—'}
                    <span style={{ fontSize: 11, color: '#bbb', fontWeight: 400, marginLeft: 6 }}>10Y</span>
                  </div>

                  <div style={{ marginTop: 8, fontSize: 12, color: '#888', display: 'flex', flexDirection: 'column', gap: 3 }}>
                    {spreadVsBund !== null && (
                      <span>vs Bund: <b style={{ color: spreadVsBund > 150 ? '#c0392b' : spreadVsBund > 75 ? '#e67e22' : '#27ae60' }}>+{spreadVsBund} bps</b></span>
                    )}
                    {spreadVsECB !== null && (
                      <span>vs ECB AAA: <b>{spreadVsECB > 0 ? '+' : ''}{spreadVsECB} bps</b></span>
                    )}
                  </div>

                  <div style={{ marginTop: 10, paddingTop: 10, borderTop: '1px solid #f5f5f5', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                    <div>
                      <div style={{ fontSize: 10, color: '#ccc' }}>Rating</div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: ratingColor }}>{info.rating}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: 10, color: '#ccc' }}>Outlook</div>
                      <div style={{ fontSize: 13, fontWeight: 600 }}>{info.outlook}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: 10, color: '#ccc' }}>Debt/GDP</div>
                      <div style={{ fontSize: 13, fontWeight: 600 }}>{info.debt}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: 10, color: '#ccc' }}>Source</div>
                      <div style={{ fontSize: 11, color: '#aaa' }}>FRED · monthly</div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="section" style={{ marginTop: '2rem' }}>
          <div className="section-label">Sortable Comparison Table</div>
          <div style={{ background: '#ffffff', borderRadius: 8, border: '1px solid #ebebeb', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 13 }}>
              <thead>
                <tr style={{ background: '#f9f9f9', borderBottom: '1px solid #ebebeb' }}>
                  <th style={{ padding: '12px 16px', fontWeight: 600, color: '#666' }}>Country</th>
                  <th onClick={() => handleSort('yield10y')} style={{ padding: '12px 16px', fontWeight: 600, cursor: 'pointer', userSelect: 'none', color: sortConfig.key === 'yield10y' ? COLORS.FR : '#666' }}>
                    10Y Yield {getSortIcon('yield10y')}
                  </th>
                  <th onClick={() => handleSort('riskPremium')} style={{ padding: '12px 16px', fontWeight: 600, cursor: 'pointer', userSelect: 'none', color: sortConfig.key === 'riskPremium' ? COLORS.FR : '#666' }}>
                    Risk Premium (vs Bund) {getSortIcon('riskPremium')}
                  </th>
                  <th onClick={() => handleSort('rating')} style={{ padding: '12px 16px', fontWeight: 600, cursor: 'pointer', userSelect: 'none', color: sortConfig.key === 'rating' ? COLORS.FR : '#666' }}>
                    Rating {getSortIcon('rating')}
                  </th>
                </tr>
              </thead>
              <tbody>
                {sortedCountries.map((country) => (
                  <tr key={country.id} style={{ borderBottom: '1px solid #f5f5f5', opacity: active[country.id] ? 1 : 0.3, transition: 'opacity 0.2s' }}>
                    <td style={{ padding: '12px 16px', fontWeight: 500, display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ width: 6, height: 6, borderRadius: '50%', background: COLORS[country.id] }} />
                      {country.name}
                    </td>
                    <td style={{ padding: '12px 16px', fontWeight: 600 }}>
                      {country.yield10y ? country.yield10y.toFixed(2) + '%' : '—'}
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      {country.riskPremium !== null ? (country.id === 'DE' ? 'Base (0 bps)' : `+${country.riskPremium} bps`) : '—'}
                    </td>
                    <td style={{ padding: '12px 16px', fontWeight: 600, color: country.rating.startsWith('AAA') || country.rating.startsWith('AA') ? '#27ae60' : '#e67e22' }}>
                      {country.rating}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </>
  );
}
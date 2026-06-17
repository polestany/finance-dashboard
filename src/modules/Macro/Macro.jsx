import React from 'react';
import './Macro.css';

const MODELS = [
  {
    id: 'beveridge',
    title: 'Labor Market Engine',
    model: 'Beveridge Curve',
    focus: 'Labor market tightness and matching efficiency',
    xAxis: 'Unemployment rate',
    yAxis: 'Job openings rate',
    metrics: ['Unemployment rate', 'Job openings rate', 'Vacancy-to-unemployed ratio'],
    insight: 'Separates cyclical softening from structural shifts in labor matching.',
    source: 'BLS JOLTS · BLS CPS',
  },
  {
    id: 'phillips',
    title: 'Inflation-Unemployment Nexus',
    model: 'Expectations-Augmented Phillips Curve · NAIRU',
    focus: 'Inflation pressure from labor-market overheating',
    xAxis: 'Unemployment gap',
    yAxis: 'Inflation gap',
    metrics: ['Actual unemployment', 'NAIRU', 'Actual vs expected inflation'],
    insight: 'Distinguishes demand-driven inflation from external supply shocks.',
    source: 'FRED · CBO · BLS',
  },
  {
    id: 'okun',
    title: 'Real Output vs Jobs',
    model: "Okun's Law",
    focus: 'How growth translates into employment conditions',
    xAxis: 'Real GDP / output gap',
    yAxis: 'Change in unemployment',
    metrics: ['Real GDP growth', 'Output gap', 'Unemployment change'],
    insight: 'Highlights anomalies such as labor hoarding during slowdowns.',
    source: 'BEA · CBO · BLS',
  },
  {
    id: 'rstar',
    title: 'Natural Rate of Interest',
    model: 'Wicksellian R-Star',
    focus: 'The true stance of monetary policy',
    xAxis: 'Neutral real rate',
    yAxis: 'Actual real policy rate',
    metrics: ['Fed funds rate', 'Core inflation', 'R-star estimate'],
    insight: 'Shows whether policy is restrictive or still stimulating the economy.',
    source: 'Fed · FRED · NY Fed',
  },
];

function MiniChart({ xAxis, yAxis }) {
  return (
    <div className="macro-chart" aria-label={`${yAxis} versus ${xAxis}`}>
      <div className="macro-chart-grid" />
      <div className="macro-axis macro-axis-y">{yAxis}</div>
      <div className="macro-axis macro-axis-x">{xAxis}</div>
      <div className="macro-chart-empty">
        <span>Awaiting live data</span>
      </div>
    </div>
  );
}

function ModelCard({ model }) {
  return (
    <div className="macro-model-card">
      <div className="macro-model-header">
        <div>
          <div className="macro-model-title">{model.title}</div>
          <div className="macro-model-name">{model.model}</div>
        </div>
        <span className="signal-badge neutral">Planned</span>
      </div>

      <MiniChart xAxis={model.xAxis} yAxis={model.yAxis} />

      <div className="macro-model-body">
        <div>
          <div className="macro-field-label">Focus</div>
          <div className="macro-field-value">{model.focus}</div>
        </div>
        <div>
          <div className="macro-field-label">Key metrics</div>
          <div className="macro-chip-row">
            {model.metrics.map(metric => (
              <span className="macro-chip" key={metric}>{metric}</span>
            ))}
          </div>
        </div>
        <div>
          <div className="macro-field-label">Insight</div>
          <div className="macro-field-value">{model.insight}</div>
        </div>
        <div className="macro-source">{model.source}</div>
      </div>
    </div>
  );
}

export default function Macro() {
  return (
    <div className="module macro-module">
      <div className="module-header">
        <div>
          <h1 className="module-title">Macro Analysis</h1>
        </div>
      </div>
      <p className="module-subtitle">
        Labor market, inflation, output, and policy stance models
      </p>

      <div className="metrics-grid macro-status-grid">
        <div className="metric-card">
          <div className="metric-label">Cycle regime</div>
          <div className="metric-value">—</div>
          <div className="metric-sub">Composite macro state</div>
        </div>
        <div className="metric-card">
          <div className="metric-label">Labor slack</div>
          <div className="metric-value">—</div>
          <div className="metric-sub">Unemployment vs NAIRU</div>
        </div>
        <div className="metric-card">
          <div className="metric-label">Inflation pressure</div>
          <div className="metric-value">—</div>
          <div className="metric-sub">Actual vs expected</div>
        </div>
        <div className="metric-card">
          <div className="metric-label">Policy stance</div>
          <div className="metric-value">—</div>
          <div className="metric-sub">Real rate vs R-star</div>
        </div>
      </div>

      <div className="section">
        <div className="section-label">Core macro models</div>
        <div className="macro-model-grid">
          {MODELS.map(model => (
            <ModelCard key={model.id} model={model} />
          ))}
        </div>
      </div>
    </div>
  );
}

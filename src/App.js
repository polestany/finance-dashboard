import React, { useState } from 'react';
import FixedIncome from './modules/FixedIncome/FixedIncome';
import './App.css';

const NAV_ITEMS = [
  { id: 'fixed-income', label: 'Fixed Income' },
  { id: 'equities', label: 'Equities', badge: 'soon' },
  { id: 'macro', label: 'Macro', badge: 'soon' },
  { id: 'prediction-markets', label: 'Prediction Markets', badge: 'soon' },
];

function Sidebar({ activeView, onSelectView }) {
  return (
    <div className="sidebar">
      <div className="sidebar-logo">
        <span className="logo-mark">pol</span>
        <span className="logo-sub">finance</span>
      </div>
      <nav className="sidebar-nav">
        <div className="nav-section-label">Markets</div>
        <button
          type="button"
          className={`nav-item ${activeView === 'fixed-income' ? 'active' : ''}`}
          onClick={() => onSelectView('fixed-income')}
        >
          Fixed Income
        </button>
        <button
          type="button"
          className={`nav-item ${activeView === 'equities' ? 'active' : ''}`}
          onClick={() => onSelectView('equities')}
        >
          Equities
          <span className="nav-badge">soon</span>
        </button>
        <div className="nav-section-label">Analysis</div>
        <button
          type="button"
          className={`nav-item ${activeView === 'macro' ? 'active' : ''}`}
          onClick={() => onSelectView('macro')}
        >
          Macro
          <span className="nav-badge">soon</span>
        </button>
        <button
          type="button"
          className={`nav-item ${activeView === 'prediction-markets' ? 'active' : ''}`}
          onClick={() => onSelectView('prediction-markets')}
        >
          Prediction Markets
          <span className="nav-badge">soon</span>
        </button>
      </nav>
      <div className="sidebar-footer">
        <span>FRED · World Bank · Kalshi</span>
      </div>
    </div>
  );
}

function App() {
  const [activeView, setActiveView] = useState('fixed-income');

  const renderMainContent = () => {
    if (activeView === 'fixed-income') {
      return <FixedIncome />;
    }

    const item = NAV_ITEMS.find(navItem => navItem.id === activeView);

    return (
      <div className="coming-soon">
        {item?.label} module coming soon
      </div>
    );
  };

  return (
    <div className="app">
      <Sidebar activeView={activeView} onSelectView={setActiveView} />
      <main className="main-content">
        {renderMainContent()}
      </main>
    </div>
  );
}

export default App;
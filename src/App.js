import React from 'react';
import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom';
import FixedIncome from './modules/FixedIncome/FixedIncome';
import './App.css';

function Sidebar() {
  return (
    <div className="sidebar">
      <div className="sidebar-logo">
        <span className="logo-mark">pol</span>
        <span className="logo-sub">finance</span>
      </div>
      <nav className="sidebar-nav">
        <div className="nav-section-label">Markets</div>
        <NavLink to="/" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
          Fixed Income
        </NavLink>
        <NavLink to="/equities" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
          Equities
          <span className="nav-badge">soon</span>
        </NavLink>
        <div className="nav-section-label">Analysis</div>
        <NavLink to="/macro" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
          Macro
          <span className="nav-badge">soon</span>
        </NavLink>
        <NavLink to="/prediction-markets" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
          Prediction Markets
          <span className="nav-badge">soon</span>
        </NavLink>
      </nav>
      <div className="sidebar-footer">
        <span>FRED · World Bank · Kalshi</span>
      </div>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <div className="app">
        <Sidebar />
        <main className="main-content">
          <Routes>
            <Route path="/" element={<FixedIncome />} />
            <Route path="/equities" element={<div className="coming-soon">Equities module coming soon</div>} />
            <Route path="/macro" element={<div className="coming-soon">Macro module coming soon</div>} />
            <Route path="/prediction-markets" element={<div className="coming-soon">Prediction Markets module coming soon</div>} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

export default App;
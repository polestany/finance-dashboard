# Finance Dashboard

React dashboard for fixed-income market monitoring.

## Modules

- Fixed Income: US Treasury curve, ECB AAA curve, European sovereign 10Y benchmarks, and Spain-specific Banco de Espana data.
- Equities, Macro, and Prediction Markets: placeholders for future modules.

## Data Sources

- FRED: US Treasury and OECD sovereign yield series.
- ECB Data Portal: euro area AAA yield curve.
- Banco de Espana: Spain yield curve and Bund spread data.

## Scripts

```bash
npm start
npm test -- --watchAll=false
npm run build
```

The API proxy in `api/data.js` expects `REACT_APP_FRED_KEY` for FRED-backed requests.

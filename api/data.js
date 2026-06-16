export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  const { source, series_id } = req.query;

  try {
    if (source === 'ecb') {
      const url = `https://data-api.ecb.europa.eu/service/data/YC/B.U2.EUR.4F.G_N_A.SV_C_YM.${series_id}?format=jsondata&lastNObservations=1`;
      const response = await fetch(url);
      const data = await response.json();
      const value = data.dataSets?.[0]?.series?.['0:0:0:0:0:0:0']?.observations?.['0']?.[0];
      const date = data.structure?.dimensions?.observation?.[0]?.values?.[0]?.id;
      res.status(200).json({ value, date });
    } else if (source === 'bde') {
      const url = `https://app.bde.es/bierest/resources/srdatosapp/favoritas?idioma=en&series=${series_id}`;
      const response = await fetch(url);
      const data = await response.json();
      res.status(200).json(data);
    } else {
      const key = process.env.REACT_APP_FRED_KEY;
      const url = `https://api.stlouisfed.org/fred/series/observations?series_id=${series_id}&api_key=${key}&sort_order=desc&limit=5&file_type=json`;
      const response = await fetch(url);
      const data = await response.json();
      res.status(200).json(data);
    }
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
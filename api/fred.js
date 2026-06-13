export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  const { source, series_id } = req.query;

  try {
    if (source === 'bde') {
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
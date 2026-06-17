export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  const { source, series_id } = req.query;

  if (!series_id || Array.isArray(series_id)) {
    res.status(400).json({ error: 'series_id is required' });
    return;
  }

  const requestJson = async (url) => {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Upstream request failed with ${response.status}`);
    }
    return response.json();
  };

  try {
    const encodedSeriesId = encodeURIComponent(series_id);

    if (source === 'ecb') {
      const url = `https://data-api.ecb.europa.eu/service/data/YC/B.U2.EUR.4F.G_N_A.SV_C_YM.${encodedSeriesId}?format=jsondata&lastNObservations=1`;
      const data = await requestJson(url);
      const value = data.dataSets?.[0]?.series?.['0:0:0:0:0:0:0']?.observations?.['0']?.[0];
      const date = data.structure?.dimensions?.observation?.[0]?.values?.[0]?.id;
      res.status(200).json({ value, date });
    } else if (source === 'bde') {
      const url = `https://app.bde.es/bierest/resources/srdatosapp/favoritas?idioma=en&series=${encodedSeriesId}`;
      const data = await requestJson(url);
      res.status(200).json(data);
    } else {
      const key = process.env.REACT_APP_FRED_KEY;
      if (!key) {
        throw new Error('REACT_APP_FRED_KEY is not configured');
      }

      const url = `https://api.stlouisfed.org/fred/series/observations?series_id=${encodedSeriesId}&api_key=${encodeURIComponent(key)}&sort_order=desc&limit=5&file_type=json`;
      const data = await requestJson(url);
      res.status(200).json(data);
    }
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}

export default async function handler(req, res) {
  const { series_id } = req.query;
  const key = process.env.REACT_APP_FRED_KEY;
  
  const url = `https://api.stlouisfed.org/fred/series/observations?series_id=${series_id}&api_key=${key}&sort_order=desc&limit=5&file_type=json`;
  
  const response = await fetch(url);
  const data = await response.json();
  
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.status(200).json(data);
}
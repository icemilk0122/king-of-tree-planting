const TAIPEI_LAT = 25.033;
const TAIPEI_LON = 121.5654;
const API_URL = `https://api.open-meteo.com/v1/forecast?latitude=${TAIPEI_LAT}&longitude=${TAIPEI_LON}&current=temperature_2m,weather_code&timezone=Asia%2FTaipei`;

const WMO_MAP = {
  0: { label: '晴天', icon: '☀️', type: 'clear' },
  1: { label: '大致晴', icon: '🌤️', type: 'clear' },
  2: { label: '多雲', icon: '⛅', type: 'cloudy' },
  3: { label: '陰天', icon: '☁️', type: 'overcast' },
  45: { label: '霧', icon: '🌫️', type: 'overcast' },
  48: { label: '霧', icon: '🌫️', type: 'overcast' },
  51: { label: '毛毛雨', icon: '🌦️', type: 'rain' },
  53: { label: '小雨', icon: '🌦️', type: 'rain' },
  55: { label: '雨', icon: '🌧️', type: 'rain' },
  56: { label: '凍雨', icon: '🌧️', type: 'rain' },
  57: { label: '凍雨', icon: '🌧️', type: 'rain' },
  61: { label: '小雨', icon: '🌦️', type: 'rain' },
  63: { label: '中雨', icon: '🌧️', type: 'rain' },
  65: { label: '大雨', icon: '🌧️', type: 'rain' },
  66: { label: '凍雨', icon: '🌧️', type: 'rain' },
  67: { label: '凍雨', icon: '🌧️', type: 'rain' },
  71: { label: '小雪', icon: '🌨️', type: 'rain' },
  73: { label: '雪', icon: '🌨️', type: 'rain' },
  75: { label: '大雪', icon: '🌨️', type: 'rain' },
  77: { label: '雪', icon: '🌨️', type: 'rain' },
  80: { label: '陣雨', icon: '🌦️', type: 'rain' },
  81: { label: '陣雨', icon: '🌧️', type: 'rain' },
  82: { label: '大陣雨', icon: '🌧️', type: 'rain' },
  85: { label: '陣雪', icon: '🌨️', type: 'rain' },
  86: { label: '陣雪', icon: '🌨️', type: 'rain' },
  95: { label: '雷雨', icon: '⛈️', type: 'rain' },
  96: { label: '雷雨', icon: '⛈️', type: 'rain' },
  99: { label: '雷雨', icon: '⛈️', type: 'rain' },
};

export async function fetchWeather() {
  try {
    const res = await fetch(API_URL);
    const data = await res.json();
    const code = data.current.weather_code;
    const temp = Math.round(data.current.temperature_2m);
    const info = WMO_MAP[code] || { label: '未知', icon: '🌡️', type: 'clear' };
    return { temp, ...info };
  } catch {
    return { temp: 25, label: '晴天', icon: '☀️', type: 'clear' };
  }
}

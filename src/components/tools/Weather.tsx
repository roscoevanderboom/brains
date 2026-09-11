export type WeatherProps = {
  location: string;
  weather: string;
  temperature: number;
  unit?: string;
};

export function Weather({ location, weather, temperature, unit = "F" }: WeatherProps) {
  return (
    <div className="inline-flex flex-col gap-1 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-900">
      <p className="text-xs font-semibold uppercase tracking-widest text-gray-400">
        {location}
      </p>
      <div className="flex items-center gap-2">
        <span className="text-4xl">{weatherEmoji(weather)}</span>
        <span className="text-3xl font-semibold text-gray-900 dark:text-white">
          {temperature}°{unit}
        </span>
      </div>
      <p className="text-sm text-gray-500 dark:text-gray-400">{weather}</p>
    </div>
  );
}

function weatherEmoji(condition: string): string {
  const c = condition.toLowerCase();
  if (c.includes("sun") || c.includes("clear")) return "☀️";
  if (c.includes("cloud")) return "☁️";
  if (c.includes("rain")) return "🌧️";
  if (c.includes("snow")) return "❄️";
  if (c.includes("storm") || c.includes("thunder")) return "⛈️";
  if (c.includes("fog") || c.includes("mist")) return "🌫️";
  return "🌡️";
}

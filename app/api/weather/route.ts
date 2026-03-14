import { NextRequest, NextResponse } from "next/server";

export type WeatherType = "sunny" | "partly-cloudy" | "cloudy" | "rainy" | "stormy" | "snowy" | "foggy";

function codeToWeather(code: number): WeatherType {
  if (code === 0)                            return "sunny";
  if (code === 1 || code === 2)              return "partly-cloudy";
  if (code === 3 || code === 45 || code === 48) return "cloudy";
  if (code >= 51 && code <= 67)             return "rainy";
  if (code >= 71 && code <= 77)             return "snowy";
  if (code >= 80 && code <= 82)             return "rainy";
  if (code >= 85 && code <= 86)             return "snowy";
  if (code >= 95 && code <= 99)             return "stormy";
  return "sunny";
}

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const lat = searchParams.get("lat");
  const lon = searchParams.get("lon");

  if (!lat || !lon) {
    return NextResponse.json({ error: "lat and lon required" }, { status: 400 });
  }

  try {
    const res  = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=weather_code,temperature_2m`,
      { next: { revalidate: 600 } } // cache 10 min
    );
    const data = await res.json();
    const code = data?.current?.weather_code ?? 0;
    const temp = data?.current?.temperature_2m ?? null;
    return NextResponse.json({ weather: codeToWeather(code), code, temp });
  } catch {
    return NextResponse.json({ weather: "sunny", code: 0, temp: null });
  }
}

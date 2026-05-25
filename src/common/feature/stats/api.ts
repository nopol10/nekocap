import { HomepageStats } from "./types";

export async function loadHomepageStatsApi(): Promise<HomepageStats | null> {
  const base = process.env.NEXT_PUBLIC_NEKOCAP_API_URL;
  if (!base) return null;
  const response = await fetch(`${base}/api/v1/homepage-stats`);
  if (!response.ok) return null;
  const payload = (await response.json()) as HomepageStats | { ready: false };
  if (!("totalViews" in payload)) return null;
  return payload;
}

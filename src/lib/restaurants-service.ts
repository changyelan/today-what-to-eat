import { normalizeAmapRestaurant, type AmapPoi } from "@/lib/amap";
import { OFFICE_LOCATION } from "@/lib/constants";

const AMAP_KEY = process.env.AMAP_WEB_SERVICE_KEY;

const RESTAURANT_CACHE_TTL_MS = 10 * 60 * 1000;
const SEARCH_RADIUS_METERS = 2000;
const SEARCH_PAGE_SIZE = 50;
const SEARCH_MAX_PAGES = 3;

let cachedResult:
  | {
      expiresAt: number;
      value: { restaurants: ReturnType<typeof normalizeAmapRestaurant>[]; officeLocation: string };
    }
  | null = null;

async function searchNearbyRestaurantsPage(location: string, page: number) {
  const url = new URL("https://restapi.amap.com/v3/place/around");
  url.searchParams.set("key", AMAP_KEY || "");
  url.searchParams.set("location", location);
  url.searchParams.set("radius", String(SEARCH_RADIUS_METERS));
  url.searchParams.set("sortrule", "distance");
  url.searchParams.set("offset", String(SEARCH_PAGE_SIZE));
  url.searchParams.set("page", String(page));
  url.searchParams.set("extensions", "base");
  url.searchParams.set("types", "050000");

  const response = await fetch(url.toString(), {
    next: { revalidate: 600 },
  });
  if (!response.ok) throw new Error("高德周边搜索请求失败");

  const data = await response.json();
  return (data?.pois || []) as AmapPoi[];
}

async function searchNearbyRestaurants(location: string) {
  const pages = await Promise.all(
    Array.from({ length: SEARCH_MAX_PAGES }, (_, index) => searchNearbyRestaurantsPage(location, index + 1)),
  );

  const merged = pages.flat();
  const deduped = new Map<string, AmapPoi>();

  for (const poi of merged) {
    const key = poi.id || `${poi.name || "unknown"}-${poi.location || poi.address || "unknown"}`;
    if (!deduped.has(key)) {
      deduped.set(key, poi);
    }
  }

  return Array.from(deduped.values());
}

export async function getNearbyRestaurants() {
  if (!AMAP_KEY) {
    throw new Error("缺少 AMAP_WEB_SERVICE_KEY 环境变量");
  }

  if (cachedResult && cachedResult.expiresAt > Date.now()) {
    return cachedResult.value;
  }

  const location = OFFICE_LOCATION;
  const pois = await searchNearbyRestaurants(location);
  const restaurants = pois.map(normalizeAmapRestaurant).filter((item) => item.name && item.address);

  const result = { restaurants, officeLocation: location };
  cachedResult = {
    expiresAt: Date.now() + RESTAURANT_CACHE_TTL_MS,
    value: result,
  };

  return result;
}

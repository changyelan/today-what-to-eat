import { normalizeAmapRestaurant, type AmapPoi } from "@/lib/amap";
import { OFFICE_LOCATION } from "@/lib/constants";

const AMAP_KEY = process.env.AMAP_WEB_SERVICE_KEY;

const RESTAURANT_CACHE_TTL_MS = 10 * 60 * 1000;

let cachedResult:
  | {
      expiresAt: number;
      value: { restaurants: ReturnType<typeof normalizeAmapRestaurant>[]; officeLocation: string };
    }
  | null = null;

async function searchNearbyRestaurants(location: string) {
  const url = new URL("https://restapi.amap.com/v3/place/around");
  url.searchParams.set("key", AMAP_KEY || "");
  url.searchParams.set("location", location);
  url.searchParams.set("radius", "1000");
  url.searchParams.set("sortrule", "distance");
  url.searchParams.set("offset", "100");
  url.searchParams.set("page", "1");
  url.searchParams.set("extensions", "base");
  url.searchParams.set("types", "050000");

  const response = await fetch(url.toString(), {
    next: { revalidate: 600 },
  });
  if (!response.ok) throw new Error("高德周边搜索请求失败");

  const data = await response.json();
  return (data?.pois || []) as AmapPoi[];
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

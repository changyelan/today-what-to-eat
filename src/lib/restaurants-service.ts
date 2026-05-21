import { normalizeAmapRestaurant, type AmapPoi } from "@/lib/amap";
import { OFFICE_ADDRESS } from "@/lib/constants";

const AMAP_KEY = process.env.AMAP_WEB_SERVICE_KEY;

async function geocodeAddress(address: string) {
  const url = new URL("https://restapi.amap.com/v3/geocode/geo");
  url.searchParams.set("key", AMAP_KEY || "");
  url.searchParams.set("address", address);

  const response = await fetch(url.toString(), { cache: "no-store" });
  if (!response.ok) throw new Error("高德地理编码请求失败");

  const data = await response.json();
  const first = data?.geocodes?.[0];
  if (!first?.location) throw new Error("未能解析公司地址坐标");

  return first.location as string;
}

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

  const response = await fetch(url.toString(), { cache: "no-store" });
  if (!response.ok) throw new Error("高德周边搜索请求失败");

  const data = await response.json();
  return (data?.pois || []) as AmapPoi[];
}

export async function getNearbyRestaurants() {
  if (!AMAP_KEY) {
    throw new Error("缺少 AMAP_WEB_SERVICE_KEY 环境变量");
  }

  const location = await geocodeAddress(OFFICE_ADDRESS);
  const pois = await searchNearbyRestaurants(location);
  const restaurants = pois.map(normalizeAmapRestaurant).filter((item) => item.name && item.address);

  return { restaurants, officeLocation: location };
}

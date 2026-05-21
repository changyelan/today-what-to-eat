import type { Restaurant } from "@/types/restaurant";

export type AmapPoi = {
  id?: string;
  name?: string;
  address?: string;
  location?: string;
  distance?: string;
  type?: string;
  business_status?: string;
  status?: string;
};

export function normalizeAmapRestaurant(poi: AmapPoi): Restaurant {
  const [lng, lat] = (poi.location || "").split(",").map((value) => Number(value));

  return {
    id: poi.id || `amap-${poi.name}-${poi.location}`,
    name: poi.name || "未命名餐馆",
    source: "amap",
    amapPoiId: poi.id,
    address: poi.address || "",
    lng: Number.isFinite(lng) ? lng : undefined,
    lat: Number.isFinite(lat) ? lat : undefined,
    distanceMeters: poi.distance ? Number(poi.distance) : undefined,
    tags: inferTags(poi),
    isClosed: isClosedPoi(poi),
  };
}

function isClosedPoi(poi: AmapPoi) {
  const text = `${poi.name || ""} ${poi.address || ""} ${poi.type || ""} ${poi.business_status || ""} ${poi.status || ""}`;

  if (/正常营业|营业中|open/i.test(text)) {
    return false;
  }

  return /停业|歇业|暂停营业|暂停开放|已关门|已停业|休业|closed|suspended/i.test(text);
}

function inferTags(poi: AmapPoi): string[] {
  const text = `${poi.name || ""} ${poi.type || ""}`;
  const tags = new Set<string>();

  if (/奶茶|茶饮|饮品|果汁|甜品|咖啡/.test(text)) {
    if (/咖啡/.test(text)) {
      tags.add("咖啡");
    } else {
      tags.add("奶茶");
    }
    tags.add("饮品");
  }

  if (/麦当劳|肯德基|汉堡|沙县|小吃|快餐|简餐|面馆|拉面|盖浇饭|黄焖鸡|炸鸡/.test(text)) {
    if (/汉堡|麦当劳|肯德基/.test(text)) tags.add("汉堡");
    if (/面馆|拉面|面/.test(text)) tags.add("面");
    if (/盖浇饭|黄焖鸡|饭|快餐/.test(text)) tags.add("饭");
    tags.add(/小吃|沙县/.test(text) ? "小吃" : "快餐");
  }

  if (/火锅|烧烤|烤肉|餐厅|私房菜|中餐|西餐|日料|韩餐|料理|海鲜|牛排|披萨|本帮菜|川菜|粤菜/.test(text)) {
    tags.add("餐厅");
    if (/中餐|本帮菜|川菜|粤菜/.test(text)) tags.add("中餐");
    if (/西餐|牛排|披萨/.test(text)) tags.add("西餐");
    if (/日料|韩餐|料理/.test(text)) tags.add("日韩");
  }

  return Array.from(tags);
}

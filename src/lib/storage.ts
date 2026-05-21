import type { Filters, Restaurant } from "@/types/restaurant";

const FILTERS_KEY = "today-what-to-eat:filters";
const META_KEY = "today-what-to-eat:restaurant-meta";
const MANUAL_RESTAURANTS_KEY = "today-what-to-eat:manual-restaurants";

export type RestaurantMetaItem = {
  isFavorite?: boolean;
  isFrequent?: boolean;
  skippedOn?: string;
};

export type RestaurantMeta = Record<string, RestaurantMetaItem>;

function isBrowser() {
  return typeof window !== "undefined";
}

function getTodayKey() {
  return new Date().toISOString().slice(0, 10);
}

function normalizeMeta(meta: RestaurantMeta): RestaurantMeta {
  const today = getTodayKey();

  return Object.fromEntries(
    Object.entries(meta).map(([id, item]) => {
      const skippedOn = item.skippedOn === today ? item.skippedOn : undefined;
      return [id, { ...item, skippedOn }];
    }),
  );
}

export function isSkippedToday(item?: RestaurantMetaItem) {
  return item?.skippedOn === getTodayKey();
}

export function getStoredFilters(fallback: Filters): Filters {
  if (!isBrowser()) return fallback;

  try {
    const raw = window.localStorage.getItem(FILTERS_KEY);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw) as Partial<Filters>;

    return {
      categories: Array.isArray(parsed.categories) ? parsed.categories : fallback.categories,
    };
  } catch {
    return fallback;
  }
}

export function setStoredFilters(filters: Filters) {
  if (!isBrowser()) return;
  window.localStorage.setItem(FILTERS_KEY, JSON.stringify(filters));
}

export function getRestaurantMeta(): RestaurantMeta {
  if (!isBrowser()) return {};

  try {
    const raw = window.localStorage.getItem(META_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as RestaurantMeta;
    return normalizeMeta(parsed);
  } catch {
    return {};
  }
}

export function setRestaurantMeta(meta: RestaurantMeta) {
  if (!isBrowser()) return;
  window.localStorage.setItem(META_KEY, JSON.stringify(normalizeMeta(meta)));
}

export function getManualRestaurants(): Restaurant[] {
  if (!isBrowser()) return [];

  try {
    const raw = window.localStorage.getItem(MANUAL_RESTAURANTS_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as Restaurant[];
  } catch {
    return [];
  }
}

export function setManualRestaurants(restaurants: Restaurant[]) {
  if (!isBrowser()) return;
  window.localStorage.setItem(MANUAL_RESTAURANTS_KEY, JSON.stringify(restaurants));
}

export function appendManualRestaurant(restaurant: Restaurant) {
  const current = getManualRestaurants();
  setManualRestaurants([restaurant, ...current]);
}

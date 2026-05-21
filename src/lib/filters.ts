import type { Filters, Restaurant, RestaurantCategory } from "@/types/restaurant";

const CATEGORY_TAG_MAP: Record<RestaurantCategory, string[]> = {
  drink: ["奶茶", "咖啡", "饮品", "甜品"],
  fast: ["快餐", "小吃", "简餐", "汉堡", "面", "饭", "出餐快"],
};

function matchesCategory(restaurant: Restaurant, category: RestaurantCategory) {
  const categoryTags = CATEGORY_TAG_MAP[category];
  return restaurant.tags.some((tag) => categoryTags.includes(tag));
}

export function matchesFilters(restaurant: Restaurant, filters: Filters) {
  const matchesSelectedCategory =
    filters.categories.length === 0 || filters.categories.some((category) => matchesCategory(restaurant, category));
  const notSkipped = !restaurant.skipToday;
  const notClosed = !restaurant.isClosed;

  return matchesSelectedCategory && notSkipped && notClosed;
}

export function filterRestaurants(restaurants: Restaurant[], filters: Filters) {
  return restaurants.filter((restaurant) => matchesFilters(restaurant, filters));
}

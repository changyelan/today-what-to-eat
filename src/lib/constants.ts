import type { Filters, RestaurantCategory } from "@/types/restaurant";

export const OFFICE_NAME = "叠纸信息科技";
export const OFFICE_ADDRESS = "上海市杨浦区政高路 38 号";

export const CATEGORY_OPTIONS: Array<{ label: string; value: RestaurantCategory }> = [
  { label: "奶茶咖啡", value: "drink" },
  { label: "快餐小吃", value: "fast" },
];

export const DEFAULT_FILTERS: Filters = {
  categories: [],
};

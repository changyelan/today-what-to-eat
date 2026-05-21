export type Restaurant = {
  id: string;
  name: string;
  source: "amap" | "manual";
  amapPoiId?: string;
  address: string;
  lat?: number;
  lng?: number;
  distanceMeters?: number;
  tags: string[];
  isFavorite?: boolean;
  isFrequent?: boolean;
  isClosed?: boolean;
  skipToday?: boolean;
  notes?: string;
};

export type RestaurantCategory = "drink" | "fast";

export type Filters = {
  categories: RestaurantCategory[];
};

import { getNearbyRestaurants } from "@/lib/restaurants-service";
import type { Restaurant } from "@/types/restaurant";
import HomeClient from "./page.client";

function getInitialRecommendedId(restaurants: Restaurant[]) {
  if (restaurants.length === 0) return null;

  const favorite = restaurants.find((item) => item.isFavorite);
  if (favorite) return favorite.id;

  const frequent = restaurants.find((item) => item.isFrequent);
  if (frequent) return frequent.id;

  return restaurants[0]?.id ?? null;
}

export default async function HomePage() {
  let initialRestaurants: Restaurant[] = [];
  let initialError: string | null = null;

  try {
    const result = await getNearbyRestaurants();
    initialRestaurants = result.restaurants;
  } catch (error) {
    initialError = error instanceof Error ? error.message : "附近餐馆加载失败";
  }

  const initialRecommendedId = getInitialRecommendedId(initialRestaurants);

  return (
    <HomeClient
      initialRestaurants={initialRestaurants}
      initialError={initialError}
      initialRecommendedId={initialRecommendedId}
    />
  );
}

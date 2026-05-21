import { getNearbyRestaurants } from "@/lib/restaurants-service";

export async function GET() {
  try {
    const result = await getNearbyRestaurants();
    return Response.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "未知错误";
    return Response.json({ error: message }, { status: 500 });
  }
}

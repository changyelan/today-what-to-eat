"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { FilterBar } from "@/components/FilterBar";
import { DEFAULT_FILTERS, OFFICE_NAME } from "@/lib/constants";
import { filterRestaurants } from "@/lib/filters";
import {
  getManualRestaurants,
  getRestaurantMeta,
  getStoredFilters,
  isSkippedToday,
  setRestaurantMeta,
  setStoredFilters,
  type RestaurantMeta,
} from "@/lib/storage";
import type { Filters, Restaurant } from "@/types/restaurant";

function mergeRestaurantMeta(restaurants: Restaurant[], meta: RestaurantMeta): Restaurant[] {
  return restaurants.map((restaurant) => ({
    ...restaurant,
    isFavorite: meta[restaurant.id]?.isFavorite ?? restaurant.isFavorite,
    isFrequent: meta[restaurant.id]?.isFrequent ?? restaurant.isFrequent,
    skipToday: isSkippedToday(meta[restaurant.id]),
  }));
}

function pickWeightedRestaurant(restaurants: Restaurant[], excludeId?: string) {
  const candidates = restaurants.filter((restaurant) => restaurant.id !== excludeId);
  const pool = candidates.length > 0 ? candidates : restaurants;

  if (pool.length === 0) return undefined;

  const weighted = pool.flatMap((restaurant) => {
    const weight = restaurant.isFavorite ? 3 : restaurant.isFrequent ? 2 : 1;
    return Array.from({ length: weight }, () => restaurant);
  });

  return weighted[Math.floor(Math.random() * weighted.length)];
}

function getDistanceText(distance?: number) {
  if (distance === undefined) return null;
  if (distance < 1000) return `${distance}m`;
  return `${(distance / 1000).toFixed(1)}km`;
}

function getTimePeriod() {
  const hour = new Date().getHours();

  if (hour < 11) return { greeting: "早上好 ☀️", meal: "早餐" };
  if (hour < 14) return { greeting: "中午好 🌈", meal: "午餐" };
  if (hour < 18) return { greeting: "下午好 🌤️", meal: "下午茶" };
  return { greeting: "晚上好 🌙", meal: "晚餐" };
}

function getFoodEmoji(restaurant?: Restaurant) {
  if (!restaurant) return "🍽️";
  if (restaurant.tags.includes("奶茶")) return "🧋";
  if (restaurant.tags.includes("咖啡")) return "☕";
  if (restaurant.tags.includes("汉堡")) return "🍔";
  if (restaurant.tags.includes("面")) return "🍜";
  if (restaurant.tags.includes("饭")) return "🍛";
  if (restaurant.tags.includes("小吃")) return "🍢";
  if (restaurant.tags.includes("餐厅") || restaurant.tags.includes("料理")) return "🍲";
  return "🍽️";
}

function getRecommendationCopy(restaurant: Restaurant) {
  const reasons: string[] = [];
  const distanceText = getDistanceText(restaurant.distanceMeters);

  if (restaurant.isFavorite) reasons.push("你收藏过，命中率会更高");
  if (restaurant.isFrequent) reasons.push("你平时常吃，今天继续选它也稳妥");

  if (distanceText) {
    if ((restaurant.distanceMeters ?? Infinity) <= 300) {
      reasons.push(`离你很近，${distanceText} 左右就能到`);
    } else if ((restaurant.distanceMeters ?? Infinity) <= 800) {
      reasons.push(`距离不算远，约 ${distanceText}`);
    } else {
      reasons.push(`稍微走两步也能吃到，约 ${distanceText}`);
    }
  }

  if (restaurant.tags.includes("快餐") || restaurant.tags.includes("小吃") || restaurant.tags.includes("汉堡")) {
    reasons.push("偏快餐向，适合不想犹豫太久的时候");
  }
  if (restaurant.tags.includes("奶茶") || restaurant.tags.includes("咖啡") || restaurant.tags.includes("饮品")) {
    reasons.push("轻松一点，适合想喝点东西缓一缓的时候");
  }
  if (restaurant.tags.includes("餐厅") || restaurant.tags.includes("中餐") || restaurant.tags.includes("西餐") || restaurant.tags.includes("日韩") || restaurant.tags.includes("料理")) {
    reasons.push("更像一顿正经饭，适合认真吃一餐");
  }
  if (restaurant.source === "manual") {
    reasons.push("这是你自己存下来的店，说明原本就有好感");
  }

  const uniqueReasons = Array.from(new Set(reasons)).slice(0, 2);
  if (uniqueReasons.length === 0) return "今天试试这家，换个口味，也顺手把选择困难省掉。";
  return `今天试试这家，${uniqueReasons.join("；")}。`;
}

type HomeClientProps = {
  initialRestaurants: Restaurant[];
  initialError: string | null;
  initialRecommendedId: string | null;
};

export default function HomeClient({ initialRestaurants, initialError, initialRecommendedId }: HomeClientProps) {
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);
  const [meta, setMeta] = useState<RestaurantMeta>({});
  const [recommendedId, setRecommendedId] = useState<string | null>(initialRecommendedId);
  const [hint, setHint] = useState<string | null>(null);
  const hintTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const [manualRestaurants, setManualRestaurants] = useState<Restaurant[]>([]);
  const [amapRestaurants] = useState<Restaurant[]>(initialRestaurants);
  const [error] = useState<string | null>(initialError);
  const [timePeriod, setTimePeriod] = useState({ greeting: "今天好 ✨", meal: "这一餐" });

  const { greeting, meal } = timePeriod;

  const showHint = (message: string) => {
    setHint(message);
    if (hintTimerRef.current) clearTimeout(hintTimerRef.current);
    hintTimerRef.current = setTimeout(() => setHint(null), 1800);
  };

  useEffect(() => {
    setFilters(getStoredFilters(DEFAULT_FILTERS));
    setMeta(getRestaurantMeta());
    setManualRestaurants(getManualRestaurants());
    setHydrated(true);
    setTimePeriod(getTimePeriod());
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    setStoredFilters(filters);
  }, [filters, hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    setRestaurantMeta(meta);
  }, [meta, hydrated]);

  useEffect(() => {
    return () => {
      if (hintTimerRef.current) clearTimeout(hintTimerRef.current);
    };
  }, []);

  const allRestaurants = useMemo(() => [...manualRestaurants, ...amapRestaurants], [manualRestaurants, amapRestaurants]);
  const mergedRestaurants = useMemo(() => mergeRestaurantMeta(allRestaurants, meta), [allRestaurants, meta]);
  const visibleRestaurants = useMemo(() => filterRestaurants(mergedRestaurants, filters), [mergedRestaurants, filters]);

  useEffect(() => {
    if (visibleRestaurants.length === 0) {
      setRecommendedId(null);
      return;
    }
    const currentStillVisible = visibleRestaurants.some((restaurant) => restaurant.id === recommendedId);
    if (currentStillVisible) return;
    const next = pickWeightedRestaurant(visibleRestaurants);
    setRecommendedId(next?.id ?? null);
  }, [visibleRestaurants, recommendedId]);

  const recommended = visibleRestaurants.find((restaurant) => restaurant.id === recommendedId);
  const foodEmoji = getFoodEmoji(recommended);

  const handleReroll = () => {
    if (visibleRestaurants.length <= 1) return;
    const next = pickWeightedRestaurant(visibleRestaurants, recommendedId ?? undefined);
    setRecommendedId(next?.id ?? null);
  };

  const handleToggleFavorite = () => {
    if (!recommended) return;
    const nextFavorite = !meta[recommended.id]?.isFavorite;
    setMeta((prev) => ({ ...prev, [recommended.id]: { ...prev[recommended.id], isFavorite: nextFavorite } }));
    showHint(nextFavorite ? "已加入收藏 ⭐" : "已取消收藏");
  };

  const handleDislike = () => {
    if (!recommended) return;
    setMeta((prev) => ({ ...prev, [recommended.id]: { ...prev[recommended.id], skippedOn: new Date().toISOString().slice(0, 10) } }));
    const next = pickWeightedRestaurant(visibleRestaurants.filter((restaurant) => restaurant.id !== recommended.id), recommended.id);
    setRecommendedId(next?.id ?? null);
    showHint("好，这家今天先跳过");
  };

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#ff702f_0%,#ff8a4c_16%,#fff0e8_46%,#fffaf7_100%)] px-4 py-6 text-slate-900 md:px-8 md:py-10">
      <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-6">
        <header className="flex flex-col gap-4 rounded-[2rem] bg-white/12 px-5 py-5 text-white shadow-[0_20px_60px_rgba(255,112,47,0.16)] ring-1 ring-white/20 backdrop-blur-sm md:flex-row md:items-center md:justify-between md:px-8">
          <div>
            <p className="text-2xl font-bold tracking-tight md:text-3xl">今天吃什么</p>
            <p className="mt-2 text-sm text-white/85">{OFFICE_NAME} 附近 · 帮你更快做出今天这一餐的决定</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link href="/restaurants" className="rounded-full bg-white/18 px-4 py-2.5 text-sm font-medium text-white shadow-sm ring-1 ring-white/20 transition hover:bg-white/24">查看全部餐厅</Link>
          </div>
        </header>

        <section className="rounded-[2rem] bg-white/96 p-6 shadow-[0_24px_70px_rgba(255,112,47,0.18)] ring-1 ring-white/70 backdrop-blur md:p-8">
          <div className="flex flex-col gap-8">
            <div>
              <p className="text-sm font-semibold text-orange-500">{greeting}</p>
              <h1 className="mt-3 text-4xl font-black tracking-tight text-slate-900 md:text-6xl">今天吃什么？</h1>

              <div className="mt-8 rounded-[1.5rem] bg-transparent p-0 md:p-0">
                <FilterBar filters={filters} onChange={setFilters} />
              </div>
            </div>

            <div>
              {error ? (
                <div className="flex min-h-[420px] flex-col items-center justify-center rounded-[1.75rem] bg-[#fff8f5] px-6 py-12 text-center ring-1 ring-orange-100">
                  <div className="text-5xl">🥲</div>
                  <p className="mt-4 text-2xl font-bold text-slate-900">附近餐馆加载失败</p>
                  <p className="mt-3 max-w-md text-sm leading-6 text-slate-500">{error}</p>
                </div>
              ) : recommended ? (
                <div className="rounded-[1.75rem] bg-[linear-gradient(180deg,#fffdfc_0%,#fff7f2_100%)] p-6 ring-1 ring-orange-100 md:p-7">
                <div className="flex flex-col gap-6">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-sm font-semibold text-orange-500">现在推荐</p>
                      <h2 className="mt-2 text-3xl font-black leading-tight tracking-tight text-slate-900 md:text-4xl">{recommended.name}</h2>
                    </div>
                    {recommended.isFavorite ? <span className="shrink-0 rounded-full bg-amber-50 px-3 py-1.5 text-xs font-medium text-amber-700 ring-1 ring-amber-200">⭐ 已收藏</span> : null}
                  </div>

                  <div className="flex flex-col gap-5 rounded-[1.5rem] bg-white p-5 shadow-sm ring-1 ring-orange-100 md:flex-row md:items-center md:justify-between">
                    <div className="flex items-center gap-4">
                      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[#fff7f2] text-4xl shadow-[0_14px_30px_rgba(255,112,47,0.14)] ring-1 ring-orange-100">{foodEmoji}</div>
                      <div>
                        <p className="text-sm text-slate-500">{getDistanceText(recommended.distanceMeters) ?? "未提供距离"} · {recommended.source === "manual" ? "手动添加" : "附近搜索"}</p>
                        <div className="mt-3 flex flex-wrap gap-2">
                          {recommended.tags.slice(0, 4).map((tag) => <span key={tag} className="rounded-full bg-[#fff7f2] px-3 py-1 text-xs font-medium text-slate-600 ring-1 ring-orange-100">{tag}</span>)}
                        </div>
                      </div>
                    </div>

                    <div className="rounded-full bg-orange-50 px-4 py-2 text-sm font-medium text-orange-500 ring-1 ring-orange-100">推荐时段：{meal}</div>
                  </div>

                  <div className="rounded-[1.5rem] bg-white px-5 py-4 shadow-sm ring-1 ring-orange-100">
                    <p className="text-sm leading-7 text-slate-600">{getRecommendationCopy(recommended)}</p>
                  </div>

                  <div className="grid gap-3 md:grid-cols-[minmax(220px,1fr)_auto_auto]">
                    <button onClick={handleReroll} disabled={visibleRestaurants.length <= 1} className="inline-flex min-h-14 items-center justify-center rounded-full bg-[linear-gradient(180deg,#ff973f_0%,#ff7a2f_100%)] px-6 text-lg font-semibold text-white shadow-[0_16px_34px_rgba(255,122,47,0.32)] transition hover:translate-y-[-1px] disabled:cursor-not-allowed disabled:opacity-60">换一个</button>
                    <button onClick={handleToggleFavorite} className="inline-flex min-h-14 items-center justify-center rounded-full bg-white px-5 text-sm font-medium text-slate-700 ring-1 ring-orange-100 transition hover:bg-orange-50">{recommended.isFavorite ? "已收藏" : "收藏"}</button>
                    <button onClick={handleDislike} className="inline-flex min-h-14 items-center justify-center rounded-full bg-white px-5 text-sm font-medium text-slate-700 ring-1 ring-orange-100 transition hover:bg-orange-50">今天先不吃这个</button>
                  </div>

                  <p className="text-xs text-slate-400">轻松决策，每天少一点选择困难。</p>
                </div>
                </div>
              ) : (
                <div className="flex min-h-[420px] flex-col items-center justify-center rounded-[1.75rem] bg-[#fff8f5] px-6 py-12 text-center ring-1 ring-orange-100">
                  <div className="text-5xl">🤔</div>
                  <p className="mt-4 text-2xl font-bold text-slate-900">暂时没找到合适的餐馆</p>
                  <p className="mt-3 max-w-md text-sm leading-6 text-slate-500">试试切换筛选类型，或者直接再换一个推荐看看。</p>
                </div>
              )}
            </div>
          </div>
        </section>

        {hint ? <div className="fixed bottom-6 right-6 z-50 w-fit rounded-full bg-slate-900 px-4 py-2 text-sm text-white shadow-lg">{hint}</div> : null}
      </div>
    </main>
  );
}

"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { FilterBar } from "@/components/FilterBar";
import { DEFAULT_FILTERS } from "@/lib/constants";
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

function getTodayKey() {
  return new Date().toISOString().slice(0, 10);
}

function getDistanceText(distance?: number) {
  if (distance === undefined) return "未提供";
  if (distance < 1000) return `${distance}m`;
  return `${(distance / 1000).toFixed(1)}km`;
}

export default function RestaurantsPage() {
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);
  const [meta, setMeta] = useState<RestaurantMeta>({});
  const [manualRestaurants, setManualRestaurants] = useState<Restaurant[]>([]);
  const [amapRestaurants, setAmapRestaurants] = useState<Restaurant[]>([]);
  const [hint, setHint] = useState<string | null>(null);
  const hintTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const showHint = (message: string) => {
    setHint(message);
    if (hintTimerRef.current) {
      clearTimeout(hintTimerRef.current);
    }
    hintTimerRef.current = setTimeout(() => setHint(null), 1800);
  };

  useEffect(() => {
    setFilters(getStoredFilters(DEFAULT_FILTERS));
    setMeta(getRestaurantMeta());
    setManualRestaurants(getManualRestaurants());
    setHydrated(true);
  }, []);

  useEffect(() => {
    async function loadRestaurants() {
      try {
        setLoading(true);
        setError(null);
        const response = await fetch("/api/restaurants", { cache: "no-store" });
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data?.error || "附近餐馆加载失败");
        }

        setAmapRestaurants(data.restaurants || []);
      } catch (err) {
        const message = err instanceof Error ? err.message : "附近餐馆加载失败";
        setError(message);
      } finally {
        setLoading(false);
      }
    }

    loadRestaurants();
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
      if (hintTimerRef.current) {
        clearTimeout(hintTimerRef.current);
      }
    };
  }, []);

  const allRestaurants = useMemo(() => [...manualRestaurants, ...amapRestaurants], [manualRestaurants, amapRestaurants]);
  const mergedRestaurants = useMemo(() => mergeRestaurantMeta(allRestaurants, meta), [allRestaurants, meta]);
  const visibleRestaurants = useMemo(() => filterRestaurants(mergedRestaurants, filters), [mergedRestaurants, filters]);

  const toggleField = (id: string, field: "isFavorite" | "isFrequent") => {
    const nextValue = !meta[id]?.[field];
    setMeta((prev) => ({
      ...prev,
      [id]: {
        ...prev[id],
        [field]: nextValue,
      },
    }));

    if (field === "isFavorite") {
      showHint(nextValue ? "已加入收藏 ⭐" : "已取消收藏");
    }
  };

  const toggleSkipToday = (id: string) => {
    const willSkip = !isSkippedToday(meta[id]);
    setMeta((prev) => ({
      ...prev,
      [id]: {
        ...prev[id],
        skippedOn: willSkip ? getTodayKey() : undefined,
      },
    }));
    showHint(willSkip ? "好，这家今天先跳过" : "已恢复到候选里");
  };

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 text-slate-900">
      <div className="mx-auto max-w-4xl space-y-6">
        <div className="space-y-2">
          <Link href="/" className="text-sm text-slate-500 hover:text-slate-800">
            ← 返回首页
          </Link>
          <div className="flex items-center justify-between gap-3">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">附近餐馆</h1>
              <p className="text-sm text-slate-600">叠纸信息科技附近</p>
            </div>
            {hint ? <p className="text-sm text-slate-500">{hint}</p> : null}
          </div>
        </div>

        <FilterBar filters={filters} onChange={setFilters} />

        <section className="grid gap-4">
          {loading ? (
            <article className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
              <h2 className="text-xl font-semibold">正在加载附近餐馆...</h2>
              <p className="pt-2 text-sm text-slate-600">稍等一下，我正在帮你找公司附近可以吃的店。</p>
            </article>
          ) : error ? (
            <article className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
              <h2 className="text-xl font-semibold">附近餐馆加载失败</h2>
              <p className="pt-2 text-sm text-slate-600">{error}</p>
            </article>
          ) : visibleRestaurants.length > 0 ? (
            visibleRestaurants.map((restaurant) => (
              <article key={restaurant.id} className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="text-xl font-semibold">{restaurant.name}</h2>
                        {restaurant.isFavorite ? (
                          <span className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700 ring-1 ring-amber-200">
                            ⭐ 已收藏
                          </span>
                        ) : null}
                      </div>
                      <p className="text-sm text-slate-600">{getDistanceText(restaurant.distanceMeters)}</p>
                    </div>
                    <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs text-slate-600">
                      {restaurant.source === "manual" ? "手动添加" : "附近搜索"}
                    </span>
                  </div>
                  <p className="text-sm text-slate-600">{restaurant.address}</p>
                  <div className="flex flex-wrap gap-2 pt-1">
                    {restaurant.tags.map((tag) => (
                      <span key={tag} className="rounded-full bg-slate-100 px-2.5 py-1 text-xs text-slate-700">
                        {tag}
                      </span>
                    ))}
                  </div>
                  <div className="flex flex-wrap gap-2 pt-3">
                    <button
                      onClick={() => toggleField(restaurant.id, "isFavorite")}
                      className={`rounded-xl px-3 py-1.5 text-sm ring-1 transition ${
                        restaurant.isFavorite
                          ? "bg-slate-900 text-white ring-slate-900"
                          : "bg-white ring-slate-200 hover:bg-slate-50"
                      }`}
                    >
                      {restaurant.isFavorite ? "已收藏" : "收藏"}
                    </button>
                    <button
                      onClick={() => toggleField(restaurant.id, "isFrequent")}
                      className={`rounded-xl px-3 py-1.5 text-sm ring-1 transition ${
                        restaurant.isFrequent
                          ? "bg-slate-900 text-white ring-slate-900"
                          : "bg-white ring-slate-200 hover:bg-slate-50"
                      }`}
                    >
                      常吃
                    </button>
                    <button
                      onClick={() => toggleSkipToday(restaurant.id)}
                      className={`rounded-xl px-3 py-1.5 text-sm ring-1 transition ${
                        restaurant.skipToday
                          ? "bg-slate-900 text-white ring-slate-900"
                          : "bg-white ring-slate-200 hover:bg-slate-50"
                      }`}
                    >
                      {restaurant.skipToday ? "今天已跳过" : "今天不想吃"}
                    </button>
                  </div>
                </div>
              </article>
            ))
          ) : (
            <article className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
              <h2 className="text-xl font-semibold">没有找到符合条件的餐馆</h2>
              <p className="pt-2 text-sm text-slate-600">试试调整筛选条件</p>
            </article>
          )}
        </section>
      </div>
    </main>
  );
}

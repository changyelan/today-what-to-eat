"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { appendManualRestaurant } from "@/lib/storage";
import type { Restaurant } from "@/types/restaurant";

const tagOptions = [
  "奶茶",
  "咖啡",
  "饮品",
  "甜品",
  "快餐",
  "小吃",
  "简餐",
  "汉堡",
  "面",
  "饭",
  "餐厅",
  "中餐",
  "西餐",
  "日韩",
  "料理",
];

export default function AddRestaurantPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [notes, setNotes] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [error, setError] = useState("");

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((item) => item !== tag) : [...prev, tag],
    );
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");

    if (!name.trim()) {
      setError("请填写餐馆名称");
      return;
    }

    if (!address.trim()) {
      setError("请填写餐馆地址");
      return;
    }

    const restaurant: Restaurant = {
      id: `manual-${Date.now()}`,
      name: name.trim(),
      source: "manual",
      address: address.trim(),
      distanceMeters: 999,
      tags: selectedTags,
      notes: notes.trim(),
    };

    appendManualRestaurant(restaurant);
    router.push("/restaurants");
  };

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 text-slate-900">
      <div className="mx-auto max-w-2xl space-y-6">
        <div className="space-y-2">
          <Link href="/" className="text-sm text-slate-500 hover:text-slate-800">
            ← 返回首页
          </Link>
          <h1 className="text-3xl font-bold tracking-tight">添加餐馆</h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <div className="space-y-2">
            <label className="text-sm font-medium">店名</label>
            <input
              type="text"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="例如：沙县小吃"
              className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-slate-400"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">地址</label>
            <input
              type="text"
              value={address}
              onChange={(event) => setAddress(event.target.value)}
              placeholder="例如：政高路 38 号附近"
              className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-slate-400"
            />
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium">标签</p>
            <div className="flex flex-wrap gap-2">
              {tagOptions.map((tag) => {
                const active = selectedTags.includes(tag);
                return (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => toggleTag(tag)}
                    className={`rounded-full px-3 py-1.5 text-sm transition ${
                      active ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                    }`}
                  >
                    {tag}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">备注</label>
            <textarea
              rows={4}
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              placeholder="例如：出餐快、经常去吃"
              className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-slate-400"
            />
          </div>

          {error ? <p className="text-sm text-red-600">{error}</p> : null}

          <button className="rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-slate-800">
            保存餐馆
          </button>
        </form>
      </div>
    </main>
  );
}

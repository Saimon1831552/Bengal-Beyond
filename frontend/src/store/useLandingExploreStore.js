"use client";
import { create } from "zustand";
import api from "@/lib/axios";

const RECENT_KEY = "bb_recently_viewed_v1";
const COMPARE_KEY = "bb_compare_tours_v1";

function readStorage(storage, key) {
  if (typeof window === "undefined") return [];
  try {
    const raw = storage.getItem(key);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeStorage(storage, key, val) {
  if (typeof window === "undefined") return;
  try {
    storage.setItem(key, JSON.stringify(val));
  } catch {}
}

export const useLandingExploreStore = create((set, get) => ({
  compareList: [],
  compareOpen: false,
  recentTours: [],
  wishlistIds: [],
  wishlistLoaded: false,
  hydrated: false,

  hydrate: () => {
    if (get().hydrated || typeof window === "undefined") return;
    set({
      recentTours: readStorage(window.localStorage, RECENT_KEY),
      compareList: readStorage(window.sessionStorage, COMPARE_KEY),
      hydrated: true,
    });
  },

  recordRecent: (tour) => {
    if (!tour?.slug || typeof window === "undefined") return;
    const prev = readStorage(window.localStorage, RECENT_KEY).filter((x) => x.slug !== tour.slug);
    const next = [
      {
        id: tour.id,
        slug: tour.slug,
        title: tour.title,
        days: tour.days,
        price: tour.price,
        currency: tour.currency || "BDT",
        destination: tour.destination || "",
        image: tour.image || "",
        href: tour.href || `/tours/${tour.slug}`,
      },
      ...prev,
    ].slice(0, 6);
    writeStorage(window.localStorage, RECENT_KEY, next);
    set({ recentTours: next });
  },

  clearRecent: () => {
    if (typeof window !== "undefined") writeStorage(window.localStorage, RECENT_KEY, []);
    set({ recentTours: [] });
  },

  toggleCompare: (tour) => {
    if (!tour?.slug) return { ok: false };
    const current = get().compareList;
    const exists = current.some((x) => x.slug === tour.slug);
    let next;
    if (exists) {
      next = current.filter((x) => x.slug !== tour.slug);
    } else {
      if (current.length >= 3) return { ok: false, reason: "max" };
      next = [...current, tour];
    }
    if (typeof window !== "undefined") writeStorage(window.sessionStorage, COMPARE_KEY, next);
    set({ compareList: next });
    return { ok: true, added: !exists };
  },

  clearCompare: () => {
    if (typeof window !== "undefined") writeStorage(window.sessionStorage, COMPARE_KEY, []);
    set({ compareList: [], compareOpen: false });
  },

  setCompareOpen: (open) => set({ compareOpen: open }),

  syncWishlist: async () => {
    if (get().wishlistLoaded) return;
    try {
      const res = await api.get("/me/wishlist");
      const items = res.data?.data?.items || res.data?.data || [];
      const ids = Array.isArray(items) ? items.map((x) => Number(x.tour_id || x.id)).filter(Boolean) : [];
      set({ wishlistIds: ids, wishlistLoaded: true });
    } catch {
      set({ wishlistLoaded: true });
    }
  },

  toggleWishlist: async (tourId) => {
    const id = Number(tourId);
    if (!id) return false;
    const has = get().wishlistIds.includes(id);
    if (has) {
      await api.delete(`/me/wishlist/${id}`);
      set({ wishlistIds: get().wishlistIds.filter((x) => x !== id) });
      return false;
    } else {
      await api.post(`/me/wishlist/${id}`);
      set({ wishlistIds: [...get().wishlistIds, id] });
      return true;
    }
  },
}));
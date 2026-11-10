/**
 * Content access layer. Static data for now; swap the bodies for fetches to the
 * Express API later (use `fetch(url, { next: { revalidate: 3600 } })`) without
 * touching any page. Keep every function async.
 */

const UPDATED = "2026-11-10";

const destinations = [
  { slug: "coxs-bazar", name: "Cox's Bazar", region: "Chattogram Division", lat: 21.4272, lng: 92.0058, interests: ["Beach", "Seafood"], summary: "Home to a sea beach of roughly 120 km, among the longest unbroken natural beaches in the world, with fishing boats at sunrise and surf at sunset.", updatedAt: UPDATED },
  { slug: "sundarbans", name: "Sundarbans", region: "Khulna Division", lat: 21.9497, lng: 89.1833, interests: ["Wildlife", "Boat travel"], summary: "The world's largest mangrove forest, a UNESCO World Heritage Site and habitat of the Bengal tiger, explored by boat along tidal creeks.", updatedAt: UPDATED },
  { slug: "sylhet", name: "Sylhet", region: "Sylhet Division", lat: 24.8949, lng: 91.8687, interests: ["Tea gardens", "Waterfalls"], summary: "Tea terraces, river valleys and waterfalls in north-eastern Bangladesh near the Meghalaya border.", updatedAt: UPDATED },
  { slug: "sajek-valley", name: "Sajek Valley", region: "Rangamati District", lat: 23.3823, lng: 92.2929, interests: ["Trekking", "Photography"], summary: "A hill valley in the Chittagong Hill Tracts known for sunrise views above the clouds and hill-community villages.", updatedAt: UPDATED },
  { slug: "bandarban", name: "Bandarban", region: "Chattogram Division", lat: 22.1953, lng: 92.2184, interests: ["Trekking", "Culture"], summary: "Bangladesh's mountain district, with high peaks, river gorges and indigenous hill communities.", updatedAt: UPDATED },
  { slug: "saint-martins-island", name: "Saint Martin's Island", region: "Cox's Bazar District", lat: 20.6276, lng: 92.3226, interests: ["Beach", "Snorkeling"], summary: "Bangladesh's only coral island in the Bay of Bengal, reached by ferry from Teknaf.", updatedAt: UPDATED },
  { slug: "rangamati", name: "Rangamati", region: "Chattogram Division", lat: 22.6372, lng: 92.2, interests: ["Lakes", "Culture"], summary: "A hill town set on Kaptai Lake, known for boat rides, hanging bridges and indigenous crafts.", updatedAt: UPDATED },
  { slug: "srimangal", name: "Srimangal", region: "Moulvibazar District", lat: 24.3065, lng: 91.7296, interests: ["Tea gardens", "Rainforest"], summary: "The tea capital of Bangladesh, surrounded by tea estates and the Lawachara rainforest.", updatedAt: UPDATED },
];

// price: leave undefined until real pricing exists (JSON-LD omits offers without it)
const tours = [
  { slug: "sundarbans-mangrove-cruise", title: "Sundarbans Mangrove Cruise & Tiger Reserve", category: "Nature & Wildlife", days: 4, destinations: ["sundarbans"], summary: "A four-day liveaboard journey through the Sundarbans with guided creek safaris.", updatedAt: UPDATED },
  { slug: "old-dhaka-food-walk", title: "Old Dhaka Heritage & Street Food Walk", category: "Food & Culinary Tours", days: 1, destinations: [], summary: "A guided walk through Old Dhaka's historic lanes, markets and street-food stalls.", updatedAt: UPDATED },
  { slug: "coxs-bazar-beach-retreat", title: "Cox's Bazar Beach Retreat & Island Escape", category: "Beach Holidays", days: 5, destinations: ["coxs-bazar", "saint-martins-island"], summary: "Five days on the Cox's Bazar coast with a ferry trip to Saint Martin's Island.", updatedAt: UPDATED },
  { slug: "tea-country-photography-trail", title: "Tea Country Photography Trail", category: "Photography Tours", days: 3, destinations: ["srimangal", "sylhet"], summary: "Three days photographing the tea estates, rainforest and waterfalls of Srimangal and Sylhet.", updatedAt: UPDATED },
  { slug: "sajek-bandarban-trek", title: "Sajek Sunrise & Bandarban Ridge Trek", category: "Adventure Tours", days: 4, destinations: ["sajek-valley", "bandarban"], summary: "A four-day hill trek combining Sajek's sunrise viewpoints with Bandarban's ridges.", updatedAt: UPDATED },
  { slug: "heritage-trail-ancient-bengal", title: "Heritage Trail of Ancient Bengal", category: "Historical Tours", days: 3, destinations: [], summary: "Three days across Bagerhat, Paharpur and Mahasthangarh, three of Bangladesh's historic sites.", updatedAt: UPDATED },
];

const posts = [
  { slug: "first-timers-guide-to-the-sundarbans", title: "A first-timer's guide to the Sundarbans", excerpt: "When to go, how to choose a boat and how to watch wildlife quietly.", author: "Bengal Beyond Editorial", publishedAt: "2026-11-01", updatedAt: UPDATED, body: "Article body goes here." },
];

export const getDestinations = async () => destinations;
export const getDestination = async (slug) => destinations.find((d) => d.slug === slug) ?? null;
export const getTours = async () => tours;
export const getTour = async (slug) => tours.find((t) => t.slug === slug) ?? null;
export const getPosts = async () => posts;
export const getPost = async (slug) => posts.find((p) => p.slug === slug) ?? null;

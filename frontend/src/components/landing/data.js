const U = (id, w = 1600) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&q=80`;
const PHOTOS = [
  "photo-1507525428034-b723cf961d3e", // Cox's Bazar / Bay of Bengal coast
  "photo-1448375240586-882707db888b", // Sundarbans mangrove forest
  "photo-1544787219-7f47ccb76574",    // Sylhet / Srimangal tea estates
  "photo-1511818966892-d7d671e672a2", // Old Dhaka / heritage architecture
  "photo-1506744038136-46273834b3fb", // Sajek Valley hills & clouds
  "photo-1476514525535-07fb3b4ae5f1", // River cruise & backwaters
  "photo-1501785888041-af3ef285b470", // Mist over hill valleys
  "photo-1528127269322-539801943592", // Ancient terracotta & ruins
];
export const img = (i, w) => U(PHOTOS[i % PHOTOS.length], w);

/* ---------- tours ---------- */
export function toCard(t, i = 0) {
  return {
    id: t.id,
    slug: t.slug,
    title: t.title,
    days: Number(t.days || 1),
    price: t.price,
    currency: t.currency || "BDT",
    destination: t.destination || "",
    category: t.category || "",
    categories: Array.isArray(t.categories) ? t.categories : [],
    tags: Array.isArray(t.tags) ? t.tags : [],
    summary: t.summary || "",
    image: t.image || img(i, 1000),
    href: t.href || `/tours/${t.slug}`,
    highlights: t.highlights || [],
  };
}

export function splitTours(tours) {
  const c = tours.map(toCard);
  return {
    holiday: c.filter((x) => x.days >= 4),
    short: c.filter((x) => x.days >= 2 && x.days <= 3),
    day: c.filter((x) => x.days <= 1),
  };
}

/* ---------- destinations ---------- */
export function trendingDestinations(list) {
  return list.slice(0, 6).map((d, i) => ({
    id: d.id,
    slug: d.slug,
    name: d.name,
    region: d.region,
    tourCount: d.tourCount,
    image: d.image || img(i, 1200),
  }));
}

/* ---------- blog ---------- */
export function blogCards(posts) {
  return posts.slice(0, 3).map((p, i) => ({
    title: p.title,
    excerpt: p.excerpt,
    href: `/blog/${p.slug}`,
    image: p.image || img(i + 2, 900),
    read: p.body ? Math.max(1, Math.round(p.body.split(/\s+/).length / 200)) : null,
  }));
}

/* ---------- interactive real map regions (lat/lng) ---------- */
export const BANGLADESH_CENTER = [23.78, 90.35];

export const BANGLADESH_REGIONS = [
  {
    id: "sundarbans",
    name: "Sundarbans & Khulna",
    shortName: "Sundarbans",
    tagline: "World's largest mangrove forest & Bengal tiger sanctuary",
    lat: 22.02,
    lng: 89.52,
    zoom: 9,
    bestSeason: "October – March",
    travelFromDhaka: "45 min flight to Jashore + 1.5h drive",
    keywords: ["sundarban", "khulna", "bagerhat", "mangrove"],
    highlights: [
      "Private wooden expedition vessels",
      "Karamjal & Kotka wildlife creeks",
      "Sixty Dome Mosque day extension",
    ],
    photoIndex: 1,
  },
  {
    id: "sylhet",
    name: "Sylhet & Srimangal",
    shortName: "Sylhet & Srimangal",
    tagline: "Emerald tea estates, swamp forests & limestone rivers",
    lat: 24.55,
    lng: 91.82,
    zoom: 9,
    bestSeason: "Year-round (lush July–Feb)",
    travelFromDhaka: "45 min flight or 4.5h scenic train",
    keywords: ["sylhet", "srimangal", "ratargul", "jaflong", "tea"],
    highlights: [
      "Lawachara rainforest walks",
      "Seven-layer tea tasting in Srimangal",
      "Ratargul freshwater swamp boat ride",
    ],
    photoIndex: 2,
  },
  {
    id: "sajek",
    name: "Sajek & Hill Tracts",
    shortName: "Sajek Valley",
    tagline: "Cloud-kissed ridges & indigenous hill culture",
    lat: 23.382,
    lng: 92.294,
    zoom: 9,
    bestSeason: "September – April",
    travelFromDhaka: "Overnight coach + 4x4 ridge ascent",
    keywords: ["sajek", "bandarban", "rangamati", "khagrachari", "hill"],
    highlights: [
      "Sunrise above the cloud sea",
      "Kaptai Lake wooden boat cruise",
      "Boga Lake & indigenous homestays",
    ],
    photoIndex: 4,
  },
  {
    id: "coxsbazar",
    name: "Cox's Bazar & St. Martin's",
    shortName: "Cox's Bazar",
    tagline: "120 km unbroken shoreline & coral island reefs",
    lat: 21.427,
    lng: 92.005,
    zoom: 9,
    bestSeason: "November – March",
    travelFromDhaka: "55 min direct flight",
    keywords: ["cox", "martin", "beach", "teknaf", "inani"],
    highlights: [
      "Marine Drive coastal sunset",
      "St. Martin's coral island ferry",
      "Fresh Bay of Bengal seafood",
    ],
    photoIndex: 0,
  },
  {
    id: "dhaka",
    name: "Old Dhaka & Sonargaon",
    shortName: "Old Dhaka",
    tagline: "Mughal forts, river ports & 400 years of living history",
    lat: 23.71,
    lng: 90.407,
    zoom: 11,
    bestSeason: "October – March",
    travelFromDhaka: "0 – 45 min city departure",
    keywords: ["dhaka", "sonargaon", "lalbagh", "ahsan", "old"],
    highlights: [
      "Sadarghat paddle-steamer pier",
      "Panam Nagar lost merchant street",
      "Old Dhaka culinary heritage walk",
    ],
    photoIndex: 3,
  },
  {
    id: "north",
    name: "Paharpur & Rajshahi",
    shortName: "Paharpur & Rajshahi",
    tagline: "8th-century Buddhist monasteries & terracotta temples",
    lat: 24.75,
    lng: 88.95,
    zoom: 8,
    bestSeason: "October – March",
    travelFromDhaka: "45 min flight to Rajshahi / Saidpur",
    keywords: ["paharpur", "rajshahi", "bogura", "mahasthangarh", "dinajpur", "kantajew"],
    highlights: [
      "Somapura Mahavihara UNESCO site",
      "Kantajew terracotta panels",
      "Padma River sunset & silk weavers",
    ],
    photoIndex: 7,
  },
];

/* ---------- static sections ---------- */
export const WHY = [
  { title: "Local Experts", text: "Guides born and raised where you travel, with stories no brochure has.", icon: "M12 12a4 4 0 100-8 4 4 0 000 8zM4 21a8 8 0 0116 0" },
  { title: "Secure Booking", text: "Verified payments and clear confirmation for every booking.", icon: "M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6l8-3zM9 12l2 2 4-4" },
  { title: "Custom Itineraries", text: "Tell us your pace and interests; we shape the route around you.", icon: "M9 4L3 6v14l6-2 6 2 6-2V4l-6 2-6-2zM9 4v14M15 6v14" },
  { title: "24/7 Support", text: "A real person on call before, during and after your trip.", icon: "M4 14v-2a8 8 0 0116 0v2M4 14h3v5H4zM17 14h3v5h-3z" },
];

export const FEATURE_ROWS = [
  {
    eyebrow: "Travel with confidence", title: "Support and planning in one place",
    items: [
      { title: "24/7 Support", text: "Message or call any hour. Our team keeps your trip on track." },
      { title: "Interactive Maps", text: "See every stop, distance and transfer before you commit." },
      { title: "Flexible Changes", text: "Adjust dates and travellers while your booking is still open." },
    ],
  },
  {
    eyebrow: "Built for real trips", title: "Everything arranged, nothing hidden",
    items: [
      { title: "Transparent Pricing", text: "Clear totals with coupons applied before you pay." },
      { title: "Secure Payments", text: "Pay full or 30% deposit via card or mobile banking." },
      { title: "Trip Dashboard", text: "Bookings, live chat and travellers all in one account." },
    ],
  },
];

export const PLACES = [
  { name: "The Sundarbans", where: "Khulna Division", unesco: true, text: "The world's largest mangrove forest, shaped by tides and home to the Bengal tiger." },
  { name: "Somapura Mahavihara", where: "Paharpur, Naogaon", unesco: true, text: "A vast Buddhist monastery complex dating to the 8th century." },
  { name: "Mosque City of Bagerhat", where: "Bagerhat", unesco: true, text: "15th-century mosques and monuments, including the Sixty Dome Mosque." },
  { name: "Lalbagh Fort", where: "Dhaka", text: "An unfinished 17th-century Mughal fort with gardens and a tomb." },
  { name: "Ahsan Manzil", where: "Old Dhaka", text: "The pink riverside palace of the Dhaka Nawab family on the Buriganga." },
  { name: "Kantajew Temple", where: "Dinajpur", text: "An 18th-century Hindu temple covered in detailed terracotta panels." },
  { name: "Mahasthangarh", where: "Bogura", text: "Ruins of the ancient city of Pundranagara, among the oldest in the country." },
  { name: "Sonargaon", where: "Narayanganj", text: "A medieval capital of Bengal with a row of old merchant houses." },
  { name: "Mainamati", where: "Cumilla", text: "Buddhist ruins and monasteries from the 7th to 12th centuries." },
  { name: "Puthia Temple Complex", where: "Rajshahi", text: "A cluster of ornate Hindu temples and a grand palace." },
];
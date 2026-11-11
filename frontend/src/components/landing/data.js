const U = (id, w = 1600) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&q=80`;
const PHOTOS = [
  "photo-1507525428034-b723cf961d3e", // beach
  "photo-1448375240586-882707db888b", // forest
  "photo-1544787219-7f47ccb76574",    // tea
  "photo-1511818966892-d7d671e672a2", // old city
];
export const img = (i, w) => U(PHOTOS[i % PHOTOS.length], w);

/* ---------- tours ---------- */
export function toCard(t, i = 0) {
  return {
    slug: t.slug, title: t.title, days: t.days, price: t.price,
    currency: t.currency || "USD", summary: t.summary || "",
    image: t.image || img(i, 1000), href: t.href || `/tours/${t.slug}`,
    highlights: t.highlights,
  };
}

const FB = (slug, title, days, summary, i) => ({
  slug, title, days, summary, image: img(i, 1000), href: "/tours", currency: "USD",
});
const FALLBACK_TOURS = [
  FB("f1", "Sundarbans Mangrove Cruise", 4, "Liveaboard journey through the world's largest mangrove forest.", 1),
  FB("f2", "Cox's Bazar Beach Retreat", 5, "Five days on a 120 km sea beach with an island escape.", 0),
  FB("f3", "Sajek & Bandarban Trek", 4, "Hill ridges, cloud-level sunrises and hill-community villages.", 2),
  FB("f4", "Tea Country Trail", 3, "Tea estates, rainforest and waterfalls around Srimangal.", 2),
  FB("f5", "Heritage Trail of Ancient Bengal", 3, "Bagerhat, Paharpur and Mahasthangarh in three days.", 3),
  FB("f6", "Sylhet Highlights", 2, "Waterfalls and river valleys near the Meghalaya border.", 2),
  FB("f7", "Old Dhaka Food Walk", 1, "Historic lanes, markets and street-food stalls.", 3),
  FB("f8", "Sonargaon Day Trip", 1, "Medieval capital ruins and river life.", 3),
  FB("f9", "Sundarbans Day Cruise", 1, "A day on the tidal creeks with a local guide.", 1),
  FB("f10", "Lalbagh Fort & Old City", 1, "Mughal-era fort and the lanes around it.", 3),
];

export function splitTours(tours) {
  const cards = tours.map(toCard);
  const pick = (fn) => { const r = cards.filter(fn); return r.length ? r : FALLBACK_TOURS.filter(fn); };
  return {
    holiday: pick((c) => c.days >= 4),
    short: pick((c) => c.days >= 2 && c.days <= 3),
    day: pick((c) => c.days <= 1),
  };
}

/* ---------- destinations ---------- */
const FALLBACK_DESTS = [
  { slug: "coxs-bazar", name: "Cox's Bazar", region: "Chattogram Division" },
  { slug: "sundarbans", name: "Sundarbans", region: "Khulna Division" },
  { slug: "sylhet", name: "Sylhet", region: "Sylhet Division" },
  { slug: "sajek-valley", name: "Sajek Valley", region: "Rangamati District" },
  { slug: "bandarban", name: "Bandarban", region: "Chattogram Division" },
  { slug: "saint-martins-island", name: "Saint Martin's Island", region: "Cox's Bazar District" },
];
export function trendingDestinations(list) {
  const out = list.slice(0, 6).map((d) => ({ slug: d.slug, name: d.name, region: d.region }));
  for (const f of FALLBACK_DESTS) {
    if (out.length >= 6) break;
    if (!out.some((d) => d.name.toLowerCase() === f.name.toLowerCase())) out.push(f);
  }
  return out.map((d, i) => ({ ...d, image: list.find((x) => x.slug === d.slug)?.image || img(i, 1200) }));
}

/* ---------- blog ---------- */
const FALLBACK_POSTS = [
  { slug: "", title: "A first-timer's guide to the Sundarbans", excerpt: "When to go, how to choose a boat and how to watch wildlife quietly.", read: 6 },
  { slug: "", title: "Street food in Old Dhaka: where to start", excerpt: "A walking route through the lanes locals actually eat in.", read: 5 },
  { slug: "", title: "Tea country in two days", excerpt: "How to see Srimangal and Sylhet without rushing.", read: 4 },
];
export function blogCards(posts) {
  const src = posts.length ? posts : FALLBACK_POSTS;
  return src.slice(0, 3).map((p, i) => ({
    title: p.title, excerpt: p.excerpt,
    href: p.slug ? `/blog/${p.slug}` : "/blog",
    image: p.image || img(i, 900),
    read: p.read || Math.max(2, Math.round(String(p.body || "").split(/\s+/).length / 200) || 5),
  }));
}

/* ---------- static sections ---------- */
export const WHY = [
  { title: "Local Experts", text: "Guides born and raised where you travel, with stories no brochure has.", icon: "M12 12a4 4 0 100-8 4 4 0 000 8zM4 21a8 8 0 0116 0" },
  { title: "Secure Booking", text: "Verified payments and clear confirmation for every booking.", icon: "M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6l8-3zM9 12l2 2 4-4" },
  { title: "Custom Itineraries", text: "Tell us your pace and interests; we shape the route around you.", icon: "M9 4L3 6v14l6-2 6 2 6-2V4l-6 2-6-2zM9 4v14M15 6v14" },
  { title: "24/7 Support", text: "A real person on call before, during and after your trip.", icon: "M4 14v-2a8 8 0 0116 0v2M4 14h3v5H4zM17 14h3v5h-3z" },
];

export const STATS = [
  { to: 10000, suffix: "+", label: "Happy Travellers" },
  { to: 500, suffix: "+", label: "Tours Completed" },
  { to: 120, suffix: "+", label: "Local Guides" },
  { to: 98, suffix: "%", label: "Satisfaction" },
];

// PLACEHOLDER reviews: replace with real, permissioned customer reviews.
export const REVIEWS = [
  { name: "Amelia R.", place: "London, UK", stars: 5, text: "The Sundarbans cruise was unforgettable. Our guide spotted wildlife we would have missed." },
  { name: "Tanvir H.", place: "Dhaka", stars: 5, text: "Smooth booking and a perfectly paced weekend in Sylhet. Will book again." },
  { name: "Lucas M.", place: "Berlin, Germany", stars: 5, text: "Old Dhaka food walk was the highlight of our trip. Honest, local and delicious." },
  { name: "Priya S.", place: "Kolkata, India", stars: 4, text: "Great organisation and kind people. The hill trek views were worth every step." },
  { name: "Nusrat J.", place: "Chattogram", stars: 5, text: "Support answered at midnight when our plans changed. That is rare." },
  { name: "Daniel K.", place: "Toronto, Canada", stars: 5, text: "A thoughtful itinerary that balanced culture and downtime." },
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
      { title: "Secure Payments", text: "Pay by card or mobile banking through a verified gateway." },
      { title: "Trip Dashboard", text: "Bookings, payments and travellers all in one account." },
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

export const GALLERY = [
  { src: img(0, 1400), caption: "Sea beach at sunrise", ratio: "3/4" },
  { src: img(1, 1400), caption: "Mangrove creeks by boat", ratio: "4/3" },
  { src: img(2, 1400), caption: "Tea terraces in the morning", ratio: "1/1" },
  { src: img(3, 1400), caption: "Old city lanes", ratio: "3/4" },
  { src: img(1, 1400), caption: "Forest light", ratio: "4/3" },
  { src: img(0, 1400), caption: "Fishing boats at dusk", ratio: "1/1" },
];
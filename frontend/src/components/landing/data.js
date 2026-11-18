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
  return list.slice(0, 6).map((d, i) => ({ slug: d.slug, name: d.name, region: d.region, image: d.image || img(i, 1200) }));
}

/* ---------- blog ---------- */
export function blogCards(posts) {
  return posts.slice(0, 3).map((p, i) => ({
    title: p.title, excerpt: p.excerpt, href: `/blog/${p.slug}`, image: p.image || img(i, 900),
    read: p.body ? Math.max(1, Math.round(p.body.split(/\s+/).length / 200)) : null,
  }));
}

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

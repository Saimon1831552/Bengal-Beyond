const L = (label, href, perm, extra = {}) => ({ label, href, perm, status: "live", ...extra });
const S = (label, href, perm, note) => ({ label, href, perm, status: "soon", note });

export const ADMIN_NAV = [
  { title: "OVERVIEW", defaultOpen: true, items: [L("Dashboard", "/admin", "dashboard.read", { exact: true })] },
  { title: "BOOKING MANAGEMENT", items: [
    L("All Bookings", "/admin/bookings", "bookings.read"),
    L("Booking Calendar", "/admin/calendar", "bookings.read"),
    L("Pending Bookings", "/admin/bookings?status=pending_review", "bookings.read"),
    L("Confirmed Bookings", "/admin/bookings?status=confirmed", "bookings.read"),
    L("Cancelled Bookings", "/admin/bookings?status=cancelled", "bookings.read"),
    L("Cancellation Requests", "/admin/cancellations", "bookings.manage"),
    L("Refund Management", "/admin/refunds", "refunds.manage"),
  ] },
  { title: "TOUR MANAGEMENT", items: [
    L("All Tours", "/admin/tours", "tours.manage"),
    L("Categories", "/admin/categories", "content.manage"),
    L("Tags", "/admin/tags", "content.manage"),
    L("Destinations", "/admin/destinations", "content.manage"),
    L("Tour Packages", "/admin/packages", "tours.read"),
    L("Itinerary Management", "/admin/itineraries", "tours.read"),
    L("Tour Availability", "/admin/availability", "departures.manage"),
    L("Seasonal Pricing", "/admin/seasonal-pricing", "tours.read"),
  ] },
  { title: "CUSTOMER MANAGEMENT", items: [
    L("Customers", "/admin/customers", "customers.read"),
    S("Customer Groups", "/admin/customer-groups", "customers.read", "No backend yet."),
    L("Customer Inquiries", "/admin/inquiries", "enquiries.manage"),
    L("Customer Activity", "/admin/customer-activity", "audit.read"),
  ] },
  { title: "OPERATIONS", items: [
    L("Tour Assignments", "/admin/assignments", "staff.assign"),
    L("Tour Guides", "/admin/guides", "tours.read"),
    L("Vehicles & Transport", "/admin/vehicles", "tours.read"),
    L("Accommodation", "/admin/accommodation", "tours.read"),
  ] },
  { title: "FINANCE", items: [
    L("Payments", "/admin/payments", "payments.read"),
    S("Transactions", "/admin/transactions", "payments.read", "Ledger view not built."),
    S("Invoices", "/admin/invoices", "payments.read", "No backend yet."),
    L("Coupons & Discounts", "/admin/coupons", "settings.manage"),
    S("Revenue Reports", "/admin/reports", "payments.read", "Dashboard has summary revenue; detailed reports not built."),
  ] },
  { title: "CONTENT MANAGEMENT", items: [
    L("Blogs", "/admin/blogs", "content.manage"),
    L("Gallery", "/admin/gallery", "content.manage"),
    S("Testimonials", "/admin/testimonials", "content.manage", "No backend yet."),
    L("Reviews & Ratings", "/admin/reviews", "reviews.moderate"),
    S("Pages & SEO", "/admin/pages", "content.manage", "No backend yet."),
    S("FAQs", "/admin/faqs", "content.manage", "No backend yet."),
  ] },
  { title: "MARKETING", items: [
    S("Promotions", "/admin/promotions", "content.manage", "No backend yet."),
    S("Newsletter", "/admin/newsletter", "content.manage", "No backend yet."),
    S("Email Campaigns", "/admin/campaigns", "content.manage", "No backend yet."),
    S("Referral Management", "/admin/referrals", "content.manage", "No backend yet."),
  ] },
  { title: "SYSTEM", items: [
    L("Staff & Roles", "/admin/roles", "roles.manage", { superOnly: true }),
    L("Permissions", "/admin/permissions", "roles.manage", { superOnly: true }),
    L("Notifications", "/admin/emails", "settings.manage"),
    L("Website Settings", "/admin/settings/website", "settings.manage"),
    L("General Settings", "/admin/settings", "settings.manage", { exact: true }),
    L("Activity Logs", "/admin/activity-logs", "audit.read"),
  ] },
];

export const CUSTOMER_NAV = [
  { title: "OVERVIEW", defaultOpen: true, items: [L("Dashboard", "/dashboard", null, { exact: true })] },
  { title: "MY TRIPS", defaultOpen: true, items: [L("My Bookings", "/bookings"), L("Payments & Refunds", "/payments"), L("Wishlist", "/wishlist")] },
  { title: "HELP", defaultOpen: true, items: [L("Contact Support", "/contact")] },
];

export const SHOW_ROADMAP = process.env.NEXT_PUBLIC_SHOW_ROADMAP === "1";

/** Keep only items the user may see. Hidden items are never rendered. */
export function buildNav(groups, { permissions, isSuper }) {
  return groups
    .map((g) => ({
      ...g,
      items: g.items.filter((i) =>
        (SHOW_ROADMAP || i.status !== "soon") &&
        (!i.superOnly || isSuper) &&
        (!i.perm || permissions.includes(i.perm))),
    }))
    .filter((g) => g.items.length);
}

export const flatNav = () => ADMIN_NAV.flatMap((g) => g.items.map((i) => ({ ...i, group: g.title })));
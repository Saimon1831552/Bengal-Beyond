const customerBookingRoutes = require("../modules/customer-bookings/customer-booking.routes");
const authenticate = require("../middleware/authenticate");
const authorize = require("../middleware/authorize");
const { createGalleryRouter } = require('../modules/gallery/gallery.routes');
const { createBlogRouter } = require("../modules/blog/blog.routes");
const { publicEnquiry } = require("../middleware/apiRateLimit");


const express = require("express");

const router = express.Router();

router.use("/health", require("./Health.routes"));

// Phase 1 onwards, e.g.:
 router.use("/auth", require("../modules/auth/auth.routes"));
router.use("/tours", require("../modules/tour-search/tour-search.routes"));
router.use("/tours", require("../modules/tours/tour.routes"));
 router.use("/admin/tours", require("../modules/tours/admin-tour.routes"));
 router.use("/admin/departures", require("../modules/departures/admin-departure.routes"));
 router.use("/admin/bookings", require("../modules/bookings/admin-booking.routes"));
 router.use("/admin/payments", require("../modules/payments/admin-payment.routes"));
 router.use("/admin/customers", require("../modules/customers/admin-customer.routes"));
 router.use("/admin/dashboard", require("../modules/dashboard/dashboard.routes"));
 router.use("/admin", require("../modules/admin-activity/admin-activity.routes"));
 router.use("/admin/settings", require("../modules/settings/admin-settings.routes"));
 router.use("/admin/audit-logs", require("../modules/audit/admin-audit.routes"));
 router.use("/admin/roles", require("../modules/rbac/admin-rbac.routes")); 
 router.use("/bookings", require("../modules/bookings/booking.routes")); 
 router.use("/customer", authenticate, customerBookingRoutes);
 router.use("/customer", authenticate, require("../modules/customer-payments/customer-payment.routes"));
 router.use('/customer', authenticate, require('../modules/sslcommerz/customer-sslcommerz.routes'));
 router.use('/payments/sslcommerz', require('../modules/sslcommerz/sslcommerz.routes')); // stays PUBLIC (gateway callbacks)
 router.use('/admin/refunds', authenticate, authorize('refunds.manage'), require('../modules/refunds/admin-refund.routes'));
 router.use('/customer/refunds', authenticate, require('../modules/refunds/customer-refund.routes'));
 router.use('/admin/refunds', authenticate, authorize('refunds.manage'), require('../modules/refunds/sslcommerz-refund.routes'));
 router.use('/webhooks', require('../modules/payment-webhooks/webhook.routes'));
 router.use('/admin/payment-webhooks', authenticate, authorize('payments.manage'),
    require('../modules/payment-webhooks/webhook-admin.routes'));
 router.use('/docs', require('../modules/api-docs/api-docs.routes'));
 router.use('/destinations', require('../modules/destinations/destination.public.routes'));
 router.use('/admin/destinations', authenticate, authorize('content.manage'),
   require('../modules/destinations/destination.admin.routes'));
 
 router.use("/", require("../modules/tour-taxonomy/taxonomy.public.routes"));
 router.use("/admin/taxonomy",
    authenticate,
    authorize("content.manage"),
    require("../modules/tour-taxonomy/taxonomy.admin.routes"));

 router.use("/", require("../modules/departure-availability/departure.public.routes"));
 router.use("/admin/departures",
    authenticate,
    authorize("departures.manage"),
    require("../modules/departure-availability/departure.admin.routes"));

 router.use("/", require("../modules/tour-reviews/review.public.routes"));
 router.use("/tours", authenticate, require("../modules/tour-reviews/review.customer.routes"));
 router.use(
    "/admin/reviews",
    authenticate,
    authorize("reviews.moderate"),
    require("../modules/tour-reviews/review.admin.routes")
  );
  router.use(
    "/me/wishlist",
    authenticate,
    require("../modules/wishlist/wishlist.routes")
  );
  router.use(
    "/admin/coupons",
    authenticate,
    authorize("settings.manage"),
    require("../modules/coupons/coupon.admin.routes")
  );
  router.use(
    "/coupons",
    authenticate,
    require("../modules/coupons/coupon.customer.routes")
  );
  router.use(
    "/bookings",
    authenticate,
    require("../modules/booking-pricing/pricing.routes")
  );
  router.use("/support/enquiries", publicEnquiry);
  router.use("/support", require("../modules/support/support.public.routes"));
  router.use("/me/support", authenticate,
     require("../modules/support/support.customer.routes"));
 
  router.use("/admin/support", authenticate,
     authorize("settings.manage"),
     require("../modules/support/support.admin.routes"));

  router.use("/admin/notifications", authenticate,
     authorize("settings.manage"),
     require("../modules/notifications/notification.admin.routes"));

  router.use('/gallery', createGalleryRouter({ authenticate, authorize }));

  router.use("/blog", createBlogRouter({ authenticate, authorize }));

  router.use("/me", require("../modules/rbac/me.routes"));
  

  


module.exports = router;
-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Oct 15, 2026 at 07:58 AM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `bengal_beyond`
--

-- --------------------------------------------------------

--
-- Table structure for table `admin_notifications`
--

CREATE TABLE `admin_notifications` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `event_type` varchar(100) NOT NULL,
  `title` varchar(200) NOT NULL,
  `message` varchar(1000) NOT NULL,
  `entity_type` varchar(50) NOT NULL,
  `entity_id` bigint(20) UNSIGNED NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `admin_notifications`
--

INSERT INTO `admin_notifications` (`id`, `event_type`, `title`, `message`, `entity_type`, `entity_id`, `created_at`) VALUES
(1, 'booking.created', 'New tour booking', 'A new demo booking BB-DEMO-0001 requires review.', 'booking', 1, '2026-10-14 08:59:05');

-- --------------------------------------------------------

--
-- Table structure for table `admin_notification_recipients`
--

CREATE TABLE `admin_notification_recipients` (
  `notification_id` bigint(20) UNSIGNED NOT NULL,
  `recipient_user_id` bigint(20) UNSIGNED NOT NULL,
  `is_read` tinyint(1) NOT NULL DEFAULT 0,
  `read_at` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `admin_settings`
--

CREATE TABLE `admin_settings` (
  `setting_key` varchar(120) NOT NULL,
  `setting_value` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL CHECK (json_valid(`setting_value`)),
  `updated_by` bigint(20) UNSIGNED DEFAULT NULL,
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `audit_logs`
--

CREATE TABLE `audit_logs` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `actor_user_id` bigint(20) UNSIGNED DEFAULT NULL,
  `action` varchar(120) NOT NULL,
  `entity_type` varchar(80) NOT NULL,
  `entity_id` bigint(20) UNSIGNED DEFAULT NULL,
  `request_id` varchar(100) DEFAULT NULL,
  `ip_address` varbinary(16) DEFAULT NULL,
  `user_agent` varchar(500) DEFAULT NULL,
  `before_data` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`before_data`)),
  `after_data` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`after_data`)),
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `blog_posts`
--

CREATE TABLE `blog_posts` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `slug` varchar(180) NOT NULL,
  `title` varchar(240) NOT NULL,
  `excerpt` varchar(700) DEFAULT NULL,
  `body` mediumtext NOT NULL,
  `status` enum('draft','published','archived') NOT NULL DEFAULT 'draft',
  `author_user_id` bigint(20) UNSIGNED DEFAULT NULL,
  `published_at` datetime DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `blog_posts`
--

INSERT INTO `blog_posts` (`id`, `slug`, `title`, `excerpt`, `body`, `status`, `author_user_id`, `published_at`, `created_at`, `updated_at`) VALUES
(1, 'best-places-to-visit-in-bangladesh', 'Best Places to Visit in Bangladesh', 'Discover beaches, forests, tea gardens and historic destinations.', 'Bangladesh offers coastal scenery, green tea estates, mangrove forests and rich cultural heritage. Plan your journey according to the season and local travel conditions.', 'published', 1, '2026-10-14 08:59:05', '2026-10-14 08:59:05', '2026-10-14 08:59:05'),
(2, 'travel-tips-for-first-time-visitors', 'Travel Tips for First-Time Visitors', 'Helpful tips for planning your Bangladesh trip.', 'Research transportation, weather, local customs and accommodation before travelling. Confirm tour inclusions, cancellation terms and departure times with your tour operator.', 'published', 1, '2026-10-14 08:59:05', '2026-10-14 08:59:05', '2026-10-14 08:59:05');

-- --------------------------------------------------------

--
-- Table structure for table `bookings`
--

CREATE TABLE `bookings` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `booking_reference` varchar(24) NOT NULL,
  `user_id` bigint(20) UNSIGNED DEFAULT NULL,
  `booking_status` enum('pending_review','awaiting_payment','confirmed','rejected','cancellation_requested','cancelled','completed','expired') NOT NULL DEFAULT 'pending_review',
  `payment_status` enum('not_required','unpaid','pending','paid','partially_refunded','refunded','failed') NOT NULL DEFAULT 'unpaid',
  `customer_name` varchar(160) NOT NULL,
  `customer_email` varchar(254) NOT NULL,
  `customer_phone` varchar(30) NOT NULL,
  `customer_nationality` varchar(100) DEFAULT NULL,
  `currency_code` char(3) NOT NULL DEFAULT 'USD',
  `subtotal` decimal(12,2) NOT NULL,
  `discount_amount` decimal(12,2) NOT NULL DEFAULT 0.00,
  `tax_amount` decimal(12,2) NOT NULL DEFAULT 0.00,
  `total_amount` decimal(12,2) NOT NULL,
  `special_requests` text DEFAULT NULL,
  `policy_snapshot` longtext DEFAULT NULL CHECK (json_valid(`policy_snapshot`)),
  `idempotency_key` varchar(100) DEFAULT NULL,
  `confirmed_at` datetime DEFAULT NULL,
  `cancelled_at` datetime DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ;

--
-- Dumping data for table `bookings`
--

INSERT INTO `bookings` (`id`, `booking_reference`, `user_id`, `booking_status`, `payment_status`, `customer_name`, `customer_email`, `customer_phone`, `customer_nationality`, `currency_code`, `subtotal`, `discount_amount`, `tax_amount`, `total_amount`, `special_requests`, `policy_snapshot`, `idempotency_key`, `confirmed_at`, `cancelled_at`, `created_at`, `updated_at`) VALUES
(1, 'BB-DEMO-0001', 2, 'pending_review', 'unpaid', 'John Smith', 'customer@example.com', '+447700900001', 'British', 'USD', 300.00, 0.00, 0.00, 300.00, 'Vegetarian meal preferred.', '{\"cancellation_policy\": \"Demo policy; confirm actual terms with the operator.\"}', NULL, NULL, NULL, '2026-10-14 08:59:04', '2026-10-14 08:59:04');

-- --------------------------------------------------------

--
-- Table structure for table `booking_addons`
--

CREATE TABLE `booking_addons` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `booking_item_id` bigint(20) UNSIGNED NOT NULL,
  `addon_id` bigint(20) UNSIGNED NOT NULL,
  `quantity` int(10) UNSIGNED NOT NULL DEFAULT 1,
  `unit_price` decimal(12,2) NOT NULL,
  `line_total` decimal(12,2) NOT NULL,
  `addon_snapshot` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ;

-- --------------------------------------------------------

--
-- Table structure for table `booking_change_requests`
--

CREATE TABLE `booking_change_requests` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `booking_id` bigint(20) UNSIGNED NOT NULL,
  `requested_by` bigint(20) UNSIGNED DEFAULT NULL,
  `request_type` enum('date_change','traveler_change','tour_change','other') NOT NULL,
  `request_details` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL CHECK (json_valid(`request_details`)),
  `status` enum('pending','approved','rejected','withdrawn') NOT NULL DEFAULT 'pending',
  `reviewed_by` bigint(20) UNSIGNED DEFAULT NULL,
  `reviewed_at` datetime DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `booking_items`
--

CREATE TABLE `booking_items` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `booking_id` bigint(20) UNSIGNED NOT NULL,
  `tour_id` bigint(20) UNSIGNED NOT NULL,
  `departure_id` bigint(20) UNSIGNED NOT NULL,
  `quantity` int(10) UNSIGNED NOT NULL,
  `unit_price` decimal(12,2) NOT NULL,
  `line_total` decimal(12,2) NOT NULL,
  `tour_snapshot` longtext NOT NULL CHECK (json_valid(`tour_snapshot`)),
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ;

--
-- Dumping data for table `booking_items`
--

INSERT INTO `booking_items` (`id`, `booking_id`, `tour_id`, `departure_id`, `quantity`, `unit_price`, `line_total`, `tour_snapshot`, `created_at`) VALUES
(1, 1, 1, 1, 2, 150.00, 300.00, '{\"title\": \"Cox\'s Bazar Beach Escape\", \"destination\": \"Cox\'s Bazar\", \"duration_days\": 3, \"currency_code\": \"USD\"}', '2026-10-14 08:59:05');

-- --------------------------------------------------------

--
-- Table structure for table `booking_notes`
--

CREATE TABLE `booking_notes` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `booking_id` bigint(20) UNSIGNED NOT NULL,
  `admin_user_id` bigint(20) UNSIGNED NOT NULL,
  `note` text NOT NULL,
  `visibility` enum('internal','customer_visible') NOT NULL DEFAULT 'internal',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `booking_status_history`
--

CREATE TABLE `booking_status_history` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `booking_id` bigint(20) UNSIGNED NOT NULL,
  `previous_status` varchar(40) DEFAULT NULL,
  `new_status` varchar(40) NOT NULL,
  `changed_by_user_id` bigint(20) UNSIGNED DEFAULT NULL,
  `note` varchar(1000) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `booking_status_history`
--

INSERT INTO `booking_status_history` (`id`, `booking_id`, `previous_status`, `new_status`, `changed_by_user_id`, `note`, `created_at`) VALUES
(1, 1, NULL, 'pending_review', 1, 'Demo booking created for testing.', '2026-10-14 08:59:05');

-- --------------------------------------------------------

--
-- Table structure for table `booking_travelers`
--

CREATE TABLE `booking_travelers` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `booking_id` bigint(20) UNSIGNED NOT NULL,
  `traveler_name` varchar(160) NOT NULL,
  `traveler_type` enum('adult','child','infant') NOT NULL DEFAULT 'adult',
  `nationality` varchar(100) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `booking_travelers`
--

INSERT INTO `booking_travelers` (`id`, `booking_id`, `traveler_name`, `traveler_type`, `nationality`, `created_at`) VALUES
(1, 1, 'John Smith', 'adult', 'British', '2026-10-14 08:59:05'),
(2, 1, 'Jane Smith', 'adult', 'British', '2026-10-14 08:59:05');

-- --------------------------------------------------------

--
-- Table structure for table `gallery_items`
--

CREATE TABLE `gallery_items` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `tour_id` bigint(20) UNSIGNED DEFAULT NULL,
  `title` varchar(200) DEFAULT NULL,
  `media_url` varchar(1024) NOT NULL,
  `alt_text` varchar(255) DEFAULT NULL,
  `sort_order` int(11) NOT NULL DEFAULT 0,
  `status` enum('draft','published','archived') NOT NULL DEFAULT 'draft',
  `created_by` bigint(20) UNSIGNED DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `gallery_items`
--

INSERT INTO `gallery_items` (`id`, `tour_id`, `title`, `media_url`, `alt_text`, `sort_order`, `status`, `created_by`, `created_at`) VALUES
(1, 1, 'Cox\'s Bazar Beach', 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e', 'Sandy beach and ocean', 1, 'published', 1, '2026-10-14 08:59:05'),
(2, 2, 'Sundarbans Forest', 'https://images.unsplash.com/photo-1448375240586-882707db888b', 'Green forest landscape', 2, 'published', 1, '2026-10-14 08:59:05');

-- --------------------------------------------------------

--
-- Table structure for table `notification_logs`
--

CREATE TABLE `notification_logs` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `booking_id` bigint(20) UNSIGNED DEFAULT NULL,
  `recipient_email` varchar(254) NOT NULL,
  `notification_type` varchar(100) NOT NULL,
  `subject` varchar(255) NOT NULL,
  `delivery_status` enum('queued','sending','sent','failed','dead_letter') NOT NULL DEFAULT 'queued',
  `provider_message_id` varchar(255) DEFAULT NULL,
  `attempts` smallint(5) UNSIGNED NOT NULL DEFAULT 0,
  `last_error_code` varchar(100) DEFAULT NULL,
  `last_error_message` varchar(1000) DEFAULT NULL,
  `sent_at` datetime DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `notification_outbox`
--

CREATE TABLE `notification_outbox` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `event_key` varchar(190) NOT NULL,
  `event_type` varchar(100) NOT NULL,
  `aggregate_type` varchar(50) NOT NULL,
  `aggregate_id` bigint(20) UNSIGNED NOT NULL,
  `payload` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL CHECK (json_valid(`payload`)),
  `status` enum('pending','processing','processed','failed') NOT NULL DEFAULT 'pending',
  `attempts` smallint(5) UNSIGNED NOT NULL DEFAULT 0,
  `available_at` datetime NOT NULL DEFAULT current_timestamp(),
  `locked_at` datetime DEFAULT NULL,
  `processed_at` datetime DEFAULT NULL,
  `last_error` varchar(1000) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `notification_preferences`
--

CREATE TABLE `notification_preferences` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `user_id` bigint(20) UNSIGNED NOT NULL,
  `event_type` varchar(100) NOT NULL,
  `email_enabled` tinyint(1) NOT NULL DEFAULT 1,
  `in_app_enabled` tinyint(1) NOT NULL DEFAULT 1,
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `notification_templates`
--

CREATE TABLE `notification_templates` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `template_key` varchar(100) NOT NULL,
  `subject` varchar(255) NOT NULL,
  `body_html` mediumtext NOT NULL,
  `body_text` mediumtext NOT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `payments`
--

CREATE TABLE `payments` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `booking_id` bigint(20) UNSIGNED NOT NULL,
  `provider` varchar(50) NOT NULL,
  `provider_payment_id` varchar(190) DEFAULT NULL,
  `idempotency_key` varchar(100) NOT NULL,
  `amount` decimal(12,2) NOT NULL,
  `currency_code` char(3) NOT NULL,
  `status` enum('initiated','pending','succeeded','failed','cancelled') NOT NULL DEFAULT 'initiated',
  `verified_at` datetime DEFAULT NULL,
  `raw_event` longtext DEFAULT NULL CHECK (json_valid(`raw_event`)),
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ;

-- --------------------------------------------------------

--
-- Table structure for table `permissions`
--

CREATE TABLE `permissions` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `permission_key` varchar(100) NOT NULL,
  `description` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `permissions`
--

INSERT INTO `permissions` (`id`, `permission_key`, `description`) VALUES
(1, 'dashboard.read', 'View admin dashboard'),
(2, 'bookings.read', 'View bookings'),
(3, 'bookings.manage', 'Update booking status and notes'),
(4, 'bookings.confirm', 'Confirm eligible bookings'),
(5, 'bookings.reject', 'Reject booking requests'),
(6, 'payments.read', 'View payment records'),
(7, 'payments.manage', 'Manage payment operations'),
(8, 'refunds.manage', 'Request or process refunds'),
(9, 'tours.read', 'View tours'),
(10, 'tours.manage', 'Create and update tours'),
(11, 'departures.manage', 'Manage departures and capacity'),
(12, 'customers.read', 'View permitted customer details'),
(13, 'customers.suspend', 'Suspend customer accounts'),
(14, 'content.manage', 'Manage blogs and gallery'),
(15, 'reviews.moderate', 'Moderate reviews'),
(16, 'enquiries.manage', 'Manage custom tour enquiries'),
(17, 'notifications.read', 'Read admin notifications'),
(18, 'settings.manage', 'Manage platform settings'),
(19, 'audit.read', 'Read audit logs'),
(20, 'staff.assign', 'Assign staff to records'),
(21, 'roles.manage', 'Manage staff roles and permission grants');

-- --------------------------------------------------------

--
-- Table structure for table `refresh_tokens`
--

CREATE TABLE `refresh_tokens` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `user_id` bigint(20) UNSIGNED NOT NULL,
  `token_hash` char(64) NOT NULL COMMENT 'SHA-256 of the token; never store the raw token',
  `user_agent` varchar(500) DEFAULT NULL,
  `ip_address` varbinary(16) DEFAULT NULL,
  `expires_at` datetime NOT NULL,
  `revoked_at` datetime DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `refunds`
--

CREATE TABLE `refunds` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `payment_id` bigint(20) UNSIGNED NOT NULL,
  `amount` decimal(12,2) NOT NULL,
  `reason` varchar(500) DEFAULT NULL,
  `status` enum('requested','pending','succeeded','failed','cancelled') NOT NULL DEFAULT 'requested',
  `provider_refund_id` varchar(190) DEFAULT NULL,
  `requested_by` bigint(20) UNSIGNED DEFAULT NULL,
  `processed_by` bigint(20) UNSIGNED DEFAULT NULL,
  `processed_at` datetime DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ;

-- --------------------------------------------------------

--
-- Table structure for table `roles`
--

CREATE TABLE `roles` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `role_key` varchar(50) NOT NULL,
  `name` varchar(100) NOT NULL,
  `description` varchar(255) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `roles`
--

INSERT INTO `roles` (`id`, `role_key`, `name`, `description`, `created_at`) VALUES
(1, 'super_admin', 'Super Admin', 'Full platform administration', '2026-10-14 08:54:50'),
(2, 'admin', 'Admin', 'General administration with assigned permissions', '2026-10-14 08:54:50'),
(3, 'booking_manager', 'Booking Manager', 'Manage bookings and departures', '2026-10-14 08:54:50'),
(4, 'content_manager', 'Content Manager', 'Manage tours, blogs, and gallery', '2026-10-14 08:54:50'),
(5, 'customer_support', 'Customer Support', 'Handle customer support and enquiries', '2026-10-14 08:54:50'),
(6, 'tour_operator', 'Tour Operator / Guide', 'Restricted access to assigned tours/departures', '2026-10-14 08:54:50'),
(7, 'customer', 'Customer', 'Customer account access', '2026-10-14 08:54:50');

-- --------------------------------------------------------

--
-- Table structure for table `role_permissions`
--

CREATE TABLE `role_permissions` (
  `role_id` bigint(20) UNSIGNED NOT NULL,
  `permission_id` bigint(20) UNSIGNED NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `role_permissions`
--

INSERT INTO `role_permissions` (`role_id`, `permission_id`) VALUES
(1, 1),
(1, 2),
(1, 3),
(1, 4),
(1, 5),
(1, 6),
(1, 7),
(1, 8),
(1, 9),
(1, 10),
(1, 11),
(1, 12),
(1, 13),
(1, 14),
(1, 15),
(1, 16),
(1, 17),
(1, 18),
(1, 19),
(1, 20),
(1, 21),
(3, 1),
(3, 2),
(3, 3),
(3, 4),
(3, 5),
(3, 6),
(3, 9),
(3, 11),
(3, 12),
(3, 16),
(3, 17),
(4, 1),
(4, 9),
(4, 10),
(4, 14),
(4, 15),
(5, 2),
(5, 3),
(5, 12),
(5, 16),
(5, 17),
(6, 9);

-- --------------------------------------------------------

--
-- Table structure for table `seat_holds`
--

CREATE TABLE `seat_holds` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `departure_id` bigint(20) UNSIGNED NOT NULL,
  `booking_id` bigint(20) UNSIGNED NOT NULL,
  `quantity` int(10) UNSIGNED NOT NULL,
  `expires_at` datetime NOT NULL,
  `hold_status` enum('active','converted','released','expired') NOT NULL DEFAULT 'active',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ;

-- --------------------------------------------------------

--
-- Table structure for table `staff_assignments`
--

CREATE TABLE `staff_assignments` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `entity_type` enum('booking','enquiry','tour') NOT NULL,
  `entity_id` bigint(20) UNSIGNED NOT NULL,
  `staff_user_id` bigint(20) UNSIGNED NOT NULL,
  `assigned_by` bigint(20) UNSIGNED DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `tours`
--

CREATE TABLE `tours` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `slug` varchar(180) NOT NULL,
  `title` varchar(200) NOT NULL,
  `summary` varchar(500) DEFAULT NULL,
  `description` longtext DEFAULT NULL,
  `destination` varchar(160) NOT NULL,
  `duration_days` smallint(5) UNSIGNED NOT NULL,
  `base_price` decimal(12,2) NOT NULL,
  `currency_code` char(3) NOT NULL DEFAULT 'USD',
  `status` enum('draft','published','unpublished','archived') NOT NULL DEFAULT 'draft',
  `cover_image_url` varchar(1024) DEFAULT NULL,
  `cancellation_policy` text DEFAULT NULL,
  `created_by` bigint(20) UNSIGNED DEFAULT NULL,
  `updated_by` bigint(20) UNSIGNED DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `deleted_at` datetime DEFAULT NULL
) ;

--
-- Dumping data for table `tours`
--

INSERT INTO `tours` (`id`, `slug`, `title`, `summary`, `description`, `destination`, `duration_days`, `base_price`, `currency_code`, `status`, `cover_image_url`, `cancellation_policy`, `created_by`, `updated_by`, `created_at`, `updated_at`, `deleted_at`) VALUES
(1, 'coxsbazar-beach-escape', 'Cox\'s Bazar Beach Escape', 'Explore the world\'s famous long sandy beach.', 'Enjoy beach activities, local seafood and a relaxing coastal holiday.', 'Cox\'s Bazar', 3, 150.00, 'USD', 'published', 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e', NULL, 1, 1, '2026-10-14 08:59:04', '2026-10-14 08:59:04', NULL),
(2, 'sundarbans-wildlife-adventure', 'Sundarbans Wildlife Adventure', 'Explore mangrove forests and local wildlife.', 'A guided boat journey through the Sundarbans with local cultural experiences.', 'Sundarbans', 4, 280.00, 'USD', 'published', 'https://images.unsplash.com/photo-1448375240586-882707db888b', NULL, 1, 1, '2026-10-14 08:59:04', '2026-10-14 08:59:04', NULL),
(3, 'sylhet-tea-garden-tour', 'Sylhet Tea Garden Tour', 'Discover green tea gardens and natural landscapes.', 'Explore tea estates, waterfalls and the scenic countryside of Sylhet.', 'Sylhet', 2, 120.00, 'USD', 'published', 'https://images.unsplash.com/photo-1544787219-7f47ccb76574', NULL, 1, 1, '2026-10-14 08:59:04', '2026-10-14 08:59:04', NULL),
(4, 'old-dhaka-heritage-walk', 'Old Dhaka Heritage Walk', 'Discover historic streets, architecture and cuisine.', 'A guided cultural walking tour through the historic neighborhoods of Old Dhaka.', 'Dhaka', 1, 45.00, 'USD', 'published', 'https://images.unsplash.com/photo-1511818966892-d7d671e672a2', NULL, 1, 1, '2026-10-14 08:59:04', '2026-10-14 08:59:04', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `tour_addons`
--

CREATE TABLE `tour_addons` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `tour_id` bigint(20) UNSIGNED NOT NULL,
  `name` varchar(120) NOT NULL,
  `description` varchar(500) DEFAULT NULL,
  `price` decimal(12,2) NOT NULL,
  `pricing_mode` enum('per_person','per_booking') NOT NULL DEFAULT 'per_person',
  `is_active` tinyint(1) NOT NULL DEFAULT 1
) ;

--
-- Dumping data for table `tour_addons`
--

INSERT INTO `tour_addons` (`id`, `tour_id`, `name`, `description`, `price`, `pricing_mode`, `is_active`) VALUES
(1, 1, 'Private Transport', 'Private transport for the tour.', 35.00, 'per_booking', 1),
(2, 3, 'Local Guide', 'Additional local guide service.', 20.00, 'per_person', 1);

-- --------------------------------------------------------

--
-- Table structure for table `tour_departures`
--

CREATE TABLE `tour_departures` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `tour_id` bigint(20) UNSIGNED NOT NULL,
  `starts_at` datetime NOT NULL COMMENT 'Store UTC',
  `ends_at` datetime DEFAULT NULL COMMENT 'Store UTC',
  `seat_capacity` int(10) UNSIGNED NOT NULL,
  `seats_reserved` int(10) UNSIGNED NOT NULL DEFAULT 0,
  `price_override` decimal(12,2) DEFAULT NULL,
  `status` enum('scheduled','sold_out','cancelled','completed') NOT NULL DEFAULT 'scheduled',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ;

--
-- Dumping data for table `tour_departures`
--

INSERT INTO `tour_departures` (`id`, `tour_id`, `starts_at`, `ends_at`, `seat_capacity`, `seats_reserved`, `price_override`, `status`, `created_at`, `updated_at`) VALUES
(1, 1, '2026-11-13 00:00:00', '2026-11-16 00:00:00', 20, 0, NULL, 'scheduled', '2026-10-14 08:59:04', '2026-10-14 08:59:04'),
(2, 2, '2026-11-28 00:00:00', '2026-12-02 00:00:00', 12, 0, NULL, 'scheduled', '2026-10-14 08:59:04', '2026-10-14 08:59:04'),
(3, 3, '2026-11-03 00:00:00', '2026-11-05 00:00:00', 15, 0, NULL, 'scheduled', '2026-10-14 08:59:04', '2026-10-14 08:59:04'),
(4, 4, '2026-10-24 00:00:00', '2026-10-25 00:00:00', 10, 0, NULL, 'scheduled', '2026-10-14 08:59:04', '2026-10-14 08:59:04');

-- --------------------------------------------------------

--
-- Table structure for table `tour_enquiries`
--

CREATE TABLE `tour_enquiries` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `user_id` bigint(20) UNSIGNED DEFAULT NULL,
  `name` varchar(160) NOT NULL,
  `email` varchar(254) NOT NULL,
  `phone` varchar(30) DEFAULT NULL,
  `destination` varchar(160) DEFAULT NULL,
  `preferred_start_date` date DEFAULT NULL,
  `preferred_end_date` date DEFAULT NULL,
  `traveler_count` smallint(5) UNSIGNED DEFAULT NULL,
  `budget_amount` decimal(12,2) DEFAULT NULL,
  `currency_code` char(3) NOT NULL DEFAULT 'USD',
  `message` text NOT NULL,
  `status` enum('new','assigned','in_progress','awaiting_customer','converted','closed','rejected') NOT NULL DEFAULT 'new',
  `assigned_to` bigint(20) UNSIGNED DEFAULT NULL,
  `converted_booking_id` bigint(20) UNSIGNED DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `tour_enquiries`
--

INSERT INTO `tour_enquiries` (`id`, `user_id`, `name`, `email`, `phone`, `destination`, `preferred_start_date`, `preferred_end_date`, `traveler_count`, `budget_amount`, `currency_code`, `message`, `status`, `assigned_to`, `converted_booking_id`, `created_at`, `updated_at`) VALUES
(1, 2, 'John Smith', 'customer@example.com', '+447700900001', 'Sylhet', '2026-12-13', '2026-12-15', 2, 500.00, 'USD', 'I would like a customized tour with accommodation and transport.', 'new', NULL, NULL, '2026-10-14 08:59:06', '2026-10-14 08:59:06');

-- --------------------------------------------------------

--
-- Table structure for table `tour_reviews`
--

CREATE TABLE `tour_reviews` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `tour_id` bigint(20) UNSIGNED NOT NULL,
  `booking_id` bigint(20) UNSIGNED DEFAULT NULL,
  `user_id` bigint(20) UNSIGNED DEFAULT NULL,
  `reviewer_name` varchar(160) NOT NULL,
  `rating` tinyint(3) UNSIGNED NOT NULL,
  `review_text` text DEFAULT NULL,
  `status` enum('pending','published','rejected') NOT NULL DEFAULT 'pending',
  `admin_reply` text DEFAULT NULL,
  `moderated_by` bigint(20) UNSIGNED DEFAULT NULL,
  `moderated_at` datetime DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ;

--
-- Dumping data for table `tour_reviews`
--

INSERT INTO `tour_reviews` (`id`, `tour_id`, `booking_id`, `user_id`, `reviewer_name`, `rating`, `review_text`, `status`, `admin_reply`, `moderated_by`, `moderated_at`, `created_at`) VALUES
(1, 1, NULL, 2, 'Emily Wilson', 5, 'Beautiful destination and a memorable experience.', 'published', NULL, NULL, NULL, '2026-10-14 08:59:05');

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `email` varchar(254) NOT NULL,
  `password_hash` varchar(255) DEFAULT NULL,
  `full_name` varchar(160) NOT NULL,
  `phone` varchar(30) DEFAULT NULL,
  `nationality` varchar(100) DEFAULT NULL,
  `account_status` enum('active','suspended','pending_verification','deleted') NOT NULL DEFAULT 'active',
  `email_verified_at` datetime DEFAULT NULL,
  `last_login_at` datetime DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`id`, `email`, `password_hash`, `full_name`, `phone`, `nationality`, `account_status`, `email_verified_at`, `last_login_at`, `created_at`, `updated_at`) VALUES
(1, 'admin@banglebeyond.com', NULL, 'Bangle Beyond Admin', '+8801700000001', 'Bangladeshi', 'active', '2026-10-14 08:59:04', NULL, '2026-10-14 08:59:04', '2026-10-14 08:59:04'),
(2, 'customer@example.com', NULL, 'John Smith', '+447700900001', 'British', 'active', '2026-10-14 08:59:04', NULL, '2026-10-14 08:59:04', '2026-10-14 08:59:04'),
(3, 'guide@banglebeyond.com', NULL, 'Rahim Ahmed', '+8801700000002', 'Bangladeshi', 'active', '2026-10-14 08:59:04', NULL, '2026-10-14 08:59:04', '2026-10-14 08:59:04');

-- --------------------------------------------------------

--
-- Table structure for table `user_action_tokens`
--

CREATE TABLE `user_action_tokens` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `user_id` bigint(20) UNSIGNED NOT NULL,
  `token_type` enum('email_verification','password_reset') NOT NULL,
  `token_hash` char(64) NOT NULL,
  `expires_at` datetime NOT NULL,
  `used_at` datetime DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `user_roles`
--

CREATE TABLE `user_roles` (
  `user_id` bigint(20) UNSIGNED NOT NULL,
  `role_id` bigint(20) UNSIGNED NOT NULL,
  `assigned_by` bigint(20) UNSIGNED DEFAULT NULL,
  `assigned_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `user_roles`
--

INSERT INTO `user_roles` (`user_id`, `role_id`, `assigned_by`, `assigned_at`) VALUES
(1, 1, NULL, '2026-10-14 08:59:04'),
(2, 7, NULL, '2026-10-14 08:59:04'),
(3, 6, NULL, '2026-10-14 08:59:04');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `admin_notifications`
--
ALTER TABLE `admin_notifications`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_admin_notifications_created` (`created_at`),
  ADD KEY `idx_admin_notifications_entity` (`entity_type`,`entity_id`);

--
-- Indexes for table `admin_notification_recipients`
--
ALTER TABLE `admin_notification_recipients`
  ADD PRIMARY KEY (`notification_id`,`recipient_user_id`),
  ADD KEY `idx_admin_notification_unread` (`recipient_user_id`,`is_read`,`notification_id`);

--
-- Indexes for table `admin_settings`
--
ALTER TABLE `admin_settings`
  ADD PRIMARY KEY (`setting_key`),
  ADD KEY `fk_admin_settings_updated_by` (`updated_by`);

--
-- Indexes for table `audit_logs`
--
ALTER TABLE `audit_logs`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_audit_actor_created` (`actor_user_id`,`created_at`),
  ADD KEY `idx_audit_entity_created` (`entity_type`,`entity_id`,`created_at`),
  ADD KEY `idx_audit_action_created` (`action`,`created_at`);

--
-- Indexes for table `blog_posts`
--
ALTER TABLE `blog_posts`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_blog_posts_slug` (`slug`),
  ADD KEY `idx_blog_posts_status_published` (`status`,`published_at`),
  ADD KEY `fk_blog_posts_author` (`author_user_id`);

--
-- Indexes for table `bookings`
--
ALTER TABLE `bookings`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_bookings_reference` (`booking_reference`),
  ADD UNIQUE KEY `uq_bookings_idempotency` (`idempotency_key`),
  ADD KEY `idx_bookings_user_created` (`user_id`,`created_at`),
  ADD KEY `idx_bookings_status_created` (`booking_status`,`created_at`),
  ADD KEY `idx_bookings_email` (`customer_email`),
  ADD KEY `idx_bookings_payment_status` (`payment_status`),
  ADD KEY `idx_bookings_status_payment_created` (`booking_status`,`payment_status`,`created_at`),
  ADD KEY `idx_bookings_phone` (`customer_phone`),
  ADD KEY `idx_bookings_customer_name` (`customer_name`(60));

--
-- Indexes for table `booking_addons`
--
ALTER TABLE `booking_addons`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_booking_addons_item` (`booking_item_id`),
  ADD KEY `idx_booking_addons_addon` (`addon_id`);

--
-- Indexes for table `booking_change_requests`
--
ALTER TABLE `booking_change_requests`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_change_requests_status_created` (`status`,`created_at`),
  ADD KEY `idx_change_requests_booking` (`booking_id`),
  ADD KEY `fk_change_requests_requester` (`requested_by`),
  ADD KEY `fk_change_requests_reviewer` (`reviewed_by`);

--
-- Indexes for table `booking_items`
--
ALTER TABLE `booking_items`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_booking_items_booking` (`booking_id`),
  ADD KEY `idx_booking_items_departure` (`departure_id`),
  ADD KEY `idx_booking_items_tour` (`tour_id`);

--
-- Indexes for table `booking_notes`
--
ALTER TABLE `booking_notes`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_booking_notes_booking_created` (`booking_id`,`created_at`),
  ADD KEY `fk_booking_notes_admin` (`admin_user_id`);

--
-- Indexes for table `booking_status_history`
--
ALTER TABLE `booking_status_history`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_booking_history_booking_created` (`booking_id`,`created_at`),
  ADD KEY `fk_booking_history_user` (`changed_by_user_id`);

--
-- Indexes for table `booking_travelers`
--
ALTER TABLE `booking_travelers`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_travelers_booking` (`booking_id`);

--
-- Indexes for table `gallery_items`
--
ALTER TABLE `gallery_items`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_gallery_status_order` (`status`,`sort_order`),
  ADD KEY `fk_gallery_tour` (`tour_id`),
  ADD KEY `fk_gallery_creator` (`created_by`);

--
-- Indexes for table `notification_logs`
--
ALTER TABLE `notification_logs`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_notification_logs_status_created` (`delivery_status`,`created_at`),
  ADD KEY `idx_notification_logs_booking` (`booking_id`),
  ADD KEY `idx_notification_logs_recipient_created` (`recipient_email`,`created_at`);

--
-- Indexes for table `notification_outbox`
--
ALTER TABLE `notification_outbox`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_outbox_event_key` (`event_key`),
  ADD KEY `idx_outbox_work` (`status`,`available_at`,`id`);

--
-- Indexes for table `notification_preferences`
--
ALTER TABLE `notification_preferences`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_notification_preferences` (`user_id`,`event_type`);

--
-- Indexes for table `notification_templates`
--
ALTER TABLE `notification_templates`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_notification_templates_key` (`template_key`);

--
-- Indexes for table `payments`
--
ALTER TABLE `payments`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_payments_idempotency` (`idempotency_key`),
  ADD UNIQUE KEY `uq_payments_provider_payment` (`provider`,`provider_payment_id`),
  ADD KEY `idx_payments_booking_status` (`booking_id`,`status`);

--
-- Indexes for table `permissions`
--
ALTER TABLE `permissions`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_permissions_key` (`permission_key`);

--
-- Indexes for table `refresh_tokens`
--
ALTER TABLE `refresh_tokens`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_refresh_tokens_hash` (`token_hash`),
  ADD KEY `idx_refresh_tokens_user` (`user_id`,`revoked_at`),
  ADD KEY `idx_refresh_tokens_expiry` (`expires_at`);

--
-- Indexes for table `refunds`
--
ALTER TABLE `refunds`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_refunds_payment_status` (`payment_id`,`status`),
  ADD KEY `fk_refunds_requester` (`requested_by`),
  ADD KEY `fk_refunds_processor` (`processed_by`);

--
-- Indexes for table `roles`
--
ALTER TABLE `roles`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_roles_role_key` (`role_key`);

--
-- Indexes for table `role_permissions`
--
ALTER TABLE `role_permissions`
  ADD PRIMARY KEY (`role_id`,`permission_id`),
  ADD KEY `fk_role_permissions_permission` (`permission_id`);

--
-- Indexes for table `seat_holds`
--
ALTER TABLE `seat_holds`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_seat_holds_expiry` (`hold_status`,`expires_at`),
  ADD KEY `idx_seat_holds_departure` (`departure_id`,`hold_status`),
  ADD KEY `idx_seat_holds_booking` (`booking_id`);

--
-- Indexes for table `staff_assignments`
--
ALTER TABLE `staff_assignments`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_staff_assignment` (`entity_type`,`entity_id`,`staff_user_id`),
  ADD KEY `idx_staff_assignments_staff` (`staff_user_id`,`created_at`),
  ADD KEY `fk_staff_assignments_assigner` (`assigned_by`);

--
-- Indexes for table `tours`
--
ALTER TABLE `tours`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_tours_slug` (`slug`),
  ADD KEY `idx_tours_status_destination` (`status`,`destination`),
  ADD KEY `idx_tours_published_updated` (`status`,`updated_at`),
  ADD KEY `fk_tours_created_by` (`created_by`),
  ADD KEY `fk_tours_updated_by` (`updated_by`);
ALTER TABLE `tours` ADD FULLTEXT KEY `ft_tours_search` (`title`,`summary`,`destination`);

--
-- Indexes for table `tour_addons`
--
ALTER TABLE `tour_addons`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_addons_tour_active` (`tour_id`,`is_active`);

--
-- Indexes for table `tour_departures`
--
ALTER TABLE `tour_departures`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_departures_tour_start` (`tour_id`,`starts_at`,`status`),
  ADD KEY `idx_departures_start_status` (`starts_at`,`status`);

--
-- Indexes for table `tour_enquiries`
--
ALTER TABLE `tour_enquiries`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_enquiries_status_created` (`status`,`created_at`),
  ADD KEY `idx_enquiries_email` (`email`),
  ADD KEY `fk_enquiries_user` (`user_id`),
  ADD KEY `fk_enquiries_assignee` (`assigned_to`),
  ADD KEY `idx_enquiries_assignee_status` (`assigned_to`,`status`),
  ADD KEY `fk_enquiries_converted_booking` (`converted_booking_id`);

--
-- Indexes for table `tour_reviews`
--
ALTER TABLE `tour_reviews`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_reviews_booking_tour` (`booking_id`,`tour_id`),
  ADD KEY `idx_reviews_tour_status_created` (`tour_id`,`status`,`created_at`),
  ADD KEY `fk_reviews_booking` (`booking_id`),
  ADD KEY `fk_reviews_user` (`user_id`),
  ADD KEY `fk_reviews_moderator` (`moderated_by`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_users_email` (`email`),
  ADD KEY `idx_users_status_created` (`account_status`,`created_at`);

--
-- Indexes for table `user_action_tokens`
--
ALTER TABLE `user_action_tokens`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_user_action_tokens_hash` (`token_hash`),
  ADD KEY `idx_user_action_tokens_user_type` (`user_id`,`token_type`,`used_at`);

--
-- Indexes for table `user_roles`
--
ALTER TABLE `user_roles`
  ADD PRIMARY KEY (`user_id`,`role_id`),
  ADD KEY `idx_user_roles_role` (`role_id`),
  ADD KEY `fk_user_roles_assigner` (`assigned_by`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `admin_notifications`
--
ALTER TABLE `admin_notifications`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `audit_logs`
--
ALTER TABLE `audit_logs`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `blog_posts`
--
ALTER TABLE `blog_posts`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `bookings`
--
ALTER TABLE `bookings`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `booking_addons`
--
ALTER TABLE `booking_addons`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `booking_change_requests`
--
ALTER TABLE `booking_change_requests`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `booking_items`
--
ALTER TABLE `booking_items`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `booking_notes`
--
ALTER TABLE `booking_notes`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `booking_status_history`
--
ALTER TABLE `booking_status_history`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `booking_travelers`
--
ALTER TABLE `booking_travelers`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `gallery_items`
--
ALTER TABLE `gallery_items`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `notification_logs`
--
ALTER TABLE `notification_logs`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `notification_outbox`
--
ALTER TABLE `notification_outbox`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `notification_preferences`
--
ALTER TABLE `notification_preferences`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `notification_templates`
--
ALTER TABLE `notification_templates`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `payments`
--
ALTER TABLE `payments`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `permissions`
--
ALTER TABLE `permissions`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=21;

--
-- AUTO_INCREMENT for table `refresh_tokens`
--
ALTER TABLE `refresh_tokens`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `refunds`
--
ALTER TABLE `refunds`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `roles`
--
ALTER TABLE `roles`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- AUTO_INCREMENT for table `seat_holds`
--
ALTER TABLE `seat_holds`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `staff_assignments`
--
ALTER TABLE `staff_assignments`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `tours`
--
ALTER TABLE `tours`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `tour_addons`
--
ALTER TABLE `tour_addons`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `tour_departures`
--
ALTER TABLE `tour_departures`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `tour_enquiries`
--
ALTER TABLE `tour_enquiries`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `tour_reviews`
--
ALTER TABLE `tour_reviews`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `user_action_tokens`
--
ALTER TABLE `user_action_tokens`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `admin_notification_recipients`
--
ALTER TABLE `admin_notification_recipients`
  ADD CONSTRAINT `fk_admin_recipient_notification` FOREIGN KEY (`notification_id`) REFERENCES `admin_notifications` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_admin_recipient_user` FOREIGN KEY (`recipient_user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `admin_settings`
--
ALTER TABLE `admin_settings`
  ADD CONSTRAINT `fk_admin_settings_updated_by` FOREIGN KEY (`updated_by`) REFERENCES `users` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `audit_logs`
--
ALTER TABLE `audit_logs`
  ADD CONSTRAINT `fk_audit_actor` FOREIGN KEY (`actor_user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `blog_posts`
--
ALTER TABLE `blog_posts`
  ADD CONSTRAINT `fk_blog_posts_author` FOREIGN KEY (`author_user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `bookings`
--
ALTER TABLE `bookings`
  ADD CONSTRAINT `fk_bookings_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `booking_addons`
--
ALTER TABLE `booking_addons`
  ADD CONSTRAINT `fk_booking_addons_addon` FOREIGN KEY (`addon_id`) REFERENCES `tour_addons` (`id`),
  ADD CONSTRAINT `fk_booking_addons_item` FOREIGN KEY (`booking_item_id`) REFERENCES `booking_items` (`id`);

--
-- Constraints for table `booking_change_requests`
--
ALTER TABLE `booking_change_requests`
  ADD CONSTRAINT `fk_change_requests_booking` FOREIGN KEY (`booking_id`) REFERENCES `bookings` (`id`),
  ADD CONSTRAINT `fk_change_requests_requester` FOREIGN KEY (`requested_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `fk_change_requests_reviewer` FOREIGN KEY (`reviewed_by`) REFERENCES `users` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `booking_items`
--
ALTER TABLE `booking_items`
  ADD CONSTRAINT `fk_booking_items_booking` FOREIGN KEY (`booking_id`) REFERENCES `bookings` (`id`),
  ADD CONSTRAINT `fk_booking_items_departure` FOREIGN KEY (`departure_id`) REFERENCES `tour_departures` (`id`),
  ADD CONSTRAINT `fk_booking_items_tour` FOREIGN KEY (`tour_id`) REFERENCES `tours` (`id`);

--
-- Constraints for table `booking_notes`
--
ALTER TABLE `booking_notes`
  ADD CONSTRAINT `fk_booking_notes_admin` FOREIGN KEY (`admin_user_id`) REFERENCES `users` (`id`),
  ADD CONSTRAINT `fk_booking_notes_booking` FOREIGN KEY (`booking_id`) REFERENCES `bookings` (`id`);

--
-- Constraints for table `booking_status_history`
--
ALTER TABLE `booking_status_history`
  ADD CONSTRAINT `fk_booking_history_booking` FOREIGN KEY (`booking_id`) REFERENCES `bookings` (`id`),
  ADD CONSTRAINT `fk_booking_history_user` FOREIGN KEY (`changed_by_user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `booking_travelers`
--
ALTER TABLE `booking_travelers`
  ADD CONSTRAINT `fk_travelers_booking` FOREIGN KEY (`booking_id`) REFERENCES `bookings` (`id`);

--
-- Constraints for table `gallery_items`
--
ALTER TABLE `gallery_items`
  ADD CONSTRAINT `fk_gallery_creator` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `fk_gallery_tour` FOREIGN KEY (`tour_id`) REFERENCES `tours` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `notification_logs`
--
ALTER TABLE `notification_logs`
  ADD CONSTRAINT `fk_notification_logs_booking` FOREIGN KEY (`booking_id`) REFERENCES `bookings` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `notification_preferences`
--
ALTER TABLE `notification_preferences`
  ADD CONSTRAINT `fk_notification_preferences_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `payments`
--
ALTER TABLE `payments`
  ADD CONSTRAINT `fk_payments_booking` FOREIGN KEY (`booking_id`) REFERENCES `bookings` (`id`);

--
-- Constraints for table `refresh_tokens`
--
ALTER TABLE `refresh_tokens`
  ADD CONSTRAINT `fk_refresh_tokens_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `refunds`
--
ALTER TABLE `refunds`
  ADD CONSTRAINT `fk_refunds_payment` FOREIGN KEY (`payment_id`) REFERENCES `payments` (`id`),
  ADD CONSTRAINT `fk_refunds_processor` FOREIGN KEY (`processed_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `fk_refunds_requester` FOREIGN KEY (`requested_by`) REFERENCES `users` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `role_permissions`
--
ALTER TABLE `role_permissions`
  ADD CONSTRAINT `fk_role_permissions_permission` FOREIGN KEY (`permission_id`) REFERENCES `permissions` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_role_permissions_role` FOREIGN KEY (`role_id`) REFERENCES `roles` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `seat_holds`
--
ALTER TABLE `seat_holds`
  ADD CONSTRAINT `fk_seat_holds_booking` FOREIGN KEY (`booking_id`) REFERENCES `bookings` (`id`),
  ADD CONSTRAINT `fk_seat_holds_departure` FOREIGN KEY (`departure_id`) REFERENCES `tour_departures` (`id`);

--
-- Constraints for table `staff_assignments`
--
ALTER TABLE `staff_assignments`
  ADD CONSTRAINT `fk_staff_assignments_assigner` FOREIGN KEY (`assigned_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `fk_staff_assignments_staff` FOREIGN KEY (`staff_user_id`) REFERENCES `users` (`id`);

--
-- Constraints for table `tours`
--
ALTER TABLE `tours`
  ADD CONSTRAINT `fk_tours_created_by` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `fk_tours_updated_by` FOREIGN KEY (`updated_by`) REFERENCES `users` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `tour_addons`
--
ALTER TABLE `tour_addons`
  ADD CONSTRAINT `fk_addons_tour` FOREIGN KEY (`tour_id`) REFERENCES `tours` (`id`);

--
-- Constraints for table `tour_departures`
--
ALTER TABLE `tour_departures`
  ADD CONSTRAINT `fk_departures_tour` FOREIGN KEY (`tour_id`) REFERENCES `tours` (`id`);

--
-- Constraints for table `tour_enquiries`
--
ALTER TABLE `tour_enquiries`
  ADD CONSTRAINT `fk_enquiries_assignee` FOREIGN KEY (`assigned_to`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `fk_enquiries_converted_booking` FOREIGN KEY (`converted_booking_id`) REFERENCES `bookings` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `fk_enquiries_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `tour_reviews`
--
ALTER TABLE `tour_reviews`
  ADD CONSTRAINT `fk_reviews_booking` FOREIGN KEY (`booking_id`) REFERENCES `bookings` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `fk_reviews_moderator` FOREIGN KEY (`moderated_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `fk_reviews_tour` FOREIGN KEY (`tour_id`) REFERENCES `tours` (`id`),
  ADD CONSTRAINT `fk_reviews_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `user_action_tokens`
--
ALTER TABLE `user_action_tokens`
  ADD CONSTRAINT `fk_user_action_tokens_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `user_roles`
--
ALTER TABLE `user_roles`
  ADD CONSTRAINT `fk_user_roles_assigner` FOREIGN KEY (`assigned_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `fk_user_roles_role` FOREIGN KEY (`role_id`) REFERENCES `roles` (`id`),
  ADD CONSTRAINT `fk_user_roles_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;

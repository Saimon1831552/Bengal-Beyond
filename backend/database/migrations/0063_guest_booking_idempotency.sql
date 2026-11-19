ALTER TABLE `booking_idempotency_keys`
  MODIFY COLUMN `user_id` bigint(20) UNSIGNED DEFAULT NULL,
  ADD COLUMN `owner_user_id` bigint(20) UNSIGNED
    GENERATED ALWAYS AS (COALESCE(`user_id`, 0)) STORED,
  ADD UNIQUE KEY `uq_booking_idempotency_owner_key` (`owner_user_id`, `idempotency_key`);

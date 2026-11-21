SET @has_member_discount_amount = (
  SELECT COUNT(*)
    FROM information_schema.columns
   WHERE table_schema = DATABASE()
     AND table_name = 'bookings'
     AND column_name = 'member_discount_amount'
);

SET @member_discount_amount_ddl = IF(
  @has_member_discount_amount = 0,
  'ALTER TABLE `bookings` ADD COLUMN `member_discount_amount` DECIMAL(12,2) NOT NULL DEFAULT 0.00 AFTER `discount_amount`',
  'SELECT 1'
);

PREPARE member_discount_amount_stmt FROM @member_discount_amount_ddl;
EXECUTE member_discount_amount_stmt;
DEALLOCATE PREPARE member_discount_amount_stmt;

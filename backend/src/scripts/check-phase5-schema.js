const { pool, closePool } = require("../src/config/db");

const required = {
  destinations: ["id", "slug", "name"],
  tour_categories: ["id"],
  tour_tags: ["id"],
  wishlist_items: ["id", "user_id", "tour_id"],
  coupons: ["id", "code", "discount_type", "discount_value", "status"],
  coupon_redemptions: ["id", "coupon_id", "booking_id", "user_id", "discount_amount", "status"],
  support_tickets: ["id", "ticket_reference", "user_id", "status"],
  support_messages: ["id", "ticket_id", "sender_type", "message_text", "is_internal"],
  notification_templates: ["id", "template_key", "channel", "body_template"],
  notification_jobs: ["id", "channel", "recipient", "status", "idempotency_key"],
  notification_attempts: ["id", "job_id", "attempt_number", "outcome"]
};

async function main() {
  let failed = false;
  try {
    const [[db]] = await pool.execute("SELECT DATABASE() AS name, VERSION() AS version");
    console.log(`Database: ${db.name} | MariaDB/MySQL: ${db.version}`);
    for (const [table, columns] of Object.entries(required)) {
      const [rows] = await pool.execute(
        `SELECT COLUMN_NAME FROM information_schema.COLUMNS
          WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ?`, [table]);
      const actual = new Set(rows.map((row) => row.COLUMN_NAME));
      const missing = columns.filter((column) => !actual.has(column));
      if (!rows.length) {
        failed = true;
        console.error(`MISSING TABLE  ${table}`);
      } else if (missing.length) {
        failed = true;
        console.error(`MISSING COLUMNS ${table}: ${missing.join(", ")}`);
      } else {
        console.log(`OK             ${table}`);
      }
    }
    if (failed) process.exitCode = 1;
    else console.log("Phase 5 schema preflight passed.");
  } catch (error) {
    console.error("Schema preflight failed:", error.message);
    process.exitCode = 1;
  } finally {
    await closePool();
  }
}
main();

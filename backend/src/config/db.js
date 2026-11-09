const mysql = require("mysql2/promise");
const env = require("./env");

const pool = mysql.createPool({
  host: env.DB_HOST,
  port: env.DB_PORT,
  user: env.DB_USER,
  password: env.DB_PASSWORD,
  database: env.DB_NAME,

  waitForConnections: true,
  connectionLimit: env.DB_CONNECTION_LIMIT,
  queueLimit: 0,

  charset: "utf8mb4",
  timezone: "Z",
  enableKeepAlive: true,

  // DECIMAL columns (money) are returned as strings, e.g. "300.00".
  // Keep it that way; convert with a money helper, never parseFloat a total.
  decimalNumbers: false,

  // :name placeholders in SQL, handy for long INSERT/UPDATE statements.
  namedPlaceholders: true,

  // Never allow stacked queries; it turns any injection bug into a disaster.
  multipleStatements: false,
});

// Every connection speaks UTC. Without this, TIMESTAMP columns (created_at,
// updated_at) come back in the SERVER's timezone (Asia/Dhaka on many setups)
// and are then read as UTC by the driver, shifting every value by 6 hours.
pool.on("connection", (connection) => {
  connection.query("SET time_zone = '+00:00'");
});

async function testConnection() {
  const [rows] = await pool.query("SELECT 1 AS connected");
  return rows[0].connected === 1;
}

/**
 * Run `work(connection)` inside one transaction.
 * Commits if it resolves, rolls back and rethrows if it throws.
 * Always use `connection.execute/query` inside, never `pool`, or the
 * statements will run OUTSIDE the transaction.
 *
 *   const id = await withTransaction(async (conn) => {
 *     const [[dep]] = await conn.execute(
 *       "SELECT * FROM tour_departures WHERE id = ? FOR UPDATE", [departureId]
 *     );
 *     ...
 *   });
 */
async function withTransaction(work) {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();
    const result = await work(connection);
    await connection.commit();
    return result;
  } catch (error) {
    try {
      await connection.rollback();
    } catch (rollbackError) {
      // Keep the original error; the rollback failure is secondary.
    }
    throw error;
  } finally {
    connection.release();
  }
}

async function closePool() {
  await pool.end();
}

module.exports = {
  pool,
  testConnection,
  withTransaction,
  closePool,
};
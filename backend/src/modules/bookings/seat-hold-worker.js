const service = require("./booking.service");
let timer = null, running = false;
async function tick() {
  if (running) return;
  running = true;
  try { await service.expireHoldsBatch(500); }
  catch (e) { console.error("[seat-hold-worker] cleanup failed:", e.message); }
  finally { running = false; }
}
function start() {
  if (timer) return;
  const n = Number.parseInt(process.env.SEAT_HOLD_CLEANUP_INTERVAL_MS, 10);
  timer = setInterval(tick, Number.isInteger(n) ? Math.max(15000,n) : 60000);
  if (timer.unref) timer.unref();
}
function stop() { if (timer) clearInterval(timer); timer = null; }
module.exports = { start, stop, tick };

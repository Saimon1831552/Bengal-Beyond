const base = (process.env.API_BASE_URL || "http://127.0.0.1:5000").replace(/\/+$/, "");
async function check(path, expectedStatus = 200) {
  const response = await fetch(`${base}${path}`, { headers: { Accept: "application/json" } });
  const body = await response.text();
  if (response.status !== expectedStatus) {
    throw new Error(`${path}: expected HTTP ${expectedStatus}, received ${response.status}. Body: ${body.slice(0, 300)}`);
  }
  console.log(`OK ${response.status} ${path}`);
}
(async () => {
  try {
    await check("/api/health");
    await check("/api/health/ready");
    console.log("API liveness/readiness checks passed.");
  } catch (error) {
    console.error("API health check failed:", error.message);
    process.exitCode = 1;
  }
})();

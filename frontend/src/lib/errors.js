// Handles both error shapes this API returns: {error:{message,details}} and {message}
export function errMsg(err, fallback = "Something went wrong. Please try again.") {
  const d = err?.response?.data;
  if (!d) return err?.message === "Network Error" ? "Cannot reach the server. Check your connection." : fallback;
  const details = d.error?.details;
  if (Array.isArray(details) && details.length) return details.map((x) => x.message).join(" ");
  return d.error?.message || d.message || fallback;
}
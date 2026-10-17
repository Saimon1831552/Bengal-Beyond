const RESOURCE_PATHS = Object.freeze({
  booking: "bookings",
  payment: "payments",
  customer: "customers",
  user: "customers",
});

function resourceLink(entityType, entityId) {
  const path = RESOURCE_PATHS[entityType];
  if (!path || !/^[1-9]\d*$/.test(String(entityId || ""))) return null;

  return {
    type: entityType === "user" ? "customer" : entityType,
    id: String(entityId),
    href: `/admin/${path}/${entityId}`,
  };
}

module.exports = { resourceLink };

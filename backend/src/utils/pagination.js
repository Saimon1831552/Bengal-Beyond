// Use with validators/common.js `paginationQuery`.
function toOffset({ page, limit }) {
  return { limit, offset: (page - 1) * limit };
}

function paginationMeta({ page, limit, total }) {
  return { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) };
}

module.exports = { toOffset, paginationMeta };
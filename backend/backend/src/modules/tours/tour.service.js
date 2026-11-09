const AppError = require("../../utils/appError");
const repository = require("./tour.repository");
const { toOffset, paginationMeta } = require("../../utils/pagination");

async function listTours(filters) {
  const { limit, offset } = toOffset(filters);
  const { rows, total } = await repository.list(filters, { limit, offset });
  return { data: rows, meta: paginationMeta({ page: filters.page, limit, total }) };
}

async function getTour(slug) {
  const tour = await repository.findPublishedBySlug(slug);
  if (!tour) throw AppError.notFound("Tour not found.", "TOUR_NOT_FOUND");
  return tour;
}

module.exports = { listTours, getTour };

const AppError = require("../../utils/appError");
const repository = require("./admin-tour.repository");

function slugify(value) {
  return value.normalize("NFKD").toLowerCase().replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 180).replace(/-+$/g, "");
}
function makeSlug(data) {
  const result = data.slug || slugify(data.title);
  if (!result) throw AppError.badRequest("Provide a slug or a title that can be converted to a slug.", undefined, "INVALID_SLUG");
  return result;
}
async function assertSlugAvailable(slug, currentId) {
  const found = await repository.findBySlug(slug);
  if (found && Number(found.id) !== Number(currentId)) {
    throw AppError.conflict("That slug is already in use.", { field: "slug" }, "TOUR_SLUG_EXISTS");
  }
}
function normalizeCreate(data) {
  const normalized = { ...data, slug: makeSlug(data) };
  if (normalized.summary === undefined) normalized.summary = null;
  if (normalized.description === undefined) normalized.description = null;
  if (normalized.cover_image_url === undefined) normalized.cover_image_url = null;
  if (normalized.cancellation_policy === undefined) normalized.cancellation_policy = null;
  return normalized;
}
async function createTour(data, actorId) {
  const normalized = normalizeCreate(data);
  await assertSlugAvailable(normalized.slug);
  try { return await repository.create(normalized, actorId); }
  catch (error) {
    if (error.code === "ER_DUP_ENTRY") throw AppError.conflict("That slug is already in use.", { field: "slug" }, "TOUR_SLUG_EXISTS");
    throw error;
  }
}
async function updateTour(id, data, actorId) {
  const current = await repository.findById(id);
  if (!current) throw AppError.notFound("Tour not found.", "TOUR_NOT_FOUND");
  const normalized = { ...data };
  if (data.title && data.slug === undefined) normalized.slug = slugify(data.title);
  if (normalized.slug) await assertSlugAvailable(normalized.slug, id);
  try {
    const updated = await repository.update(id, normalized, actorId);
    if (!updated) throw AppError.notFound("Tour not found.", "TOUR_NOT_FOUND");
    return updated;
  } catch (error) {
    if (error.code === "ER_DUP_ENTRY") throw AppError.conflict("That slug is already in use.", { field: "slug" }, "TOUR_SLUG_EXISTS");
    throw error;
  }
}
async function changeStatus(id, status, actorId) {
  const current = await repository.findById(id);
  if (!current) throw AppError.notFound("Tour not found.", "TOUR_NOT_FOUND");
  const updated = await repository.updateStatus(id, status, actorId);
  if (!updated) throw AppError.notFound("Tour not found.", "TOUR_NOT_FOUND");
  return updated;
}
async function deleteTour(id, actorId) {
  const current = await repository.findById(id);
  if (!current) throw AppError.notFound("Tour not found.", "TOUR_NOT_FOUND");
  await repository.softDelete(id, actorId);
  return { id: Number(id), deleted: true };
}
module.exports = { createTour, updateTour, changeStatus, deleteTour };

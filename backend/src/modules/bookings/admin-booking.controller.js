const service = require("./admin-booking.service");
const { listQuery, statusBody, noteBody } = require("./admin-booking.schema");
const asyncHandler = require("../../utils/asynchandler");

function parse(schema, value) {
  const result = schema.safeParse(value);
  if (!result.success) {
    const AppError = require("../../utils/appError");
    throw AppError.validation(result.error.flatten());
  }
  return result.data;
}
const list = asyncHandler(async (req, res) => res.json({ success: true, data: await service.list(parse(listQuery, req.query)) }));
const get = asyncHandler(async (req, res) => res.json({ success: true, data: await service.get(Number(req.params.id)) }));
const changeStatus = asyncHandler(async (req, res) => res.json({ success: true, data: await service.changeStatus(Number(req.params.id), parse(statusBody, req.body), req.user || req.auth?.user) }));
const addNote = asyncHandler(async (req, res) => res.status(201).json({ success: true, data: await service.note(Number(req.params.id), parse(noteBody, req.body), req.user || req.auth?.user) }));
module.exports = { list, get, changeStatus, addNote };

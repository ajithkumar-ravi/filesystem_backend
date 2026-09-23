const fileService = require('../services/fileService');
const { AppError } = require('../utils/fileUtils');

const DEFAULT_OWNER = 'Ajith';

// Wraps async handlers so thrown errors reach the error middleware.
function asyncHandler(fn) {
  return (req, res, next) => fn(req, res, next).catch(next);
}

const getChildren = asyncHandler(async (req, res) => {
    const { parentId } = req.query;
  const items = await fileService.getChildren(parentId ? Number(parentId) : null);
  res.status(200).json(items);
});

const getOne = asyncHandler(async (req, res) => {
  const item = await fileService.getById(Number(req.params.id));
    const breadcrumb = await fileService.getBreadcrumb(item.id);
  res.status(200).json({ ...item, breadcrumb });
});

const createItem = asyncHandler(async (req, res) => {
  const { name, type, parentId, owner, content } = req.body;

  if (!type || !fileService.isValidType(type)) {
    throw new AppError('Unsupported or missing type', 400);
  }

  let created;
  if (type === 'folder') {
    created = await fileService.createFolder({
      name,
      parentId: parentId ?? null,
      owner: owner || DEFAULT_OWNER
    });
  } else {
    created = await fileService.createFile({
      name,
      type,
      parentId: parentId ?? null,
      owner: owner || DEFAULT_OWNER,
      content
    });
  }

  res.status(201).json(created);
});

const updateItem = asyncHandler(async (req, res) => {
  const { name, type, content } = req.body;
  const updated = await fileService.updateItem(Number(req.params.id), { name, type, content });
  res.status(200).json(updated);
});

const moveItem = asyncHandler(async (req, res) => {
  const { parentId } = req.body;
  const moved = await fileService.moveItem(Number(req.params.id), parentId ?? null);
  res.status(200).json(moved);
});

const deleteItem = asyncHandler(async (req, res) => {
  await fileService.deleteItem(Number(req.params.id));
  res.status(204).send();
});

module.exports = {
  getChildren,
  getOne,
  createItem,
  updateItem,
  moveItem,
  deleteItem
};

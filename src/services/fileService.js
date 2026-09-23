const pool = require('../config/db');
const {
  AppError,
  buildFileName,
  isValidType,
  isValidFileType
} = require('../utils/fileUtils');

// Confirms a parent_id points to an existing folder (or is null = root).
async function assertValidParent(parentId) {
  if (parentId === null || parentId === undefined) return;
  const [rows] = await pool.query(
    'SELECT id, type FROM files WHERE id = ?',
    [parentId]
  );
  if (rows.length === 0) {
    throw new AppError('Parent folder not found', 404);
  }
  if (rows[0].type !== 'folder') {
    throw new AppError('Parent must be a folder', 400);
  }
}

// Ensures no sibling in the target folder already has this name.
async function assertNoDuplicateName(name, parentId, excludeId = null) {
  let query = 'SELECT id FROM files WHERE name = ? AND ';
  const params = [name];

  if (parentId === null || parentId === undefined) {
    query += 'parent_id IS NULL';
  } else {
    query += 'parent_id = ?';
    params.push(parentId);
  }

  if (excludeId) {
    query += ' AND id != ?';
    params.push(excludeId);
  }

  const [rows] = await pool.query(query, params);
  if (rows.length > 0) {
    throw new AppError('An item with this name already exists in this folder', 409);
  }
}

async function getById(id) {
  const [rows] = await pool.query('SELECT * FROM files WHERE id = ?', [id]);
  if (rows.length === 0) {
    throw new AppError('Item not found', 404);
  }
  return rows[0];
}

async function getChildren(parentId) {
  let query;
  const params = [];

  if (parentId === null || parentId === undefined) {
    query = 'SELECT * FROM files WHERE parent_id IS NULL ORDER BY type != "folder", name ASC';
  } else {
    // Confirm the folder itself exists first.
    await getById(parentId);
    query = 'SELECT * FROM files WHERE parent_id = ? ORDER BY type != "folder", name ASC';
    params.push(parentId);
  }

  const [rows] = await pool.query(query, params);
  return rows;
}

// Builds the breadcrumb chain from root down to the given item (inclusive).
async function getBreadcrumb(id) {
  const chain = [];
  let currentId = id;

  while (currentId !== null && currentId !== undefined) {
    const item = await getById(currentId);
    chain.unshift({ id: item.id, name: item.name, type: item.type });
    currentId = item.parent_id;
  }

  return chain;
}

async function createFolder({ name, parentId, owner }) {
  if (!name || !name.trim()) {
    throw new AppError('Folder name is required', 400);
  }
  const cleanName = name.trim();

  await assertValidParent(parentId ?? null);
  await assertNoDuplicateName(cleanName, parentId ?? null);

  const [result] = await pool.query(
    'INSERT INTO files (name, type, parent_id, content, owner) VALUES (?, "folder", ?, NULL, ?)',
    [cleanName, parentId ?? null, owner]
  );

  return getById(result.insertId);
}

async function createFile({ name, type, parentId, owner, content }) {
  if (!name || !name.trim()) {
    throw new AppError('File name is required', 400);
  }
  if (!isValidFileType(type)) {
    throw new AppError('Unsupported file type', 400);
  }

  await assertValidParent(parentId ?? null);

  const finalName = buildFileName(name, type);
  await assertNoDuplicateName(finalName, parentId ?? null);

  const [result] = await pool.query(
    'INSERT INTO files (name, type, parent_id, content, owner) VALUES (?, ?, ?, ?, ?)',
    [finalName, type, parentId ?? null, content ?? null, owner]
  );

  return getById(result.insertId);
}

// Handles rename + type change + content update in one PUT.
async function updateItem(id, { name, type, content }) {
  const item = await getById(id);

  let finalName = item.name;
  let finalType = item.type;

  if (item.type === 'folder') {
    if (name && name.trim()) {
      finalName = name.trim();
    }
    // Folders cannot change type.
  } else {
    const newType = type && isValidFileType(type) ? type : item.type;
    if (type && !isValidFileType(type)) {
      throw new AppError('Unsupported file type', 400);
    }
    const baseName = name && name.trim() ? name : item.name;
    finalName = buildFileName(baseName, newType);
    finalType = newType;
  }

  if (finalName !== item.name || finalType !== item.type) {
    await assertNoDuplicateName(finalName, item.parent_id, id);
  }

  const finalContent = content !== undefined ? content : item.content;

  await pool.query(
    'UPDATE files SET name = ?, type = ?, content = ? WHERE id = ?',
    [finalName, finalType, item.type === 'folder' ? null : finalContent, id]
  );

  return getById(id);
}

// Recursively checks whether `possibleAncestorId` is the same as or an
// ancestor of `nodeId`, to block moving a folder into itself/its descendant.
async function isSelfOrDescendant(nodeId, targetId) {
  if (Number(nodeId) === Number(targetId)) return true;

  let currentId = targetId;
  while (currentId !== null && currentId !== undefined) {
    const [rows] = await pool.query('SELECT parent_id FROM files WHERE id = ?', [currentId]);
    if (rows.length === 0) return false;
    if (Number(rows[0].parent_id) === Number(nodeId)) return true;
    currentId = rows[0].parent_id;
  }
  return false;
}

async function moveItem(id, parentId) {
  const item = await getById(id);
  const destinationId = parentId ?? null;

  if (destinationId !== null) {
    await assertValidParent(destinationId);

    if (item.type === 'folder') {
      const invalid = await isSelfOrDescendant(item.id, destinationId);
      if (invalid) {
        throw new AppError('Cannot move a folder into itself or its own subfolder', 400);
      }
    }
  }

  if (Number(item.parent_id) === Number(destinationId) ||
      (item.parent_id === null && destinationId === null)) {
    throw new AppError('Item is already in this folder', 400);
  }

  await assertNoDuplicateName(item.name, destinationId, id);

  await pool.query('UPDATE files SET parent_id = ? WHERE id = ?', [destinationId, id]);

  return getById(id);
}

async function deleteItem(id) {
  await getById(id); // 404s if missing
  // ON DELETE CASCADE on parent_id handles removing descendants.
  await pool.query('DELETE FROM files WHERE id = ?', [id]);
}

module.exports = {
  getById,
  getChildren,
  getBreadcrumb,
  createFolder,
  createFile,
  updateItem,
  moveItem,
  deleteItem,
  isValidType
};

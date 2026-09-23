const EXTENSIONS = {
  text: '.txt',
  docx: '.docx',
  json: '.json',
  pdf: '.pdf'
};

const VALID_TYPES = ['folder', 'text', 'docx', 'json', 'pdf'];
const VALID_FILE_TYPES = ['text', 'docx', 'json', 'pdf'];

class AppError extends Error {
  constructor(message, statusCode = 400) {
    super(message);
    this.statusCode = statusCode;
  }
}

// Strips any extension the user may have typed and returns the base name.
function stripKnownExtension(name) {
  for (const ext of Object.values(EXTENSIONS)) {
    if (name.toLowerCase().endsWith(ext)) {
      return name.slice(0, name.length - ext.length);
    }
  }
  return name;
}

function validateName(name) {
  if (!name || typeof name !== 'string') {
    throw new AppError('Name is required', 400);
  }
  const clean = name.trim();
  if (!clean) {
    throw new AppError('Name cannot be empty', 400);
  }
  if (clean.length > 200) {
    throw new AppError('Name is too long (maximum 200 characters)', 400);
  }
  return clean;
}

// Builds the final display name for a file based on base name + type.
function buildFileName(baseName, type) {
  const clean = stripKnownExtension(baseName.trim());
  return `${clean}${EXTENSIONS[type]}`;
}

function isValidType(type) {
  return VALID_TYPES.includes(type);
}

function isValidFileType(type) {
  return VALID_FILE_TYPES.includes(type);
}

module.exports = {
  EXTENSIONS,
  VALID_TYPES,
  VALID_FILE_TYPES,
  AppError,
  validateName,
  buildFileName,
  isValidType,
  isValidFileType
};

const axios = require('axios');
const FormData = require('form-data');

const API_URL = process.env.SPIDER_API_URL;
const API_KEY = process.env.SPIDER_API_KEY;
const DB_NAME = process.env.SPIDER_DB;
const STORAGE_PROJECT = process.env.SPIDER_STORAGE_PROJECT;

const baseHeaders = { 'X-API-KEY': API_KEY };

/**
 * Escape a value for safe SQL insertion
 */
function esc(value) {
  if (value === null || value === undefined) return 'NULL';
  if (typeof value === 'number') return value;
  if (typeof value === 'boolean') return value ? 1 : 0;
  return "'" + String(value).replace(/'/g, "''") + "'";
}

/**
 * Execute a SQL query against the Spider API
 * Returns normalized result rows for SELECT, or { changes, lastId } for mutations
 */
async function query(sql) {
  try {
    const response = await axios.post(
      `${API_URL}/query`,
      { database: DB_NAME, query: sql },
      { headers: { ...baseHeaders, 'Content-Type': 'application/json' } }
    );

    const data = response.data;

    // Normalize response
    if (data && data.success) {
      const result = data.result;
      if (Array.isArray(result)) return result;
      if (result && typeof result === 'object') return result;
      return result;
    }

    throw new Error(data.error || 'Query failed');
  } catch (err) {
    if (err.response) {
      throw new Error(`Spider API Error: ${JSON.stringify(err.response.data)}`);
    }
    throw err;
  }
}

/**
 * Upload a file to Spider API storage
 * Returns file object with id, name, etc.
 */
async function uploadFile(buffer, filename, mimetype) {
  const form = new FormData();
  form.append('files', buffer, { filename, contentType: mimetype });

  const response = await axios.post(
    `${API_URL}/storage/projects/${STORAGE_PROJECT}/files`,
    form,
    { headers: { ...baseHeaders, ...form.getHeaders() } }
  );

  const data = response.data;

  // Normalize: could be array, or { files: [...] }, or { success, files: [...] }
  let files = [];
  if (Array.isArray(data)) files = data;
  else if (data.files && Array.isArray(data.files)) files = data.files;
  else if (data.result && Array.isArray(data.result)) files = data.result;

  if (files.length > 0) return files[0];
  throw new Error('Upload failed: no file returned');
}

/**
 * Delete a file from storage
 */
async function deleteFile(fileId) {
  try {
    const response = await axios.delete(
      `${API_URL}/storage/files/${fileId}`,
      { headers: baseHeaders }
    );
    return response.data;
  } catch (err) {
    console.warn('Could not delete file', fileId, err.message);
  }
}

/**
 * Get file info
 */
async function getFileInfo(fileId) {
  const response = await axios.get(
    `${API_URL}/storage/files/${fileId}/info`,
    { headers: baseHeaders }
  );
  return response.data;
}

/**
 * Stream a file (for proxy route)
 */
async function getFileStream(fileId) {
  return axios.get(
    `${API_URL}/storage/files/${fileId}`,
    { headers: baseHeaders, responseType: 'stream' }
  );
}

module.exports = { query, uploadFile, deleteFile, getFileInfo, getFileStream, esc };

import { Platform } from 'react-native';
import { Directory, File, Paths } from 'expo-file-system';
import * as DocumentPicker from 'expo-document-picker';
import * as Sharing from 'expo-sharing';

const CSV_MIME_TYPES = [
  'text/csv',
  'text/comma-separated-values',
  'text/plain',
  'application/csv',
  'application/vnd.ms-excel',
  'application/octet-stream',
];

const MAX_FILE_BYTES = 10 * 1024 * 1024; // 10 MB

export class FileServiceError extends Error {
  constructor(message) {
    super(message);
    this.name = 'FileServiceError';
  }
}

function extensionOf(name = '') {
  const idx = name.lastIndexOf('.');
  return idx === -1 ? '' : name.slice(idx + 1).toLowerCase();
}

export function formatBytes(bytes) {
  if (typeof bytes !== 'number' || Number.isNaN(bytes)) return 'Unknown size';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

/**
 * `expo-file-system` is native-only, so the browser reads the picked blob URL
 * through `fetch` instead. TaskFlow targets iOS/Android but stays testable on web.
 */
async function readTextFile(uri) {
  if (Platform.OS === 'web') {
    const response = await fetch(uri);
    if (!response.ok) throw new Error(`Unexpected status ${response.status}`);
    return response.text();
  }
  try {
    return await new File(uri).text();
  } catch {
    try {
      const { readAsStringAsync } = await import('expo-file-system/legacy');
      return await readAsStringAsync(uri);
    } catch {
      const response = await fetch(uri);
      return await response.text();
    }
  }
}

export async function pickCsvFile() {
  let result;
  try {
    result = await DocumentPicker.getDocumentAsync({
      type: CSV_MIME_TYPES,
      multiple: false,
      copyToCacheDirectory: true,
    });
  } catch {
    throw new FileServiceError('The file picker could not be opened. Please try again.');
  }

  if (result.canceled) {
    return null;
  }

  const asset = result.assets?.[0];
  if (!asset?.uri) {
    throw new FileServiceError('The selected file could not be read.');
  }

  if (typeof asset.size === 'number' && asset.size > MAX_FILE_BYTES) {
    throw new FileServiceError(
      `That file is ${formatBytes(asset.size)}. Please choose a CSV smaller than ${formatBytes(MAX_FILE_BYTES)}.`
    );
  }

  const ext = extensionOf(asset.name);
  if (ext && ext !== 'csv' && ext !== 'txt') {
    throw new FileServiceError(`"${asset.name}" is not a CSV file. Please select a .csv file.`);
  }

  let content;
  try {
    content = await readTextFile(asset.uri);
  } catch {
    throw new FileServiceError(`"${asset.name}" could not be opened. It may be corrupted or in an unsupported format.`);
  }

  return {
    content,
    meta: {
      name: asset.name,
      size: asset.size,
      uri: asset.uri,
      mimeType: asset.mimeType,
      extension: ext || 'csv',
      modifiedAt: asset.lastModified,
    },
  };
}

function timestampSlug() {
  const now = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}-${pad(now.getHours())}${pad(
    now.getMinutes()
  )}${pad(now.getSeconds())}`;
}

export async function writeCsvToCache(fileName, content) {
  const directory = new Directory(Paths.cache, 'exports');
  if (!directory.exists) {
    directory.create({ intermediates: true, idempotent: true });
  }

  const target = new File(directory, fileName);
  if (target.exists) {
    target.delete();
  }
  target.create();
  target.write(content);

  return target;
}

export async function shareCsvFile(fileName, content) {
  if (Platform.OS === 'web') {
    downloadInBrowser(fileName, content);
    return { uri: fileName };
  }

  const file = await writeCsvToCache(fileName, content);
  const available = await Sharing.isAvailableAsync();
  if (!available) {
    throw new FileServiceError(`Sharing is not available on this device. The file was saved at ${file.uri}`);
  }
  await Sharing.shareAsync(file.uri, {
    mimeType: 'text/csv',
    dialogTitle: 'Export TaskFlow tasks',
    UTI: 'public.comma-separated-values-text',
  });
  return file;
}

function downloadInBrowser(fileName, content) {
  if (typeof document === 'undefined') return;
  const blob = new Blob([content], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

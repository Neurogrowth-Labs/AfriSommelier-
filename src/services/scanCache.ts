export interface CachedScan {
  id: string; // unique scan ID or timestamp
  timestamp: number;
  mode: 'label' | 'menu' | 'winelist';
  previewUrl: string;
  result: any;
  barcode?: string;
}

const DB_NAME = 'EnoviqScanCacheDB';
const DB_VERSION = 1;
const STORE_NAME = 'scans';

export function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };
  });
}

export async function saveScanToCache(scan: Omit<CachedScan, 'id'>): Promise<string> {
  try {
    const db = await openDB();
    const id = Date.now().toString();
    const fullScan: CachedScan = { ...scan, id };
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.add(fullScan);
      request.onsuccess = () => resolve(id);
      request.onerror = () => reject(request.error);
    });
  } catch (err) {
    console.error('IndexedDB save failed, falling back to localStorage', err);
    const id = Date.now().toString();
    const cachedScan = { ...scan, id };
    const list = JSON.parse(localStorage.getItem('enoviq_scans') || '[]');
    list.unshift(cachedScan);
    localStorage.setItem('enoviq_scans', JSON.stringify(list.slice(0, 50)));
    return id;
  }
}

export async function getScanHistory(): Promise<CachedScan[]> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.getAll();
      request.onsuccess = () => {
        const results = request.result as CachedScan[];
        results.sort((a, b) => b.timestamp - a.timestamp);
        resolve(results);
      };
      request.onerror = () => reject(request.error);
    });
  } catch (err) {
    console.error('IndexedDB read failed, falling back to localStorage', err);
    return JSON.parse(localStorage.getItem('enoviq_scans') || '[]');
  }
}

export async function clearScanHistory(): Promise<void> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.clear();
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } catch (err) {
    localStorage.removeItem('enoviq_scans');
  }
}

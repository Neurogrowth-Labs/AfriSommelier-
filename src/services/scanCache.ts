import { supabase } from '../supabase';

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
  let id = Date.now().toString();

  // 1. Attempt to save to Supabase if the user is authenticated
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data, error } = await supabase.from('scans').insert({
        user_id: user.id,
        timestamp: scan.timestamp,
        mode: scan.mode,
        preview_url: scan.previewUrl,
        result: scan.result,
        barcode: scan.barcode || null
      }).select().single();

      if (!error && data) {
        id = data.id;
      } else if (error) {
        console.warn("[scanCache] Supabase insert failed, using offline fallback:", error);
      }
    }
  } catch (supabaseErr) {
    console.warn("[scanCache] Supabase connection failed during save:", supabaseErr);
  }

  // 2. Always save to local IndexedDB (or localStorage) as an offline copy / cache layer
  try {
    const db = await openDB();
    const fullScan: CachedScan = { ...scan, id };
    
    await new Promise<void>((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.add(fullScan);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
    return id;
  } catch (err) {
    console.error('IndexedDB save failed, falling back to localStorage', err);
    const cachedScan = { ...scan, id };
    const list = JSON.parse(localStorage.getItem('enoviq_scans') || '[]');
    list.unshift(cachedScan);
    localStorage.setItem('enoviq_scans', JSON.stringify(list.slice(0, 50)));
    return id;
  }
}

export async function getScanHistory(): Promise<CachedScan[]> {
  // 1. Attempt to fetch from Supabase if the user is authenticated
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data, error } = await supabase
        .from('scans')
        .select('*')
        .order('timestamp', { ascending: false });

      if (!error && data) {
        const remoteScans: CachedScan[] = data.map((d: any) => ({
          id: d.id,
          timestamp: Number(d.timestamp),
          mode: d.mode as 'label' | 'menu' | 'winelist',
          previewUrl: d.preview_url,
          result: d.result,
          barcode: d.barcode || undefined
        }));

        // Keep local cache in sync with the fetched remote scans
        try {
          const db = await openDB();
          const transaction = db.transaction(STORE_NAME, 'readwrite');
          const store = transaction.objectStore(STORE_NAME);
          store.clear();
          for (const s of remoteScans) {
            store.put(s);
          }
        } catch (dbErr) {
          console.warn("[scanCache] Failed to sync local IndexedDB cache with remote database:", dbErr);
        }

        return remoteScans;
      } else if (error) {
        console.warn("[scanCache] Supabase select failed, falling back to local storage:", error);
      }
    }
  } catch (supabaseErr) {
    console.warn("[scanCache] Supabase connection failed during fetch:", supabaseErr);
  }

  // 2. Local Fallback (IndexedDB / localStorage)
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
  // 1. Attempt to delete from Supabase if authenticated
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { error } = await supabase
        .from('scans')
        .delete()
        .eq('user_id', user.id);

      if (error) {
        console.warn("[scanCache] Supabase delete history failed:", error);
      }
    }
  } catch (supabaseErr) {
    console.warn("[scanCache] Supabase connection failed during clear history:", supabaseErr);
  }

  // 2. Always clear local cache as well
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

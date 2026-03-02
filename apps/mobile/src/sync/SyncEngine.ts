import { AppState, AppStateStatus } from 'react-native';
import Constants from 'expo-constants';
import { useAuthStore } from '../store/authStore';
import { useInventoryStore } from '../store/inventoryStore';
import { localItems, localRef, syncQueue } from '../services/LocalDB';
import { syncApi } from '../services/api';
import type { PendingSyncItem, SyncPayload } from '@starlight/shared';

const DEVICE_ID = Constants.deviceId || Constants.installationId || 'unknown-device';
const LAST_SYNC_KEY = 'last_sync_at';
let syncInProgress = false;

export async function runSync(): Promise<{ success: boolean; message: string }> {
  if (syncInProgress) {
    return { success: false, message: 'Sync already in progress' };
  }

  const { isAuthenticated } = useAuthStore.getState();
  if (!isAuthenticated) {
    return { success: false, message: 'Not authenticated' };
  }

  syncInProgress = true;

  try {
    // Build pending queue
    const pending = syncQueue.getPending();
    const pendingItems: PendingSyncItem[] = pending
      .filter((p) => p.entity_type === 'item')
      .map((p) => ({
        local_id: p.entity_id,
        action: p.action as 'create' | 'update' | 'delete',
        data: JSON.parse(p.data) as Record<string, unknown>,
        updated_at: p.updated_at,
      }));

    const lastSyncAt = getLastSyncAt();

    const payload: SyncPayload = {
      device_id: DEVICE_ID,
      last_sync_at: lastSyncAt || new Date(0).toISOString(),
      pending_items: pendingItems,
      pending_assignments: [],
    };

    const response = await syncApi.sync(payload);
    const syncData = response.data;

    if (!syncData) {
      return { success: false, message: 'Empty sync response' };
    }

    // Apply server delta to local DB
    if (syncData.items.length > 0) {
      localItems.upsertMany(syncData.items);
    }

    if (syncData.categories.length > 0) {
      localRef.upsertCategories(syncData.categories);
    }

    if (syncData.departments.length > 0) {
      localRef.upsertDepartments(syncData.departments);
    }

    if (syncData.locations.length > 0) {
      localRef.upsertLocations(syncData.locations);
    }

    // Update Zustand store
    const { setItems, setCategories, setDepartments, setLocations, setLastSyncAt } =
      useInventoryStore.getState();

    const allItems = localItems.getAll();
    setItems(allItems);
    setCategories(localRef.getCategories());
    setDepartments(localRef.getDepartments());
    setLocations(localRef.getLocations());

    // Clear synced queue items
    syncQueue.clear();

    // Save sync time
    const serverTime = syncData.server_time;
    saveLastSyncAt(serverTime);
    setLastSyncAt(serverTime);

    return {
      success: true,
      message: `Synced ${syncData.items.length} items`,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Sync failed';
    console.error('Sync error:', message);
    return { success: false, message };
  } finally {
    syncInProgress = false;
  }
}

// ─── AppState listener ───────────────────────────────────────

let appStateSubscription: ReturnType<typeof AppState.addEventListener> | null = null;

export function startSyncListener(): void {
  if (appStateSubscription) return;

  appStateSubscription = AppState.addEventListener(
    'change',
    (nextState: AppStateStatus) => {
      if (nextState === 'active') {
        // Trigger sync when app comes to foreground
        void runSync();
      }
    }
  );
}

export function stopSyncListener(): void {
  appStateSubscription?.remove();
  appStateSubscription = null;
}

// ─── Persistence helpers ─────────────────────────────────────

function saveLastSyncAt(time: string): void {
  try {
    // In RN, use a simple in-memory map (no localStorage)
    lastSyncAtCache = time;
  } catch { /* ignore */ }
}

function getLastSyncAt(): string | null {
  return lastSyncAtCache;
}

let lastSyncAtCache: string | null = null;

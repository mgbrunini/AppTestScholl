import NetInfo, { NetInfoState } from '@react-native-community/netinfo';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api } from './api';

const OFFLINE_QUEUE_KEY = 'offline_actions_queue';
const CACHE_PREFIX = 'offline_cache_';

interface OfflineAction {
    id: string;
    action: string;
    payload: any;
    timestamp: number;
}

type Listener = (isConnected: boolean) => void;

class OfflineService {
    private static instance: OfflineService;
    private isConnected: boolean = true;
    private listeners: Listener[] = [];
    private queue: OfflineAction[] = [];
    private isProcessing: boolean = false;

    private constructor() { }

    public static getInstance(): OfflineService {
        if (!OfflineService.instance) {
            OfflineService.instance = new OfflineService();
        }
        return OfflineService.instance;
    }

    public async init() {
        // Load queue from storage
        await this.loadQueue();

        // Subscribe to network updates
        NetInfo.addEventListener((state: NetInfoState) => {
            const connected = state.isConnected ?? false;
            console.log(`[OfflineService] Network state changed: ${connected ? 'Online' : 'Offline'}`);

            if (this.isConnected !== connected) {
                this.isConnected = connected;
                this.notifyListeners();

                if (connected) {
                    this.processQueue();
                }
            }
        });

        // Initial check
        const state = await NetInfo.fetch();
        this.isConnected = state.isConnected ?? false;
        if (this.isConnected) {
            this.processQueue();
        }
    }

    public getIsConnected(): boolean {
        return this.isConnected;
    }

    public subscribe(listener: Listener) {
        this.listeners.push(listener);
        listener(this.isConnected); // Initial call
        return () => {
            this.listeners = this.listeners.filter(l => l !== listener);
        };
    }

    private notifyListeners() {
        this.listeners.forEach(l => l(this.isConnected));
    }

    public async addToQueue(action: string, payload: any) {
        const item: OfflineAction = {
            id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
            action,
            payload,
            timestamp: Date.now(),
        };
        this.queue.push(item);
        await this.saveQueue();
        console.log(`[OfflineService] Action added to queue: ${action}`, item);
    }

    private async loadQueue() {
        try {
            const json = await AsyncStorage.getItem(OFFLINE_QUEUE_KEY);
            if (json) {
                this.queue = JSON.parse(json);
                console.log(`[OfflineService] Queue loaded with ${this.queue.length} items`);
            }
        } catch (e) {
            console.error('[OfflineService] Error loading queue:', e);
        }
    }

    private async saveQueue() {
        try {
            await AsyncStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(this.queue));
        } catch (e) {
            console.error('[OfflineService] Error saving queue:', e);
        }
    }

    public async processQueue() {
        if (this.isProcessing || this.queue.length === 0 || !this.isConnected) return;

        this.isProcessing = true;
        console.log('[OfflineService] Starting queue processing...');

        const queueCopy = [...this.queue];
        const failedItems: OfflineAction[] = [];

        for (const item of queueCopy) {
            try {
                console.log(`[OfflineService] Processing item: ${item.action}`, item.payload);
                // Specifically handle known actions. 
                // Since api methods are async, we call the raw post or specific methods if needed.
                // Here we use api.post directly to avoid circular dependency loop if we called api.saveCalificacion
                // But api.ts imports this service, so we need to be careful with imports.
                // Ideally, api.ts uses this service, so this service should just call the raw fetch or a base method.
                // However, api.post is not exported in a way we can just reuse easily without the instance? 
                // api is an object exported from api.ts. We can import it.

                // IMPORTANT: We need to make sure api.post doesn't try to queue it again.
                // We'll add a flag to the payload or modify api.post to accept a "force" flag?
                // Or simply, api.post logic will check IsConnected. If we are processing, we ARE connected.
                // Whatever called api.ts originally will be intercepted.
                // The re-try here should probably go directly to the network fetch if possible, 
                // or we use api.post but we need to trust that isConnected is true.

                const response = await api.post(item.action, item.payload);

                if (!response.ok && response.msg !== 'Error de conexión con el servidor') {
                    // If it's a logic error, maybe we shouldn't retry? 
                    // For now, let's assume if it fails, we assume it might be temporary or we log it.
                    // If it is a permanent error, we might want to discard it.
                    console.warn(`[OfflineService] Item failed: ${item.id}`, response);
                } else if (!response.ok) {
                    // Network error, keep it?
                    // But we checked isConnected. Maybe detailed check failed.
                    failedItems.push(item);
                }

            } catch (error) {
                console.error(`[OfflineService] Error processing item ${item.id}:`, error);
                failedItems.push(item); // Keep it to retry later
            }
        }

        this.queue = failedItems;
        await this.saveQueue();
        this.isProcessing = false;
        console.log('[OfflineService] Queue processing finished. Remaining items:', this.queue.length);

        if (this.queue.length > 0 && this.isConnected) {
            // Maybe retry in a bit if we still have items and think we are online
            setTimeout(() => this.processQueue(), 10000);
        }
    }

    // Caching methods
    public async getCachedResponse(key: string): Promise<any | null> {
        try {
            const cacheKey = `${CACHE_PREFIX}${key}`;
            const json = await AsyncStorage.getItem(cacheKey);
            if (json) {
                console.log(`[OfflineService] Cache hit for ${key}`);
                return JSON.parse(json);
            }
        } catch (e) {
            console.error('[OfflineService] Error reading cache:', e);
        }
        return null;
    }

    public async saveCachedResponse(key: string, data: any) {
        try {
            const cacheKey = `${CACHE_PREFIX}${key}`;
            await AsyncStorage.setItem(cacheKey, JSON.stringify(data));
            console.log(`[OfflineService] Cache saved for ${key}`);
        } catch (e) {
            console.error('[OfflineService] Error saving cache:', e);
        }
    }
}

export default OfflineService.getInstance();

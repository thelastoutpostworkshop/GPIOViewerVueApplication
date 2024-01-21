import { ref, computed } from 'vue';
import { gpioStore } from '@/stores/gpiostore'


export function getAPIUrl(api: string): string {
    const store = gpioStore();
    const url = `http://${store.ipAddress}:${store.httpPort}/${api}`;
    return url;
}

export function formatBytes(bytes: number | undefined): string {
    if (bytes) {
        if (bytes < 1024) {
            return `${bytes} B`;
        } else if (bytes < 1024 * 1024) {
            return `${(bytes / 1024).toFixed(2)} KB`;
        } else {
            return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
        }
    }
    return "undefined";
}
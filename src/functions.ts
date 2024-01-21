import { ref, computed } from 'vue';
import { gpioStore } from '@/stores/gpiostore'


export function getAPIUrl(api:string):string {
    const store = gpioStore();
    const url = `http://${store.ipAddress}:${store.httpPort}/${api}`;
    return url;
}

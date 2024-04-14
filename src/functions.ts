import { gpioStore } from '@/stores/gpiostore'
import { type Pins } from '@/types/types';
import {PinModeValue} from '@/const'


export const PinModeBroad = {
    OUTPUT:'O',
    INPUT:'I',
    UNKNOWN:'-'
} as const

export type PinModeKeys = keyof typeof PinModeValue;

export const PinModeDescription: { [key in PinModeKeys]: string } = {
    NOT_SET: "Not set",
    UNAVAILABLE:"Unavailable",
    OUTPUT: "Output",
    PULLUP: "Pull-up",
    INPUT_PULLUP: "Input with Pull-up",
    PULLDOWN: "Pull-down",
    INPUT_PULLDOWN: "Input with Pull-down",
    OPEN_DRAIN: "Open Drain",
    OUTPUT_OPEN_DRAIN: "Output Open Drain",
    ANALOG: "Analog",
};

export const pinMode = (pin: Pins): string => {
    const store = gpioStore();
    let mode: number = 0;
    let modeID:string = PinModeBroad.UNKNOWN
    if (pin.displayType === 'P') {
        mode = PinModeValue.OUTPUT
    } else {
        mode = store.getPinModeValue(pin.gpioid);
    }
    switch (mode) {
        case PinModeValue.OUTPUT_OPEN_DRAIN:
        case PinModeValue.OUTPUT:
            modeID = PinModeBroad.OUTPUT
            break;
        case PinModeValue.INPUT_PULLDOWN:
        case PinModeValue.INPUT_PULLUP:
            modeID = PinModeBroad.INPUT
            break;
    }
    return modeID
};

export const ValueToKeyMap: { [value: number]: PinModeKeys } = Object.entries(PinModeValue).reduce((acc, [key, value]) => {
    acc[value as number] = key as PinModeKeys;
    return acc;
}, {} as { [value: number]: PinModeKeys });

export function getPinModeDescription(value: number): string | undefined {
    const key = ValueToKeyMap[value];
    return key ? PinModeDescription[key] : undefined;
}

export function getAPIUrl(api: string): string {
    const store = gpioStore();
    const url = `http://${store.ipAddress}:${store.httpPort}/${api}`;
    return url;
}

export function formatBytes(bytes: number | undefined): string {
    if (bytes !== undefined) {
        if (bytes < 1024) {
            return `${bytes} B`;
        } else if (bytes < 1024 * 1024) {
            return `${(bytes / 1024).toFixed()} KB`;
        } else {
            return `${(bytes / 1024 / 1024).toFixed()} MB`;
        }
    }
    return "undefined";
}
export function formatHz(bytes: number | undefined): string {
    if (bytes) {
        if (bytes < 1000) {
            return `${bytes} Hz`;
        } else if (bytes < 1000 * 1024) {
            return `${(bytes / 1000).toFixed(2)} KHz`;
        } else {
            return `${(bytes / 1000 / 1000).toFixed(2)} MHz`;
        }
    }
    return "undefined";
}

export function formatMacAddress(chipId: number | undefined): string {
    if (chipId) {
        let macBytes = [
            chipId & 0xFF,
            (chipId / 0x100) & 0xFF,
            (chipId / 0x10000) & 0xFF,
            (chipId / 0x1000000) & 0xFF,
            (chipId / 0x100000000) & 0xFF,
            (chipId / 0x10000000000) & 0xFF
        ];
        let macAddress = macBytes.map(byte => byte.toString(16).padStart(2, '0').toUpperCase()).join(':');
        return macAddress;
    }
    return "unknown";
}

export function formatTime(ms: number | undefined): string {
    if (ms) {
        const seconds = Math.floor(ms / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);

        const hoursFormatted = (hours % 24).toString().padStart(2, '0');
        const minutesFormatted = (minutes % 60).toString().padStart(2, '0');
        const secondsFormatted = (seconds % 60).toString().padStart(2, '0');

        return `${days}d ${hoursFormatted}:${minutesFormatted}:${secondsFormatted}`;
    }
    return "unknown";
}
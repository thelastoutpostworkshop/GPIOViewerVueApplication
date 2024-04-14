export type PinModeKeys = keyof typeof PinModeValue;

export const PinModeValue = {
    NOT_SET: -1,
    UNAVAILABLE:-2,
    OUTPUT: 3,
    PULLUP: 4,
    INPUT_PULLUP: 5,
    PULLDOWN: 8,
    INPUT_PULLDOWN: 9,
    OPEN_DRAIN: 16,
    OUTPUT_OPEN_DRAIN: 19,
    ANALOG: 192,
} as const;

export const PinModeBroad = {
    OUTPUT:'O',
    INPUT:'I',
    UNKNOWN:'-'
} as const

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
} as const;
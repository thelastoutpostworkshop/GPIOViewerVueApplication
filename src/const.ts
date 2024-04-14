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

export const PinType = {
    Digital: 0,
    PWM: 1,
    Analog: 2,
  } as const;

export const PinColors: string[] = ["#00ff00",
    "#1fff00",
    "#3eff00",
    "#5dff00",
    "#7cff00",
    "#9bff00",
    "#baff00",
    "#d9ff00",
    "#f8ff00",
    "#ffff00", // Yellow
    "#ffef00",
    "#ffdf00",
    "#ffcf00",
    "#ffbf00",
    "#ffaf00",
    "#ff9f00",
    "#ff8f00",
    "#ff7f00",
    "#FE5454",
    "#ff0000", // Red
] as const;
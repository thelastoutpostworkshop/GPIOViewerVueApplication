//Boards types
export interface BoardData {
  name: string;
  css: string;
  image: string;
  pins: string;
  chipname: string;
}


//Pins configuration for the board
export interface PinsSettings {
  pinWidth: number;
  pinHeight: number;
  valueBackGroundColor: string;
  valueMinWidth: number
  valuePinMargin: number
  valueFontSize: number
  showPinNumber: boolean;
}
export interface Pins {
  gpioid: number;
  top: number;
  left: number;
  color: string;
  valueJustify: number;
  valueFontSize: number;
  displayValue: string;
  displayBarValue: number;
  displayType:string;
}
export interface StatsConfiguration {
  top: number;
  left: number;
  gap: number;
  fontSize: number;
}
export interface WifiFeedbackConfiguration {
  top: number;
  left: number;
  width: number;
  background: string;
}
export interface PinsConfiguration {
  pins: Pins[];
  settings: PinsSettings;
  stats: StatsConfiguration;
  wifiFeedback: WifiFeedbackConfiguration;
}

// Pins state sent by GPIOViewer Library
export interface PinState {
  s: number;
  t: number;
  v: number;
}
export type PinStateMap = {
  [gpio: number]: PinState;
}
export type LastPinValues = {
  gpio:number;
  values: number[];
}
export const PinType = {
  Digital: 0,
  PWM: 1,
  Analog: 2,
} as const;

export const PinModeValue = {
  OUTPUT: 3,
  PULLUP: 4,
  INPUT_PULLUP: 5,
  PULLDOWN: 8,
  INPUT_PULLDOWN: 9,
  OPEN_DRAIN: 16,
  OUTPUT_OPEN_DRAIN: 19,
  ANALOG: 192,
} as const;

type PinModeKeys = keyof typeof PinModeValue;

export const PinModeDescription: { [key in PinModeKeys]: string } = {
  OUTPUT: "Output",
  PULLUP: "Pull-up",
  INPUT_PULLUP: "Input with Pull-up",
  PULLDOWN: "Pull-down",
  INPUT_PULLDOWN: "Input with Pull-down",
  OPEN_DRAIN: "Open Drain",
  OUTPUT_OPEN_DRAIN: "Output Open Drain",
  ANALOG: "Analog",
};

export type Memory = {
  size: string
}
export type GPIOViewerRelease = {
  release:string
}
export type SamplingInterval = {
  sampling:number
}
export type ESPInfo = {
  chip_model:string;
  cores_count:number;
  chip_revision:number;
  cpu_frequency:number;
  cycle_count:number;
  mac:number;
  flash_mode:number;
  flash_chip_size:number;
  flash_chip_speed:number;
  heap_size:number;
  heap_max_alloc:number;
  psram_size:number;
  free_psram:number;
  psram_max_alloc:number;
  free_heap:number;
  up_time:number;
  sketch_size:number;
  free_sketch:number;
}

export type ESPPartition = {
  label:string;
  subtype:number;
  address:string;
  size:number;
  calcPour:number;
}

export type PinMode = {
  pin:number;
  mode:number;
}
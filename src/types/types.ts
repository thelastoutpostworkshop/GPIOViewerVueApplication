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
  displayType: string;
  type: number;
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
  gpio: number;
  gpioType: number;
  values: number[];
}

export type Memory = {
  size: string
}
export type GPIOViewerRelease = {
  release: string
}
export type SamplingInterval = {
  sampling: number
}
export type ESPInfo = {
  chip_model: string;
  cores_count: number;
  chip_revision: number | string;
  cpu_frequency: number;
  cycle_count: number;
  mac: number;
  flash_mode: number;
  flash_chip_size: number;
  flash_chip_speed: number;
  heap_size: number;
  heap_max_alloc: number;
  psram_size: number;
  free_psram: number;
  psram_max_alloc: number;
  free_heap: number;
  up_time: number;
  sketch_size: number;
  free_sketch: number;
  arduino_core_version: string;
}

export type ESPPartition = {
  label: string;
  subtype: number;
  address: string;
  size: number;
  calcPour: number;
  type?: number;
}

// PinMode set in the code
export type PinMode = {
  pin: number;
  mode: number;
}

export type PinFunctionDescriptions = {
  function: string;
  pin: number;
}

export type PinsFunctions = {
  name:string
  functions: PinFunctionDescriptions[];
}

export type BoardPinsFunction = {
  boardpinsfunction : PinsFunctions[]
}

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
  valueBackGroundColor:string;
  valueMinWidth:number
  valuePinMargin:number
  valueFontSize:number
}
export interface Pins {
  gpioid: number;
  top: number;
  left: number;
  color:string;
  valueJustify:number;
  showValue:number;
}
export interface PinsConfiguration {
  pins: Pins[];
  settings: PinsSettings;
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
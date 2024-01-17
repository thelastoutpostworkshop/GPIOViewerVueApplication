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
  valueFontSize:number;
  showValue:number;
  showBarValue:number
  showPinNumber:boolean;
}
expert interface StatsConfiguration {
  top:number;
  left:number;
  gap:number;
  fontSize:number;
}
export interface WifiFeedbackConfiguration {
  top:number;
  left:number;
  width:number;
  background:string;
}
export interface PinsConfiguration {
  pins: Pins[];
  settings: PinsSettings;
  stats:StatsConfiguration;
  wifiFeedback:WifiFeedbackConfiguration;
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
export type Memory = {
  size:string
}
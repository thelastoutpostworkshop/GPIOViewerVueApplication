# GPIOViewer Web Application

If your are looking for the GPIOViewer Arduino Library, go [here](https://github.com/thelastoutpostworkshop/gpio_viewer).

## Pin labels

Devices can include an optional `label` in their existing `/pinmodes` response:

```json
[{"pin":"12","mode":"3","label":"IRSend_1"},{"pin":"16","mode":"3","label":"Relay_i1"}]
```

When labels are available, the board display button cycles through **Pin Numbers**, **Pin Types**, **Pin Modes**, and **Pin Labels**. Label mode keeps GPIO numbers visible and shows device labels beside live values. Hover over a pin or open its details to read the full label. Labels can appear before GPIO activity is received. On narrow layouts, labels are shortened and the value text may be hidden; pin details still show both in full.

Missing, empty, or whitespace-only labels are ignored. Devices without labels keep the original three display modes. Both numeric and string `pin`/`mode` values are supported. Labels are read from the device; this app does not edit or persist them and does not call Tasmota's command API.

## Recommended IDE Setup

[VSCode](https://code.visualstudio.com/) + [Volar](https://marketplace.visualstudio.com/items?itemName=Vue.volar) (and disable Vetur) + [TypeScript Vue Plugin (Volar)](https://marketplace.visualstudio.com/items?itemName=Vue.vscode-typescript-vue-plugin).

## Contributors

Contributors are welcomed! If you want to submit pull requests, [here is how you can do it](https://docs.github.com/en/get-started/exploring-projects-on-github/contributing-to-a-project).

## Project Setup

```sh
npm install
```

### Modify index.html

You need to modify `index.html` to configure your ESP32 ip Address and port:

```javascript
window.gpio_settings = {
  ip: "192.168.1.5",
  port: 8080,
  freeSketchRam: "179 KB",
};
```

### Compile and Hot-Reload for Development

```sh
npm run dev
```

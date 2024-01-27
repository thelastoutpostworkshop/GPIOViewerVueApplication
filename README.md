# GPIOViewer Web Application

If your are looking for the GPIOViewer Arduino Library, go [here](https://github.com/thelastoutpostworkshop/gpio_viewer).

## Recommended IDE Setup

[VSCode](https://code.visualstudio.com/) + [Volar](https://marketplace.visualstudio.com/items?itemName=Vue.volar) (and disable Vetur) + [TypeScript Vue Plugin (Volar)](https://marketplace.visualstudio.com/items?itemName=Vue.vscode-typescript-vue-plugin).

## Contributors
Contributors are welcomed!  If you want to submit pull requests, [here is how you can do it](https://docs.github.com/en/get-started/exploring-projects-on-github/contributing-to-a-project).

## Project Setup

```sh
npm install
```
### Modify index.html
You need to modify index.html to configure your ESP32 ip Address and port:
```javascript
      window.gpio_settings = {
        ip: '192.168.1.5',
        port: 8080,
        freeSketchRam:'179 KB'
      };
```

### Compile and Hot-Reload for Development

```sh
npm run dev
```
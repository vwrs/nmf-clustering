Visualization demo using d3.js
===
## Tools
- d3.js
- Webpack

## Run
```
$ npm i
$ npx run serve
```

## Local Setup
- Create `package.json`
```
$ npm init
```
- Install webpack
```
$ npm i --save-dev webpack webpack-cli @webpack-cli/init http-server
```
- Create `webpack.[name].js`
```
$ npx webpack init
```

- Install d3.js
```
$ npm i --save d3
```
- Build with continuous watching
```
$ npm run dev
```
- Build for production
```
$ npm run build
```
- Run the HTTP server & Open your default browser
```
$ npm run serve
```

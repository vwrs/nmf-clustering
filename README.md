NMF Visualization
===

- generate samples from K isotropic multivariate gaussian distributions
- Nonnegative matrix factorization can be used for clustering

![result](https://github.com/vwrs/nmf-clustering/blob/img/nmf-clustering.png)

## Visualization Demo
### Tools
- d3.js
- Webpack

### Run
```
$ npm i
$ npm run serve
```

### Local Setup
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

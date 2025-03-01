# Build

A guide for build output result or docker image

<details>
<summary>Shell Script</summary>
<div style="padding-left:20px">

## quick_web

Quickly hosting static website by using build/renderer folder as root

This require global npm package [http-server](https://www.npmjs.com/package/http-server) install\
You can use command below install

```shell
npm install -g http-server
```

Before run the script, it require build/renderer exist\
You can use command below build the output

```shell
npm run build:web
```

## docker_server.sh

packing express server backend to a docker image

Before run the script, it require build/server exist\
You can use command below build the output

```shell
npm run build:server
```

## docker_node.sh

Packing computing node to a docker image

Before run the script, it require build/node exist\
You can use command below build the output

```shell
npm run build:node
```

## docker_web.sh

Packing static website to a docker image

Before run the script, it require build/renderer exist\
You can use command below build the output

```shell
npm run build:web
```

</div>
</details>


<details>
<summary>Javascript Script</summary>
<div style="padding-left:20px">

## share.js

This will copy everything in src/share to 

* src/main
* src/node
* src/renderer
* src/server

## server_build.js

Packing Express dynamic website to build/server

</div>
</details>
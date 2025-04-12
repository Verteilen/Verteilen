# For Developer

## main

Electron main codebase

```shell
# This will generate a output files in dist/win-unpacked/[files]
npm run build:dir
# This will generate a output installation file in dist/[output name].msi
npm run build:win
```

## node

The pure computing node program without the user-interface\
Basically a lightweight computing node

Use command below to build the result to build/node

```shell
npm run build:node
```

## program

The worker.exe source code, use for multithread support purpose

Use command below to build the result to bin

```shell
npm run pkg
```

## renderer

This codebase can be use in 
* static website build
* express server webfile
* Electron renderer

## server

Express server source code

Use command below to build the result to build/server

```shell
npm run build:server
```

## share

This are the files that share by other\
You can use command below to copy the files to other folder

Basically a share resource to everyone

```shell
npm run share
```
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

The pure node program without the user-interface\
Basically a lightweight computing node

```shell
npm run build:node
```

## renderer

This codebase can be use in 
* static website build
* express server webfile
* Electron renderer

## server

Express server source code

```shell
npm run build:server
```

## share

This are the files that share by other\
You can use command below to copy the files to other folder

```shell
npm run share
```
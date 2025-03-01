# Compute Tool

This is a tool which can manage tasks on multiple computer

[Demo](https://elly2018.github.io/Compute-Tool/)

## Screenshot

||||
|-|-|-|
|![P](./docs/server.png)|![Flow](./docs/flow.png)|![Para](./docs/parameter.png)|
|![Lua](./docs/luaJob.png)|![commandJob](./docs/commanJob.png)|![pipeline](./docs/execution.png)|

## Installation

> Desktop app installation

In Release page, For windows user click .msi installation file

> Docker node installation\
> You need Docker for this

Scripts folder run docker_node.sh

> Docker static website\
> You need Docker for this

Scripts folder run docker_web.sh

> Docker dynamic server\
> You need Docker for this

Scripts folder run docker_server.sh

## Features

||||||
|-|-|-|-|-|
|Features|Desktop|Node|Server|Web|
|Language|✓|✓|✓|✓|
|Task Management|✓||✓|✓|
|Preference|✓||✓|✓|
|Mode Selection|✓||||
|Lua|✓|✓|✓||
|Auth|||✓||


### Task Management

It has project, task, job, 3 layers\
You can also define parameter and let job access to those veriables

#### Project

Top category, The most top container.\
You can name your project and write down the description here.

#### Task

- Cron: Run by multiple nodes
- Multi: Enable multicore to a single node

Jobs container, It will run one by one according to the order\
If Cron and Multi are both unchecked, Meaning that it will select one node to run it through\
If Cron is checked, Server will select multiple nodes to distributed to task

> In the cron mode, Use 'ck' To access to current task id\
> ck is start from 1 

#### Job

節點要執行的一連串動作\
你可以在欄位裡面輸入 %變數名稱% 或是表達式 %{ 變數名稱 - 1 }% \
你可以建立一個範例樣板的專案查看細節

使用了 [expressionparser](https://www.npmjs.com/package/expressionparser) 當作為表達式使用, 這樣可以克服 eval 的不支援問題

#### Parameter

專案的參數值, 支援布林, 字串, 跟數字三種資料型態\
這些變數可以在運作時進行動態變化, 也可以當成常數使用

### Lua

你可以在工作中定義 Lua 腳本運行\
Lua 存取或是輸出都是透過函式進行動作\
針對 Lua 可以使用的函式, 可以參考[這裡](./docs/Lua.md)

### Monitor

You can monitor currently working tasks, Change the state in real-time

## Project Template

- [Example](./docs/Example.md)
- [GS4](./docs/GS4.md)

## TODOs

- [x] Task Data Structure
- [x] Template Support
- [x] Real-Time Monitor UI
- [x] Cronjob Support
- [x] Script Support
- [x] Expression Support
- [x] Docker Support
- [x] Pure Compute Node Support
- [x] Recover Record Support
- [ ] Multicore Support
- [x] Condition Support
- [ ] Express Support
- [ ] Express Auth Support

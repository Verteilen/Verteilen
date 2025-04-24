# Compute Tool

This is a tool which can manage tasks on multiple computer

For User

[Demo](https://elly2018.github.io/Compute-Tool/)\
[Utility Tool](./util/README.md)

```bash
# use npm install the compute tool node
npm install compute_tool_node
# use command ctn to start the client
ctn
```

For Dev

[Dev](./src/README.md)\
[Build](./scripts/build.js)

## Screenshot

||||
|-|-|-|
|![P](./docs/static/server.jpg)|![Flow](./docs/static/flow.jpg)|![Para](./docs/static/parameter.jpg)|
|![Lua](./docs/static/luaJob.jpg)|![commandJob](./docs/static/commanJob.jpg)|![pipeline](./docs/static/execution.jpg)|

## Installation

> Desktop app installation

In [Release](https://github.com/Elly2018/Compute-Tool/releases) page, For windows user click .msi installation file

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

The checklist features for each type of build

|Features|Desktop|Node|Server|Web|
|-|-|-|-|-|
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

Create a proejct container and apply the template\
![Project](./docs/static/project.gif)

#### Task

- Cron: Run by multiple nodes
- Multi: Enable multicore to a single node

Jobs container, It will run one by one according to the order\
If Cron and Multi are both unchecked, Meaning that it will select one node to run it through\
If Cron is checked, Server will select multiple nodes to distributed to task

> In the cron mode, Use 'ck' To access to current task id\
> ck is start from 1 

Task && Job && Paramter management\
![Task](./docs/static/task.gif)

#### Job

Job is a single action\
You can use variable by typing %[Varaible Name]% or expression %{ [Varaible Name] - 1 }% \
Create a example project template to check the implementation

Use [expressionparser](https://www.npmjs.com/package/expressionparser) as expression lib\
Click the link for more detail

#### Parameter

Project's parameter, Support boolean, string, number data type\
This varaible can be change in runtime, you can use it as constant as well

#### Node

Added calculate node, you can include self\
![Node](./docs/static/node.gif)

#### Property

The property is like macro, in the process, it will replace text value\
You can enter expression value here, so the text field value will not be that messy

### Lua

You can write a Lua script in the job section\
Lua has its function lib, more detail in [Here](./docs/Lua.md)

### Monitor

You can monitor currently working tasks, Change the state in real-time

Execute cronjob task\
![Execute](./docs/static/execute.gif)

Execute cronjob task with multithread enable\
![Execute_Multiple](./docs/static/execute_multiple.gif)

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
- [x] Multicore Support
- [x] Condition Support
- [ ] Express Support
- [ ] Express Auth Support
- [ ] Group Support
- [ ] Node information Query
- [x] Console control node support
- [x] Self as node

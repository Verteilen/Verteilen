# Lua Functions

<details>
<summary>Build-in function</summary>
<div style="padding-left:20px">

## split(a1:string, a2:string)

Split the a1 string by char a2, return array\
Easier way to use in a for loop

```lua
--[[
folder1
folder2
folder3
file.json
--]]
local file = o.listfile("myfolder")
--[[
["folder1", "folder2", "folder3", "file.json"]
--]]
local allfiles = split(o.listfile("myfolder"), "\\n")
-- Print out each value
for key=1,value in pairs(allfiles) do
    m.messager(value)
end
```

</div>
</details>


<details>
<summary>OS function</summary>
<div style="padding-left:20px">

## o.sleep(sec:number)

sleep function

## o.copyfile(a1:string, a2:string)

Copy the file from a1 path to a2 path

## o.copydir(a1:string, a2:string)

Copy the folder from a1 path to a2 path

## o.deletefile(a1:string)

It's pretty straightforward i think

## o.deletedir(a1:string)

It's pretty straightforward i think

## o.exist(a1:string)

Check file or folder exist, It return back boolean value

## o.listfile(a1:string)

scan a1 path folder and get all the files\
Return a string result of all files name splited by line-break character

## o.listdir(a1:string)

scan a1 path folder and get all the folders\
Return a string result of all folders name splited by line-break character

## o.createdir(a1:string)

It's pretty straightforward i think

## o.writefile(a1:string, a2:string)

Write a2 context to a file in the a1 path

## o.readfile(a1:string)

Read path a1 file, open the file and return back the string context

## o.rename(a1:string, a2:string)

Rename the folder ot file, from a1 to a2

</div>
</details>


<details>
<summary>Variable function</summary>
<div style="padding-left:20px">

You can three datatype support here

* boolean
* string
* number

## env.has\[data-type\](a1:string)

Check variable exist

## env.set\[data-type\](a1:string, a2:any)

Set the variable value

## env.get\[data-type\](a1:string)

Get the variable value

## Example

```lua
local path = env.getstring('root')
local ison = env.getboolean('ison')
```

</div>
</details>

<details>
<summary>Debug function</summary>
<div style="padding-left:20px">

## m.messager(a1:string)

輸出訊息, 在節點的畫面上

## m.messager_log(a1:string)

輸出訊息, 除了在節點的畫面上\
也將訊息回傳給伺服器

</div>
</details>

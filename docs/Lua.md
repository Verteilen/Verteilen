# Lua 支援函示

## Lua 

### split(a1:string, a2:string)

把 a1 字串, 切開根據 a2 的字元, 形成陣列回傳\
你可以這樣用, 得到資料夾所有檔案
```lua
local allfiles = split(o.listfile("myfolder"), "\\n")
```

## OS 相關

### o.copyfile(a1:string, a2:string)

複製檔案, 從 a1 到 a2

### o.copydir(a1:string, a2:string)

複製資料夾, 從 a1 到 a2

### o.deletefile(a1:string)

刪除檔案, a1 路徑

### o.deletedir(a1:string)

刪除資料夾, a1 路徑

### o.exist(a1:string)

檢查檔案或資料夾路徑存在\
回傳布林

### o.listfile(a1:string)

掃描資料夾, 把所有檔案名稱蒐集起來, 並且回傳字串並且以 \n 分隔開來

### o.listdir(a1:string)

掃描資料夾, 把所有資料夾名稱蒐集起來, 並且回傳字串並且以 \n 分隔開來

### o.createdir(a1:string)

建立資料夾

### o.writefile(a1:string, a2:string)

寫入檔案 a1 為路徑, a2 為內容

### o.readfile(a1:string)

讀取檔案 a1 路徑
回傳字串, 為檔案內容

### o.rename(a1:string, a2:string)

改名, 從路徑 a1 到路徑 a2

## 環境相關

### env.hasboolean(a1:string)

檢查專案布林參數是否存在

### env.getboolean(a1:string)

得到專案布林參數

### env.setboolean(a1:string)

設置專案布林參數

### env.hasnumber(a1:string)

檢查專案數字參數是否存在

### env.getnumber (a1:string)

得到專案數字參數

### env.setnumber(a1:string)

設置專案數字參數

### env.hasstring(a1:string)

檢查專案字串參數是否存在

### env.getstring(a1:string)

得到專案字串參數

### env.setstring(a1:string)

設置專案字串參數

## 訊息相關

### m.messager(a1:string)

輸出訊息, 在節點的畫面上

### m.messager_log(a1:string)

輸出訊息, 除了在節點的畫面上\
也將訊息回傳給伺服器

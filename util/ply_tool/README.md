# ply 工具集

## 安裝方法

### 安裝前提需求

- python 環境
  - pyinstall 安裝
  - numpy 安裝
  - plyfile 安裝
  - argparse 安裝
  - tqdm 安裝

執行 build.sh\
會生成 exe 資料夾 所有執行檔案會在裡面

## 工具簡介

### ply_denoise

> 參數\
> -i [輸入檔案路徑]\
> -o [輸出檔案路徑]

會將輸入 ply 檔案搜尋 RGB 數值\
尋找 0 以下的錯誤並且刪掉

### ply_to_ascii

> 參數\
> -i [輸入檔案路徑]\
> -o [輸出檔案路徑]

會將輸入 ply 檔案　從 二進制 轉成 ascii

### ply_return_ply

> 參數\
> -i [輸入檔案路徑]\
> -o [輸出檔案路徑]

會將輸入 ply 檔案　從 ascii 轉成二進制

### ply_merge

> 參數\
> -i [輸入檔案路徑]\
> -o [輸出檔案路徑]\
> -a [平均透明度]

合併多個 ply 檔案

### ply_merge_batch

> 參數

合併多個 ply 檔案, 但是是透過 merge_batch_config.json 讀取配置的方式進行\
詳細可以參考, 內容包含了更多參數使用

### ply_lut

> 參數\
> -i [輸入檔案路徑]\
> -o [輸出檔案路徑]\
> -l [輸入LUT檔案路徑]

透過 Lut 檔案進行變色

### ply_set_opacity

> 參數\
> -i [輸入檔案路徑]\
> -o [輸出檔案路徑]\
> -s [透明度數值]

Ply 整體透明度設定
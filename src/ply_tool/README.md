# ply 工具集

## 安裝方法

### 安裝前提需求

- python 環境
  - pyinstall 安裝
  - numpy 安裝
  - plyfile 安裝
  - argparse 安裝
  - tqdm 安裝

執行 build.sh

會生成 exe 資料夾 所有執行檔案會在裡面

## 工具簡介

### ply_denoise

- 參數
  - -i [輸入檔案路徑]
  - -o [輸出檔案路徑]

會將輸入 ply 檔案搜尋 RGB 數值
尋找 0 以下的錯誤並且刪掉

### ply_to_ascii

- 參數
  - -i [輸入檔案路徑]
  - -o [輸出檔案路徑]

會將輸入 ply 檔案　從 二進制 轉成 ascii

### ply_to_ply

- 參數
  - -i [輸入檔案路徑]
  - -o [輸出檔案路徑]

會將輸入 ply 檔案　從 ascii 轉成二進制
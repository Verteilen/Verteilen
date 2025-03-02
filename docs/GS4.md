# GS4 樣板說明

透過一連串的演算, 從 gaussian splatting 3d 到 gaussian splatting 4d 的方法論

<details>
<summary>環境設置</summary>
<div style="padding-left:20px">

## 需求前提

需要 conda.exe 路徑加入至環境變數 Path 中\
在環境變數 videogs 中有 train_sequence_Good_Full_Train_densify_until_2000_i7000.py 檔案存在\
需要 plytool 的所有 exe 路徑加入至環境變數 Path 中\
安裝 Colmap 並且把 colmap.exe 路徑加入環境變數中

</div>
</details>


<details>
<summary>流程說明</summary>
<div style="padding-left:20px">

## 檢查階段

主要檢查準備資歷夾以及 videoGS Python 環境的存在

## 整理階段

這裡會把原生資料 Prepare 丟到 before 資料夾並且排序好\
切換的原則如下, 這樣是為了 Colmap 方便運算處理

* 原生資料結構
  * 攝影機 ID
    * 影像按照時間排序
* 準備資料結構
  * 時間排序
    * 每個攝影機的角度 ID

## 運算資料準備

Colmap 會被呼叫, 會在 before/\[時間\]/sparse/0 生成資料庫

## 生成 I Frame

這裡會在 after 生成 GOP_20_I 的資料夾 此為 IFrame

## 備份 I Frame

單純只是複製 GOP_20_I 到 GOP_20_I_Backup 而已

## 降躁處理

每個 I Frame 下的 ply 運算結果會被 ply_denoise.exe 給降躁\
原理是把 r,g,b 零以下的值刪除掉

## 排序改變

這裡會生成 BLEND_\[Blend 數目\]_I 的資料夾在 after 中
並且把 I Frame 資料夾依序複製進去

## Blend 資料準備

把中間偵算出來

## Blending

複製 Ply 序列到 Output 資料夾中的 Sequence_\[Blend 數目\] 中

## Lut

</div>
</details>


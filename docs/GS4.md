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

## 參數說明

<details>
<summary>字串變數</summary>
<div style="padding-left:20px">

### root

根目錄

### output

輸出資料夾位置

### prepare

原生的資料夾名稱

### before

準備的資料夾名稱

### after

運算結果的資料夾名稱

### CAM

複製參考攝影機資料夾前墜

### images

複製參考影像資料夾名稱

### sparse

Colmap 運算結果資料庫的資料夾名稱

### videogs

演算 python 運行的位置

### conda_env

Conda 用的環境變數名稱

</div>
</details>


<details>
<summary>數字變數</summary>
<div style="padding-left:20px">

### frameCount 

總共的偵數

### iframe_gap

I Frame 在被 blend 計算後的間隔\
假設 GOP 是 20 但是要 Blend 4 次\
這個值就會是 5

### lut_thread

Lut 階段時單一電腦最大使用核心數上限

### group_size

影像 GOP 範圍

### blend

Blend 次數

### contribute

貢獻度, 這在 Blend 的階段會影響透明度

### iframe_size

I Frame 生成後的總數目

### denoise

設定去躁 r g b 的最小值

</div>
</details>

<details>
<summary>布林參數</summary>
<div style="padding-left:20px">

### start_at_0

這邊會影響生成數字要以 0 還是 1 為起始點

</div>
</details>

</div>
</details>


<details>
<summary>流程說明</summary>
<div style="padding-left:20px">

## 整理階段

這裡會把原生資料 Prepare 丟到 before 資料夾並且排序好\
切換的原則如下, 這樣是為了 Colmap 方便運算處理

* 原生資料結構
  * 攝影機 ID
    * 影像按照時間排序
* 準備資料結構
  * 時間排序
    * 每個攝影機的角度 ID

## 運算資料準備 (COLMAP)

Colmap 會被呼叫, 會在 before/\[時間\]/sparse/0 生成資料庫\
生成完需要的 bin 後會刪除 database.db 優化空間跟運算時間

## 生成 I Frame

這裡會在 after 生成 GOP_20_I 的資料夾 此為 IFrame\
這個時候 videogs 會被呼叫

## 降躁處理

每個 I Frame 下的 ply 運算結果會被 ply_denoise.exe 給降躁\
原理是把 r,g,b 零以下的值刪除掉 (參數: denoise)

## 備份 I Frame

單純只是複製 GOP_20_I 到 GOP_20_I_Backup 而已

## GTP 修正

運算過程中發現 train.py 與 train_dynamic.py 之間的差異\
* train: 單純 IFrame
* train_dynamic: 中間張

train_dynamic 出來的品質比較好 並且包含 gtp 的運算結果, Iframe 則沒有\
修正這個問題就是複製 Iframe 的來源到新的 before 資料夾, 並且算中間張\
然後覆蓋原本的 IFrame

## 排序改變

這裡會生成
* BLEND_\[Blend 數目\]_I\[P/N\]: Blend 序列資料夾, 交叉放 Iframe 進來
* DATASET_\[P/N\]_\[Blend 數目\]: Data 來源, 從 before 複製過來

## Blend 資料準備

在 BLEND_\[Blend 數目\]_I\[P/N\] 直接演算\
把中間偵算出來

## ply 輸出

複製 Ply 序列到 Output 資料夾中的 (輸出資料夾)/raw/Sequence_\[Blend 數目\] 中

## Blending 透明度

raw 資料夾的偵 套用透明度設定, 並且輸出到 (輸出資料夾)/trans/Sequence_\[Blend 數目\] 中

透明度會透過 sin 的 wave 進行調整, 然後根據加權得到 (參數: contribution) 總值\
假設 contribution 為 3, 然後得到的 sin wave 分別為 [0.5, 1.0]\
則輸出則會為 [1.0, 2.0]

## Blending 合併

trans 資料夾的偵 套用透明度設定. 並且輸出到 (輸出資料夾)/final 中

</div>
</details>


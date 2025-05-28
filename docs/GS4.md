# GS4 Template Guide

The core concept is:\
Camera pictures -> colmap -> gaussian splatting 3d -> gaussian splatting 4d

<details style="margin-bottom:20px;">
<summary>Environment</summary>
<div style="padding-left:20px">

## Requirement

* Installed conda.exe and add to environment path
* Installed Colmap.exe and add to environment path
* videogs folder contain train_sequence_Good_Full_Train_densify_until_2000_i7000.py file exists
* plytool exe install and add to environment path

## parameter

<details>
<summary>String Parameter</summary>
<div style="padding-left:20px">

### root

The root folder in the project

### output

The output folder destination

### prepare

The folder name for source data, such as camera shots or other data\
This folder should exists in the root folder

### before

The folder name for colmap result\
This folder should exists in the root folder

### after

The folder name for compute result\
This folder should exists in the root folder

### CAM

The folder name for prepare data which store camera pictures\
Default should be "CAM"

### images

The folder name for before data which contain timecode pictures\
Default should be "images"

### sparse

The colmap database folder\
Default should be "sparse"

### videogs

Compute python folder location

### conda_env

Conda Use environment name

</div>
</details>


<details>
<summary>Number Parameter</summary>
<div style="padding-left:20px">

### frameCount 

The total frame count

### iframe_gap

The gap for I-Frame after blend compute\
If GOP is 20 and Blend 4 times\
This value will be 5

### core

The multi-core task use core upper limit

### group_size

The GOP size

### blend

Blend times

### contribute

This will effect opacity during the Blend stage

### iframe_size

I-Frame total size

### denoise

Lower limit for [r g b]

</div>
</details>

<details>
<summary>Boolean Parameter</summary>
<div style="padding-left:20px">

None

</div>
</details>

</div>
</details>


<details style="margin-bottom:20px;">
<summary>Compute Guide</summary>
<div style="padding-left:20px">

## Prepare Stage

This will put pictures in prepare folders to before folders\
The rule of the convertion shows below, This is for colmap

```md
* root
  * prepare (copy from)
    * [CameraID]
      * [TimeCode]
  * before (destination)
    * [Timecode] 
      * [CameraID]
```

## COLMAP Execute

Colmap will get call

```md
# Generate .bin database at here
* root
  * before
    * [Timecode]
      * sparse
        * 0
```

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


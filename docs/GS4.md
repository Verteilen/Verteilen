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

## Sorting

Before calculation, The scripts will follow the setting\
Copy files from before folders to after folders\
Then reference them later in the command execution

```md
# Generate folders structure below
* root
  * after 
      # Copy from I-Frame, cross copying
    * BLEND_[Blend Time]_I[P or N]
      # Copy from data source, from before folders
    * DATASET_[P or N]_[Blend Time]

# Example:
* root
  * after
    * Blend_0_IP
    * Blend_5_IP
    * Blend_10_IP
    * Blend_15_IP
    * Blend_0_IN
    * Blend_5_IN
    * Blend_10_IN
    * Blend_15_IN
    * DATASET_P_0
    * DATASET_P_5
    * DATASET_P_10
    * DATASET_P_15
    * DATASET_N_0
    * DATASET_N_5
    * DATASET_N_10
    * DATASET_N_15
```

## Generate I-Frame

The python environment will use in this stage\
And use it to compute the result

> [!NOTE] 
> This stage needs to reference the folders which generate by the Sorting stage

```md
# Generate folder below
* root
  * after
    * GOP_[Blend Time]_I
```


## Denoise

The ply files under I-Frame folder will get denoise by ply_denoise.exe\
It will filtering out [r,g,b] value below zero\
parameter reference: denoise

## GTP Fixed

For fixing train.py and train_dynamic.py difference

* train: I-Frame
* train_dynamic: Middle-Frame

train_dynamic Have better quality, and it contain gtp results, 
But I-frame have none of that\
In order to fix this problem, We simply copy I-frame to new before folder, 
Then calculate middle-frame\
After that we overwrite the original I-Frame

## Blend Compute

在 BLEND_\[Blend 數目\]_I\[P/N\] 直接演算\
把中間偵算出來

## ply Output

Copy ply files to output folders

```md
# Generate folders below
* Output
  * raw
    * Sequence_[Blend Time]

# Example
* Output
  * raw
    * Sequence_0
      * 0.ply
      * 1.ply
      * 2.ply
    * Sequence_5
    * Sequence_10
```

## Blending Opacity

raw 資料夾的偵 套用透明度設定, 並且輸出到 (輸出資料夾)/trans/Sequence_\[Blend 數目\] 中

透明度會透過 sin 的 wave 進行調整, 然後根據加權得到 (參數: contribution) 總值\
假設 contribution 為 3, 然後得到的 sin wave 分別為 [0.5, 1.0]\
則輸出則會為 [1.0, 2.0]

## Blending Merge

trans 資料夾的偵 套用透明度設定. 並且輸出到 (輸出資料夾)/final 中

</div>
</details>




export const DEFAULT = "// Enter your lua code here..."

export const FUNIQUE_GS4_V1:string = `-- 根據第一版本資料整理的方案
-- 這個會需要數個 環境變數才能順利運作

-- 準備環境變數 路徑
local root = getstring('root')
local prepare_folder = getstring('prepare')
local before_folder = getstring('before')
local after_folder = getstring('after')

-- 準備環境變數 字串
local CAM = getstring('CAM')
local images = getstring('images')
local sparse = getstring('sparse')

-- 得到準備資料夾的 攝影機資料夾列表
local prepare_folders = os.listdir(root.."/"..prepare_folder)

-- 攝影機數目
local cam_size = #(prepare_folders)

-- 偵測偵的數目
local frame_size = 0
if cam_size > 0 then
    local f1_files = os.listfile(root.."/"..prepare_folder.."/"..CAM.."/"..prepare_folders[1])
    frame_size = #(f1_files)
end

-- 生成資料夾
os.createdir(root.."/"..before_folder.."/"..CAM)

-- 複製 sparse
os.copydir(root.."/"..prepare_folder.."/"..sparse, root.."/"..before_folder.."/"..sparse)

-- 複製照片 跟 建立 out 資料夾
for key=1,frame_size,1 do
    os.createdir(root.."/"..before_folder.."/"..CAM.."/C"..string.format("%06d", key))
    os.createdir(root.."/"..before_folder.."/"..CAM.."/C"..string.format("%06d", key).."/".."out")
    for key2=1,cam_size,1 do
        local from = root.."/"..prepare_folder.."/"..CAM.."/C"..string.format("%04d", key2).."/"..string.format("%04d", key2).."_"..string.format("%06d", key)..".jpg"
        local to = root.."/"..before_folder.."/"..CAM.."/C"..string.format("%06d", key).."/"..string.format("%04d", key2)..".jpg"
        os.copyfile(from, to)
    end
end
`
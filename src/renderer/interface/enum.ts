export enum JobType {
    COPY_FILE,
    COPY_DIR,
    DELETE_FILE,
    DELETE_DIR,
    CREATE_FILE,
    CREATE_DIR,
    RENAME,
    LUA,
    COMMAND
}

export enum LUATemplate {
    DEFAULT,
    FUNIQUE_GS4_V1
}

export enum ProjectTemplate {
    DEFAULT,
    GS4
}

export enum ExecuteState {
    NONE, RUNNING, FINISH, ERROR, SKIP
}

export const ExecuteStateText: { [key:number]:string } = {
    0: '準備中',
    1: '執行中',
    2: '完成',
    3: '錯誤',
    4: '跳過',
}

export const ConnectionText: { [key:number]:string } = {
    0: '連線中...',
    1: '連線',
    2: '關閉中...',
    3: '關閉',
}

export const JobTypeText: { [key:number]:string } = {
    0: '複製檔案',
    1: '複製資料夾',
    2: '刪除檔案',
    3: '刪除資料夾',
    4: '建立檔案',
    5: '建立資料夾',
    6: '改名',
    7: 'LUA 腳本',
    8: '指令執行'
}

export const LUATemplateText: { [key:number]:string } = {
    0: '預設',
    1: '睿智 GS4 資料夾整理 v1'
}

export const ProjectTemplateText: { [key:number]:string } = {
    0: '預設',
    1: '睿智 GS4'
}
export enum ExecuteState {
    STOP,
    RUNNING,
    Finish
}

export enum JobCategory {
    Condition,
    Execution
}

export enum ConditionResult {
    None,
    SkipProject,
    ThrowProject,
    SkipTask,
    ThrowTask,
    SkipSubTask,
    ThrowSubTask,
    Pause,
}

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

export enum JobType2 {
    CHECK_PATH,
    LUA
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
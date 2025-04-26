export enum DataType {
    Boolean, 
    Number, 
    String,
    Expression
}

export enum ResourceType {
    ALL = ~(~0 << 10),
    SYSTEM = 1 << 0,
    CPU = 1 << 1,
    RAM = 1 << 2,
    BATTERY = 1 << 3,
    LOAD = 1 << 4,
    OS = 1 << 5,
    GPU = 1 << 6,
    DISK = 1 << 7,
    NETWORK = 1 << 8,
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
    JAVASCRIPT,
    COMMAND
}

export enum JobType2 {
    CHECK_PATH,
    LUA
}

export enum ProjectTemplate {
    DEFAULT,
    FUNIQUE_GS4,
    FUNIQUE_GS42,
    FUNIQUE_LUT,
    FFmpeg_Concat,
    Blender,
    AfterEffect
}

export enum ExecuteState {
    NONE, RUNNING, FINISH, ERROR, SKIP
}

export enum RenderUpdateType {
    All= ~(~0 << 7),
    Project = 1 << 0, 
    Node = 1 << 1, 
    Parameter = 1 << 2
}

export enum LuaLib {
    ALL = ~(~0 << 7),
    OS = 1 << 0, 
    ENV = 1 << 1, 
    MESSAGE = 1 << 2,
}

export enum JavascriptLib {
    ALL = ~(~0 << 7),
    OS = 1 << 0, 
    ENV = 1 << 1, 
    MESSAGE = 1 << 2,
    HTTP = 1 << 3,
}

export const DataTypeText: { [key:number]:string } = {
    0: 'types.boolean',
    1: 'types.number',
    2: 'types.string',
    3: 'types.expression',
}

export const ExecuteStateText: { [key:number]:string } = {
    0: 'enum.state.none',
    1: 'enum.state.running',
    2: 'enum.state.finish',
    3: 'enum.state.error',
    4: 'enum.state.skip',
}

export const JobCategoryText: { [key:number]:string } = {
    0: 'enum.category.condition',
    1: 'enum.category.execution',
}

export const ConnectionText: { [key:number]:string } = {
    0: 'enum.connection.connecting',
    1: 'enum.connection.connected',
    2: 'enum.connection.closing',
    3: 'enum.connection.closed',
}

export const JobResultText: { [key:number]:string } = {
    0: 'enum.jobresult.none',
    1: 'enum.jobresult.skip-project',
    2: 'enum.jobresult.throw-project',
    3: 'enum.jobresult.skip-task',
    4: 'enum.jobresult.throw-task',
    5: 'enum.jobresult.pause'
}

export const JobTypeText: { [key:number]:string } = {
    0: 'enum.jobtype.copy-file',
    1: 'enum.jobtype.copy-dir',
    2: 'enum.jobtype.delete-file',
    3: 'enum.jobtype.delete-dir',
    4: 'enum.jobtype.create-file',
    5: 'enum.jobtype.create-dir',
    6: 'enum.jobtype.rename',
    7: 'enum.jobtype.lua',
    8: 'enum.jobtype.command'
}

export const JobType2Text: { [key:number]:string } = {
    0: 'enum.jobtype2.check-path',
    1: 'enum.jobtype.lua'
}

export const ProjectTemplateText: { [key:number]:string } = {
    0: 'enum.project.default',
    10: 'enum.project.gs4',
    11: 'enum.project.gs4-2',
    12: 'enum.project.gs4-lut',
    20: 'enum.project.concat',
    30: 'enum.project.blender',
    40: 'enum.project.aftereffect',
}
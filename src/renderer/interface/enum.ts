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

export enum LUATemplate {
    DEFAULT,
    FUNIQUE_GS4_V1
}

export enum ProjectTemplate {
    DEFAULT,
    FUNIQUE_GS4
}

export enum ExecuteState {
    NONE, RUNNING, FINISH, ERROR, SKIP
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

export const LUATemplateText: { [key:number]:string } = {
    0: 'enum.lua.default',
    1: 'enum.lua.gs4-sort'
}

export const ProjectTemplateText: { [key:number]:string } = {
    0: 'enum.project.default',
    1: 'enum.project.gs4'
}
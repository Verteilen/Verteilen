// ========================
//                           
//      Share Codebase     
//                           
// ========================
import { Preference } from "./record"

export enum ACLType {
    PUBLIC,
    PROTECTED,
    PRIVATE
}

export enum UserType {
    ROOT,
    ADMIN,
    GUEST,
    USER
}

export enum PermissionType {
    ROOT,
    PROJECT,
    Task,
    JOB,
    PARAMETER,
    PLUGIN,
    NODE,
    LIB,
    LOG,
}

export interface GlobalPermission {
    project: LocalPermiision
    task: LocalPermiision
    job: LocalPermiision
    parameter: LocalPermiision

    plugin: LocalPermiision
    node: LocalPermiision
    lib: LocalPermiision
    log: LocalPermiision

    execute_job: boolean
}

export interface LocalPermiision {
    view: boolean
    create: boolean
    edit: boolean
    delete: boolean
}

export interface LocalPermissionContainer {
    uuid: string
    permission: LocalPermiision
}

export interface LocalPermissionContainer2 {
    uuid: string
    uuid2: string
    permission: LocalPermiision
}

/**
 * The data structure store in the DATA_Folder
 */
export interface UserProfile {
    token: string
    name: string
    preference: Preference
    type: UserType
    description?: string
    password?: string
    permission: GlobalPermission
}

/**
 * Client use profile data sended by server
 */
export interface UserProfileClient {
    picture_url: boolean
    name: string
    type: UserType
    description?: string
    permission?: GlobalPermission
}

export interface ServerSetting {
    open_guest: boolean
}
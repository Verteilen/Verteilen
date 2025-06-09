import { Preference } from "./record"

export enum UserType {
    ADMIN,
    GUEST,
    USER
}

export interface GlobalPermission {
    project: LocalPermiision
    task: LocalPermiision
    node: LocalPermiision
    parameter: LocalPermiision
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

export interface UserProfile {
    token: string
    name: string
    picture_url?: string
    preference: Preference
    type: UserType
    description?: string
    password?: string
    permission: GlobalPermission
    permission_projects: Array<LocalPermissionContainer>
    permission_tasks: Array<LocalPermissionContainer2>
    permission_nodes: Array<LocalPermissionContainer>
}

export interface UserProfileClient {
    picture_url?: string
    name: string
    type: UserType
    description?: string
}

export interface ServerSetting {
    open_guest: boolean
}
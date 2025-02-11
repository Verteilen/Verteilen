import { Node, Project } from "./base"
import { WebsocketPack } from "./struct"

export interface Record {
    projects: Array<Project>
    nodes: Array<Node>
}

export interface ExecutePack {
    projects: Array<Project>
    nodes: Array<WebsocketPack>
}
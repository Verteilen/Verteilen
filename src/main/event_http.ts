import express from 'express'
import cookieParser from 'cookie-parser'
import { RecordIOLoader, WebPORT } from 'verteilen-core'
import { backendEvent } from './event'

// 18ewf8TZCpJ04geiOwzhi-v1LxO7X8jHS
const app:express.Express = express()
app.use(express.json())
app.use(cookieParser())

const Loader = (loader:RecordIOLoader, key:string) => {
    app.get(`/api/load_all_${key}`, async (req, res) => {
        const token = req.cookies.token
        const r = await loader.load_all(token)
        res.status(200).json(r)
    })
    app.get(`/api/delete_all_${key}`, async (req, res) => {
        const token = req.cookies.token
        const r = await loader.delete_all(token)
        res.status(200).json(r)
    })
    app.get(`/api/list_all_${key}`, async (req, res) => {
        const token = req.cookies.token
        const r = await loader.list_all(token)
        res.status(200).json(r)
    })
    app.get(`/api/save_${key}`, async (req, res) => {
        const token = req.cookies.token
        const uuid = req.query.uuid?.toString()
        const data = req.body
        if(uuid == undefined){
            res.status(400).send("Needs UUID params")
            return
        }
        if(data == undefined || data == null){
            res.status(400).send("Needs body data")
            return
        }
        const r = await loader.save(uuid, data, token)
        res.status(200).json(r)
    })
    app.get(`/api/delete_${key}`, async (req, res) => {
        const token = req.cookies.token
        const uuid = req.query.uuid?.toString()
        if(uuid == undefined){
            res.status(400).send("Needs UUID params")
            return
        }
        const r = await loader.delete(uuid, token)
        res.status(200).json(r)
    })
    app.get(`/api/delete_all_${key}`, async (req, res) => {
        const token = req.cookies.token
        const r = await loader.delete_all(token)
        res.status(200).json(r)
    })
    app.get(`/api/load_${key}`, async (req, res) => {
        const token = req.cookies.token
        const uuid = req.query.uuid?.toString()
        if(uuid == undefined){
            res.status(400).send("Needs UUID params")
            return
        }
        const r = await loader.load(uuid, token)
        res.status(200).json(r)
    })
}

export const CreateServer = () => {

    Loader(backendEvent.current_loader.project, 'project')
    Loader(backendEvent.current_loader.task, 'task')
    Loader(backendEvent.current_loader.job, 'job')
    Loader(backendEvent.current_loader.database, 'database')
    Loader(backendEvent.current_loader.node, 'node')
    Loader(backendEvent.current_loader.log, 'log')
    Loader(backendEvent.current_loader.lib, 'lib')

    app.listen(WebPORT, () => {
        console.log(`Listen to port ${WebPORT}`)
    })
}
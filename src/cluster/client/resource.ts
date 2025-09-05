// ========================
//                           
//      Share Codebase     
//                           
// ========================
import si from "systeminformation"
import { ResourceType } from "../interface"
import { SystemLoad } from "../interface/struct"

/**
 * The resource query helper
 */
export class ClientResource {
    is_query = false

    Query = async (src:SystemLoad | undefined = undefined, type:ResourceType = ResourceType.ALL):Promise<SystemLoad> => {
        this.is_query = true
        const result:SystemLoad = src != undefined ? src : this.create_new()

        const _system = (type & ResourceType.SYSTEM ) == ResourceType.SYSTEM ? si.system() : undefined
        const _cpu = si.cpu()
        const _ram = si.mem()
        const _battery = si.battery()
        const _load = si.currentLoad()
        const _os = si.osInfo()
        const _gpu = si.graphics()
        const _disk = si.fsSize()
        const _net = si.networkStats()
        this.is_query = false
        
        return await Promise.all([_system, _cpu, _ram, _battery, _load, _os, _gpu, _disk, _net]).then(x => {
            const system = x[0]
            const cpu = x[1]
            const ram = x[2]
            const battery = x[3]
            const load = x[4]
            const os = x[5]
            const gpu = x[6]
            const disk = x[7]
            const net = x[8]

            if(system != undefined){
                result.system_name = `${system.manufacturer} ${system.model}`
                result.virtual = system.virtual
            }
            if(os != undefined){
                result.platform = process.platform
                result.arch = process.arch
                result.hostname = os.hostname
            }
            if(cpu != undefined){
                result.cpu_name = `${cpu.manufacturer} ${cpu.brand} ${cpu.speed}`
                result.cpu_core = cpu.cores
            }
            if(load != undefined){
                result.cpu_usage = load.currentLoadGuest + load.currentLoadIrq + load.currentLoadSystem + load.currentLoad + load.currentLoadSteal + load.currentLoadNice
            }
            if(ram != undefined){
                result.ram_usage = ram.used
                result.ram_free = ram.free
                result.ram_total = ram.total
            }
            if(battery != undefined){
                result.battery = battery.hasBattery ? battery.percent : 1
                result.charging = battery.isCharging
            }
            if(gpu != undefined){
                result.gpu = gpu.controllers.map(x => ({
                    gpu_name: `${x.vendor} ${x.model}`
                }))
            }
            if(disk != undefined){
                result.disk = disk.map(x => ({
                    disk_name: x.fs,
                    disk_type: x.type,
                    disk_free: x.available,
                    disk_total: x.size,
                    disk_usage: x.used,
                    disk_percentage: x.use,
                }))
            }
            if(net != undefined){
                result.net = net.map(x => ({
                    net_name: x.iface,
                    download: x.rx_sec,
                    upload: x.tx_sec
                }))
            }

            result.pid_usage = process.pid
            return result
        })
    }

    private create_new = ():SystemLoad => {
        return {
            system_name: '',
            virtual: false,
            platform: '',
            arch: '',
            hostname: '',
        
            cpu_name: '',
            cpu_core: 0,
            cpu_usage: 0,
        
            ram_usage: 0,
            ram_free: 0,
            ram_total: 0,
        
            battery: 0,
            charging: false,
        
            gpu: [],
            disk: [],
            net: [],
        
            pid_usage: 0
        }
    }
}
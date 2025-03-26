import si from "systeminformation"
import { SystemLoad } from "../interface/struct"

/**
 * The resource query helper
 */
export class ClientResource {
    is_query = false

    Query = async ():Promise<SystemLoad> => {
        this.is_query = true
        const _system = si.system()
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

            return {
                system_name: `${system.manufacturer} ${system.model}`,
                virtual: system.virtual,
                platform: os.platform,
                arch: os.arch,
                hostname: os.hostname,
    
                cpu_name: `${cpu.manufacturer} ${cpu.brand} ${cpu.speed}`,
                cpu_core: cpu.cores,
                cpu_usage: load.currentLoad,
    
                ram_usage: ram.used,
                ram_free: ram.free,
                ram_total: ram.total,
    
                battery: battery.hasBattery ? battery.percent : 1,
                charging: battery.isCharging,
    
                gpu: gpu.controllers.map(x => ({
                    gpu_name: `${x.vendor} ${x.model}`
                })),
                disk: disk.map(x => ({
                    disk_name: x.fs,
                    disk_type: x.type,
                    disk_free: x.available,
                    disk_total: x.size,
                    disk_usage: x.used,
                    disk_percentage: x.use,
                })),
                net: net.map(x => ({
                    net_name: x.iface,
                    download: x.rx_sec,
                    upload: x.tx_sec
                })),
                
                pid_usage: process.pid
            }
        })
    }
}
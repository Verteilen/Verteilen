import si from "systeminformation"
import { SystemLoad } from "../interface/struct"

/**
 * The resource query helper
 */
export class ClientResource {
    is_query = false

    Query = async ():Promise<SystemLoad> => {
        this.is_query = true
        const system = await si.system()
        const cpu = await si.cpu()
        const ram = await si.mem()
        const battery = await si.battery()
        const load = await si.currentLoad()
        const os = await si.osInfo()
        const gpu = await si.graphics()
        const disk = await si.fsSize()
        const net = await si.networkStats()
        this.is_query = false
        
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
    }
}
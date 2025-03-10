import cluster from 'cluster'
import { Job } from '../../interface'


export function RUN(){
    if(cluster.isPrimary) return
    if(process.env.type == 'JOB'){
        if(process.env.job == undefined){
            process.exit(1)
        }
        const d:Job = JSON.parse(process.env.job)
    }
}
import { RUN } from './client/cluster'

process.on('SIGTERM', (s) => {
    process.exit(1)
})

RUN()
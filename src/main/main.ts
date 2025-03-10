import cluster from 'cluster';
import * as worker from './client/cluster';
import * as electron from './electron';

if(cluster.isPrimary){
  electron.RUN()
}else{
  worker.RUN()
}
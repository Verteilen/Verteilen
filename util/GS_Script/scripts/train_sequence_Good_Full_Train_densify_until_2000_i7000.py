import argparse
import os
import shutil

import numpy as np
import open3d as o3d
import pymeshlab

# group_size = 10

if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--start', type=int, default='')
    parser.add_argument('--end', type=int, default='')
    parser.add_argument('--cuda', type=int, default='')
    parser.add_argument('--data', type=str, default='')
    parser.add_argument('--output', type=str, default='')
    parser.add_argument('--sh', type=str, default='0')
    parser.add_argument('--interval', type=str, default='')
    parser.add_argument('--group_size', type=str, default='')
    parser.add_argument('--resolution', type=int, default=2)
    parser.add_argument('--iframe', type=int, default=1)
    parser.add_argument('--overwrite', type=int, default=0)
    parser.add_argument('--iteration', type=int, default=7000)
    parser.add_argument('--dynamic', type=int, default=500)
    parser.add_argument('--grad', type=int, default=0.0002)
    parser.add_argument('--density', type=int, default=2000)
    parser.add_argument('--gtp', type=int, default=500)
    args = parser.parse_args()

    print(args.start, args.end)

    # os.system("conda activate torch")
    card_id = args.cuda
    data_root_path = args.data
    output_path = args.output
    sh = args.sh
    interval = int(args.interval)
    group_size = int(args.group_size)
    resolution_scale = int(args.resolution)

    # neus2_meshlab_filter_path = os.path.join(data_root_path, "luoxi_filter.mlx")

    neus2_output_path = os.path.join(output_path, "neus2_output")
    if not os.path.exists(neus2_output_path):
        os.makedirs(neus2_output_path)

    gaussian_output_path = os.path.join(output_path, "checkpoint")

    for i in range(args.start, args.end, group_size * interval):
        group_start = i
        group_end = min(i + group_size * interval, args.end) - 1
        print(group_start, group_end)
        
        frame_path = os.path.join(data_root_path, str(i))
        if not os.path.exists(frame_path):
            os.makedirs(frame_path)
        frame_neus2_output_path = os.path.join(neus2_output_path, str(i))
        if not os.path.exists(frame_neus2_output_path):
            os.makedirs(frame_neus2_output_path)
        frame_neus2_ckpt_output_path = os.path.join(frame_neus2_output_path, "frame.msgpack")
        frame_neus2_mesh_output_path = os.path.join(frame_neus2_output_path, "points3d.obj")
        
        if args.iframe > 0:
            """ Gaussian """
            # generate output
            frame_model_path = os.path.join(gaussian_output_path, str(i))
            first_frame_iteration = args.iteration
            first_frame_save_iterations = first_frame_iteration
            first_gaussian_command = f"python train.py -s {frame_path} -m {frame_model_path} --densify_grad_threshold {args.grad} --densify_until_iter {args.density} --iterations {first_frame_iteration} --save_iterations {first_frame_save_iterations} --sh_degree {sh} -r {resolution_scale} --port 600{card_id}"
            os.system(first_gaussian_command)

        first_frame_iteration = args.dynamic
        first_frame_save_iterations = first_frame_iteration
        gtp_value = args.gtp
        # rest frame
        dynamic_command = f"python train_dynamic.py -s {data_root_path} -m {gaussian_output_path} --sh_degree {sh} -r {resolution_scale} --st {group_start} --ed {group_end} --interval {interval} --iterations {first_frame_iteration} --gtp {gtp_value}"
        os.system(dynamic_command)

        print(f"Finish {group_start} to {group_end}")
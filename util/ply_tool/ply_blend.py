import argparse
import subprocess
import sys


def transparent_setting(root, output, frame, blend, gap, contribution):
    subprocess.run(["ply_set_opacity", "-i", "-o", "-a"])
    pass

def merge_setting(root, output, blend, gap, contribution):
    subprocess.run(["ply_merge", "-i", "-o", "-a"])
    pass

parser = argparse.ArgumentParser()
parser.add_argument('-t', '--type', help='type of operation')
parser.add_argument('-f', '--frame', help='frame count')
parser.add_argument('-b', '--blend', help='blend times')
parser.add_argument('-g', '--gaps', help='gop divide by blend')
parser.add_argument('-c', '--contribution', help='contribution')
parser.add_argument('-r', '--root', help='root folder')
parser.add_argument('-o', '--output', help='output folder')
args = parser.parse_args()
ops = args.type
frame_count = 1
blend_times = args.blend
gaps = args.gaps
contribution_value = args.contribution
root = args.root
output = args.output

if args.frame is not None:
    frame_count = args.frame

if ops is None:
    print ("please specify type operation")
    sys.exit()
if blend_times is None:
    print ("please specify blend")
    sys.exit()
if gaps is None:
    print ("please specify gaps")
    sys.exit()
if contribution_value is None:
    print ("please specify contribution")
    sys.exit()
if root is None:
    print ("please specify root")
    sys.exit()
if output is None:
    print ("please specify output")
    sys.exit()

if ops is 0:
    transparent_setting(root, output, frame_count, blend_times, gaps, contribution_value)

if ops is 1:
    merge_setting(root, output, blend_times, gaps, contribution_value)


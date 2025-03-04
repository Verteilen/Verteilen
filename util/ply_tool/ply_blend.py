import argparse
import math
import os
import pathlib
import subprocess
import sys


def transparent_setting(root, output, frame, blend, gap, contribution):
    inputFiles = []
    max = 0
    for i in range(blend):
        path = pathlib.Path.joinpath(root, "Sequence_" + str((i * gap)), str(frame) + ".ply")
        outFolder = pathlib.Path.joinpath(output, "Sequence_" + str((i * gap)))
        out = pathlib.Path.joinpath(outFolder, str(frame) + ".ply")
        os.makedirs(outFolder, exist_ok=True)
        if pathlib.Path.exists(path):
            gop = blend * gap
            reminder = (frame + (i * gap)) % gop
            degree = (float(reminder) / float(gop)) * 360.0
            sinv = math.sin(math.radians(degree)) * 0.5 + 0.5
            max = max + sinv
            inputFiles.append((path, out, sinv))
    
    count = len(inputFiles)
    if count == 0:
        return

    for i in inputFiles:
        mul = contribution / max
        weight = i[2] * mul
        subprocess.run(["ply_set_opacity", "-i", i[0], "-o", i[1], "-a", str(weight)])
        print("Set file: " + i[0] + ", transparent to ", str(sinv), "  and output to " + i[1])

def merge_setting(root, output, frame, blend, gap, contribution):
    inputFiles = []
    os.makedirs(output, exist_ok=True)
    for i in range(blend):
        path = pathlib.Path.joinpath(root, "Sequence_" + str((i * gap)), str(frame) + ".ply")
        if pathlib.Path.exists(path):
            inputFiles.append(path)

    count = len(inputFiles)
    if count == 0:
        return
    
    path = pathlib.Path.joinpath(root, "temp", "conbine" + str(frame) + ".txt")
    f = open(path, "a")
    for i in inputFiles:
        f.write(i + "\\n")
    f.close()

    subprocess.run(["ply_merge", "-i", path, "-o", str(frame) + ".ply"])
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


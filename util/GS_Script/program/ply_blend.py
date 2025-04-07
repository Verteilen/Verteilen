import argparse
import math
import os
import subprocess
import sys


# example: gop = 20
# gap = 5
# blend = 4
def transparent_setting(root, output, frame, blend, gap, contribution):
    print('transparent_setting mode')
    inputFiles = []
    max = 0
    for i in range(blend):
        foldername = "Sequence_" + str((i * gap))
        path = root +"/"+ foldername +"/"+ str(frame) + ".ply"
        outFolder = output +"/"+ foldername
        out = outFolder +"/"+ str(frame) + ".ply"
        gop = blend * gap
        os.makedirs(outFolder, exist_ok=True)
        if os.path.exists(path):
            if gop != 1:
                reminder = (frame - (i * gap)) % gop
                degree = (float(reminder) / float(gop)) * 360.0
                sinv = (1.0 - math.cos(math.radians(degree)) * -1.0) * 0.5
                max = max + sinv
                inputFiles.append((path, out, sinv))
            else:
                sinv = 1.0 / float(gap)
                inputFiles.append((path, out, sinv))
                max = max + sinv
    
    count = len(inputFiles)
    sys.stdout.flush()
    print('input file count: ' + str(count))
    sys.stdout.flush()
    if count == 0:
        return

    for i in inputFiles:
        mul = contribution / max
        weight = i[2] * mul
        if weight == 0:
            weight = 1
        print("Set file: " + i[0] + ", transparent to ", str(i[2]), "  and output to " + i[1] + " Real weight: " + str(weight))
        sys.stdout.flush()
        subprocess.run(["ply_set_opacity", "-i", i[0], "-o", i[1], "-s", str(weight)])

def merge_setting(root, output, frame, blend, gap, contribution):
    print('merge_setting mode')
    inputFiles = []
    os.makedirs(output, exist_ok=True)
    for i in range(blend):
        path = root +"/"+ "Sequence_" + str((i * gap)) +"/"+ str(frame) + ".ply"
        if os.path.exists(path):
            inputFiles.append(path)

    count = len(inputFiles)
    print('input file count: ' + str(count))
    if count == 0:
        return
    
    foldername = root +"/"+ "temp"
    path = foldername +"/"+ "conbine" + str(frame) + ".txt"
    os.makedirs(foldername, exist_ok=True)
    os.makedirs(output, exist_ok=True)
    f = open(path, "w+")
    for i in inputFiles:
        f.write(i + "\n")
    f.close()

    subprocess.run(["ply_merge", "-i", path, "-o", output +'/'+ str(frame) + ".ply"])
    pass

parser = argparse.ArgumentParser()
parser.add_argument('-t', '--type', help='type of operation', type=int)
parser.add_argument('-f', '--frame', help='frame count', type=int)
parser.add_argument('-b', '--blend', help='blend times', type=int)
parser.add_argument('-g', '--gaps', help='gop divide by blend', type=int)
parser.add_argument('-c', '--contribution', help='contribution', type=int)
parser.add_argument('-r', '--root', help='root folder', type=str)
parser.add_argument('-o', '--output', help='output folder', type=str)
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

if ops == 0:
    transparent_setting(root, output, frame_count, blend_times, gaps, contribution_value)

if ops == 1:
    merge_setting(root, output, frame_count, blend_times, gaps, contribution_value)



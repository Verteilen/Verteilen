import numpy 
import sys
import argparse
from plyfile import PlyData, PlyElement

# get arguments
parser = argparse.ArgumentParser()
parser.add_argument('-i', '--input', help='input ply file')
parser.add_argument('-o', '--output', help='output ply file')
args = parser.parse_args()
input_file = args.input
output_file = args.output

if input_file is None:
    print ("please specify input ply file")
    sys.exit()
if output_file is None:
    print ("please specify output ply file")
    sys.exit()

plyData = PlyData.read(input_file)
plyData.text = True
plyData.write(output_file)


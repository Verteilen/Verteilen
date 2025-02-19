import numpy 
import sys
import argparse
from plyfile import PlyData, PlyElement

def sigmoid(x):
    return 1/(1+numpy.exp(-x))
def sigmoid_inv(x):
    return numpy.log(x/(1-x))

# get arguments
parser = argparse.ArgumentParser()
parser.add_argument('-i', '--input', help='input ply file')
parser.add_argument('-o', '--output', help='output ply file')
parser.add_argument('-s', '--opacity_scale', help='opacity scale value')
args = parser.parse_args()
input_file = args.input
output_file = args.output
opacity_scale = args.opacity_scale

if input_file is None:
    print ("please specify input ply file")
    sys.exit()
if output_file is None:
    print ("please specify output ply file")
    sys.exit()

plyData = PlyData.read(input_file)

for i in range(0, plyData.elements[0].count):        
    sig_op = float(opacity_scale) * sigmoid(plyData.elements[0].data[i]['opacity'])     
    plyData.elements[0].data[i]['opacity'] = sigmoid_inv(sig_op)    

plyData.write(output_file)


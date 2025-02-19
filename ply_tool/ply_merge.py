import numpy 
import sys
from plyfile import PlyData, PlyElement
import argparse

def read_ply_file_list(path_of_text_file):
    with open(path_of_text_file) as f:
        lines = f.readlines()
    return [x.strip() for x in lines]

def set_opacity(plyData, opacity_scale):
    def sigmoid(x):
        return 1/(1+numpy.exp(-x))
    def sigmoid_inv(x):
        return numpy.log(x/(1-x))    
    for i in range(0, plyData.elements[0].count):        
        sig_op = float(opacity_scale) * sigmoid(plyData.elements[0].data[i]['opacity'])     
        plyData.elements[0].data[i]['opacity'] = sigmoid_inv(sig_op)

def merge_ply(path, output_file_path, opacity):
    if (isinstance(path, list) == False):
        print("path is not a list")
        return
    if (len(path) == 0):
        print("path is empty")
        return
    # get first ply file
    plyData = PlyData.read(path[0])
    plyDataType = type(plyData.elements[0].data)
    for i in range(1, len(path)):    
        plyData2 = PlyData.read(path[i])
        if type(plyData2.elements[0].data) != plyDataType:
            print("plyDataType not match")
            continue
        plyData.elements[0].data = numpy.append(plyData.elements[0].data, plyData2.elements[0].data)
    if(opacity):
        set_opacity(plyData, 1/len(path))    
    plyData.write(output_file_path)

# get arguments

parser = argparse.ArgumentParser()
parser.add_argument('-i', '--input', help='input ply file')
parser.add_argument('-o', '--output', help='output ply file')
parser.add_argument('-a', '--average_opacity', help='average opacity value')
args = parser.parse_args()
input_file = args.input
output_file = args.output
average_opacity = args.average_opacity

if input_file is None:
    print ("please specify input ply list file")
    sys.exit()
if output_file is None:
    print ("please specify output ply file")
    sys.exit()

plys_path = read_ply_file_list(input_file)
merge_ply(plys_path, output_file, average_opacity is not None)

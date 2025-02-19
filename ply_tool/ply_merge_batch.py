import os
import sys
import json
import numpy 
from plyfile import PlyData, PlyElement


def read_json_file(file_path):
    with open(file_path, 'r') as file:
        data = json.load(file)
    return data

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

current_dir = os.path.dirname(os.path.abspath(__file__))
config_path = current_dir + "\\merge_batch_config.json"
args = sys.argv[1:]
if (len(args) == 1):
    config_path = args[0]
# check if config file exists
try:
    f = open(config_path)
except IOError:
    print("Config file not found")
    sys.exit()


config = read_json_file(config_path)
pre_path = config['pre_path']
post_path = config['post_path']
seq_s = config['seq_s']
seq_e = config['seq_e']
merge_s = config['merge_s']
merge_e = config['merge_e']
opacity = config['opacity']
output_folder = config['output_folder']


# batch merge
if (len(seq_s) != len(seq_e) or len(merge_s) != len(merge_e)):
    print("seq_s, seq_e, merge_s, merge_e should have same length")
    exit()
try:
    ss = int(seq_s)
    se = int(seq_e)
    ms = int(merge_s)
    me = int(merge_e)
except ValueError:
    print("seq_s, seq_e, merge_s, merge_e should be integer")
    sys.exit()
    
for i in range(ss, se):
    plys_path = []
    for j in range(ms, me):
        plys_path.append(pre_path + str(j).zfill(len(merge_s)) + "\\" + str(i).zfill(len(seq_s)) + post_path)
        print (plys_path[-1])
    output_file = output_folder +  str(i).zfill(len(seq_s)) + "_merged.ply"    
    merge_ply(plys_path, output_file, opacity)
    print (output_file)

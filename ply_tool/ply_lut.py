import argparse
import colour
import numpy as np
from plyfile import PlyData, PlyElement
from tqdm import tqdm


# color information 
# https://github.com/graphdeco-inria/gaussian-splatting/issues/485
# RGB[0, 1]
# C0 = Zeroth order SH coefficient = 0.282095
# R = 0.5 + C0 * f_dc_0 
# G = 0.5 + C0 * f_dc_1
# B = 0.5 + C0 * f_dc_2

C0 = 0.282095
def gs_color_convert(origin_data):
    return 0.5 + C0 * origin_data
def gs_color_convert_inv(data):
    return (data - 0.5) / C0
def gs_apply_lut(plyData, lut):
    with tqdm(total=plyData.elements[0].count) as pbar:
        for i in range(0, plyData.elements[0].count):
            data = np.array([
                plyData.elements[0].data[i]['f_dc_0'], 
                plyData.elements[0].data[i]['f_dc_1'], 
                plyData.elements[0].data[i]['f_dc_2']])
            data = gs_color_convert(data)
            data = lut.apply(data)
            data = gs_color_convert_inv(data)
            plyData.elements[0].data[i]['f_dc_0'] = data[0]
            plyData.elements[0].data[i]['f_dc_1'] = data[1]
            plyData.elements[0].data[i]['f_dc_2'] = data[2]
            pbar.update(1)

parser = argparse.ArgumentParser()
parser.add_argument('-i', '--input', help='input ply file')
parser.add_argument('-l', '--lut', help='input lut file')
parser.add_argument('-o', '--output', help='output ply file')
args = parser.parse_args()

lut_path = args.lut 
ply_path = args.input
ply_output_path = args.output

if lut_path is None:
    print ("please specify input lut file")
    sys.exit()
if ply_path is None:
    print ("please specify input ply file")
    sys.exit()
if ply_output_path is None:
    print ("please specify output ply file")
    sys.exit()

gsData = PlyData.read(ply_path)
lut = colour.read_LUT(lut_path)

# print(lut) 
# should we check if the lut is valid?

gs_apply_lut(gsData, lut)
gsData.write(ply_output_path)
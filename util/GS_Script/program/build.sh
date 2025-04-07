#!/bin/bash

python -m PyInstaller --onefile -c "ply_blend.py"
python -m PyInstaller --onefile -c "ply_denoise.py"
python -m PyInstaller --onefile -c "ply_merge_batch.py"
python -m PyInstaller --onefile -c "ply_merge.py"
python -m PyInstaller --onefile -c "ply_return_ply.py"
python -m PyInstaller --onefile -c "ply_set_opacity.py"
python -m PyInstaller --onefile -c "ply_to_ascii.py"
python -m PyInstaller --onefile -c "ply_lut.py"

rmdir -r -f exe
mkdir exe

cp dist/ply_blend.exe exe/ply_blend.exe
cp dist/ply_denoise.exe exe/ply_denoise.exe
cp dist/ply_lut.exe exe/ply_lut.exe
cp dist/ply_merge_batch.exe exe/ply_merge_batch.exe
cp dist/ply_merge.exe exe/ply_merge.exe
cp dist/ply_return_ply.exe exe/ply_return_ply.exe
cp dist/ply_set_opacity.exe exe/ply_set_opacity.exe
cp dist/ply_to_ascii.exe exe/ply_to_ascii.exe


read -p "Press enter to continue"
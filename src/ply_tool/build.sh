#!/bin/bash

python -m PyInstaller --onefile -w "ply_denoise.py"
python -m PyInstaller --onefile -w "ply_lut.py"
python -m PyInstaller --onefile -w "ply_merge_batch.py"
python -m PyInstaller --onefile -w "ply_merge.py"
python -m PyInstaller --onefile -w "ply_return_ply.py"
python -m PyInstaller --onefile -w "ply_set_opacity.py"
python -m PyInstaller --onefile -w "ply_to_ascii.py"

cp dist/ply_denoise.exe exe/ply_denoise.exe
cp dist/ply_lut.exe exe/ply_lut.exe
cp dist/ply_merge_batch.exe exe/ply_merge_batch.exe
cp dist/ply_merge.exe exe/ply_merge.exe
cp dist/ply_return_ply.exe exe/ply_return_ply.exe
cp dist/ply_set_opacity.exe exe/ply_set_opacity.exe
cp dist/ply_to_ascii.exe exe/ply_to_ascii.exe

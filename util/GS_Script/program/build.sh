#!/bin/bash

python3 -m PyInstaller --onefile -c "ply_blend.py"
python3 -m PyInstaller --onefile -c "ply_denoise.py"
python3 -m PyInstaller --onefile -c "ply_merge_batch.py"
python3 -m PyInstaller --onefile -c "ply_merge.py"
python3 -m PyInstaller --onefile -c "ply_return_ply.py"
python3 -m PyInstaller --onefile -c "ply_set_opacity.py"
python3 -m PyInstaller --onefile -c "ply_to_ascii.py"
python3 -m PyInstaller --onefile -c "ply_lut.py"

rmdir -r -f exe
mkdir exe

read -p "Press enter to continue"

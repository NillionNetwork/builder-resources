#!/usr/bin/env python

from pdb import set_trace as bp
import glob
import os
import subprocess
import sys
import platform

def client_whl_file_match(filepattern: str) -> str:
    files = glob.glob(f"{os.environ['NILLION_SDK_ROOT']}/py_nillion_client*{filepattern}")
    if len(files):
        return files.pop()

def get_client_whl_file():
    system = platform.system().lower()
    architecture = platform.machine().lower()

    arch_map = {
        'x86_64': 'x86_64',
        'amd64': 'x86_64',  # Sometimes x86_64 can be reported as amd64
        'arm64': 'arm64',
        'aarch64': 'aarch64'
    }
    arch = arch_map.get(architecture, '')

    # Select the appropriate wheel file based on system and architecture
    if system == 'darwin':  # macOS
        if arch == 'x86_64':
            return client_whl_file_match('macosx_*_x86_64.whl')
        elif arch == 'arm64':
            return client_whl_file_match('macosx_*_arm64.whl')
    elif system == 'linux':
        if arch == 'x86_64':
            return client_whl_file_match('manylinux_*_x86_64.whl')
        elif arch == 'aarch64':
            return client_whl_file_match('manylinux_*_aarch64.whl')

    raise Exception('Unsupported platform or architecture')

nada_dsl_whl = glob.glob(f"{os.environ['NILLION_SDK_ROOT']}/nada_dsl-*-py3-none-any.whl")
if len(nada_dsl_whl):
    print(f"installing nada_dsl from {os.environ['NILLION_SDK_ROOT']}")
    subprocess.check_call([sys.executable, '-m', 'pip', 'install', nada_dsl_whl.pop()])
    print("⚠️ nada dsl from nillion SDK installed!")
else:
    raise Exception("nada dsl nillion SDK file not found in NILLION_SDK_ROOT")

client_whl_path = get_client_whl_file()
if client_whl_path:
    print(f"installing client whl from {os.environ['NILLION_SDK_ROOT']}")
    subprocess.check_call([sys.executable, '-m', 'pip', 'install', client_whl_path])
    print("⚠️ py client from nillion SDK installed!")
else:
    raise Exception("py client nillion SDK file not found in NILLION_SDK_ROOT")

# how to run the demo


## 1. start your test cluster
```bash
# from the workspace root - this starts the cluster and places the 
# config and program into the expected dir
./tools/bootstrap-local-environment.sh py-client/compute-basic
```

## 2. install pre-requisite libraries
```bash
source activate_virtualenv.sh
python3 install_nillion_pip.py
```

## 3a. Run test
```bash
python3 client.py
```

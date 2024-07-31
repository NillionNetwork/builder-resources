# how to run the demo


## 1a. start your local test cluster
```bash
nillion-devnet
```

## 1b. use testnet cluster
```bash
cp .env.photon .env
```
then edit this file to add your own private key (export from keplr, etc)

## 2. install pre-requisite libraries
```bash
source activate_virtualenv.sh
pip install --upgrade -r requirements.txt
```

## 3a. Run test
```bash
python3 client.py
```

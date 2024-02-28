#!/usr/bin/env python
"""
This script will update this project dotenv file with the expected
client sdk package location and runtime paramteres from the bootstrap script
so that artifacts paths are developer independent
"""
from dotenv import dotenv_values
import json


def update_dotenv_file():
    config = dotenv_values(".env")

    with open("local.json", "r") as fp:
        bootstrap = json.load(fp)

    config["NILLION_BOOTNODE_MULTIADDRESS"] = bootstrap["bootnodes"][0]
    config["NILLION_CLUSTER_ID"] = bootstrap["cluster_id"]
    config["NILLION_BLOCKCHAIN_RPC_ENDPOINT"] = bootstrap["payments_config"][
        "rpc_endpoint"
    ]
    config["NILLION_BLINDING_FACTORS_MANAGER_SC_ADDRESS"] = bootstrap[
        "payments_config"
    ]["smart_contract_addresses"]["blinding_factors_manager"]
    config["NILLION_PAYMENTS_SC_ADDRESS"] = bootstrap["payments_config"][
        "smart_contract_addresses"
    ]["payments"]
    config["NILLION_CHAIN_ID"] = bootstrap["payments_config"]["signer"]["wallet"][
        "chain_id"
    ]
    config["NILLION_WALLET_PRIVATE_KEY"] = bootstrap["payments_config"]["signer"][
        "wallet"
    ]["private_key"]
    config["NILLION_WRITERKEY_PATH"] = bootstrap["keypath"]["wuser"]
    config["NILLION_READERKEY_PATH"] = bootstrap["keypath"]["ruser"]
    config["NILLION_NODEKEY_PATH"] = bootstrap["keypath"]["node"]

    with open(".env", "w") as fp:
        for k, v in config.items():
            fp.write(f'{k}="{v}"\n')


if __name__ == "__main__":
    update_dotenv_file()

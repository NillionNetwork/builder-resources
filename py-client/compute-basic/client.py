"""
In this example, we:
1. connect to the nillion network based on env config
2. store the secret addition program
3. store a secret to be used in the computation
4. compute the secret addition program with the stored secret and another computation time secret
"""

import asyncio
import py_nillion_client as nillion
import os
import subprocess
import sys

from py_nillion_client import NodeKey, UserKey
from dotenv import load_dotenv
from nillion_python_helpers import (
    get_quote_and_pay,
    create_nillion_client,
    create_payments_config,
)

from cosmpy.aerial.client import LedgerClient
from cosmpy.aerial.wallet import LocalWallet
from cosmpy.crypto.keypairs import PrivateKey

home = os.getenv("HOME")
load_dotenv(f"{home}/.config/nillion/nillion-devnet.env")

expected_result = int(510)


async def main():
    # 1. Initial setup
    # 1.1. Get cluster_id, grpc_endpoint, & chain_id from the .env file
    cluster_id = os.getenv("NILLION_CLUSTER_ID")
    grpc_endpoint = os.getenv("NILLION_NILCHAIN_GRPC")
    chain_id = os.getenv("NILLION_NILCHAIN_CHAIN_ID")
    # 1.2 pick a seed and generate user and node keys
    seed = "my_seed"
    userkey = UserKey.from_seed(seed)
    nodekey = NodeKey.from_seed(seed)

    target_dir = os.path.abspath(os.path.join(os.path.dirname(__file__)))
    program_src = os.path.abspath(
        os.path.join(target_dir, "nada", "secret_addition_complete.py")
    )
    try:
        result = subprocess.run(
            ["pynadac", "--target-dir", target_dir, program_src],
            capture_output=True,
            text=True,
        )
        if "failed" in result.stderr.lower():
            raise Exception("|".join([result.stderr, result.stdout]))
    except Exception as e:
        print(f"pynadac execution failed: [{e}]")
        sys.exit(1)

    only_file_name = os.path.basename(program_src)
    program_name = os.path.splitext(only_file_name)[0]
    compiled_name = program_name + ".nada.bin"

    # 2. Initialize NillionClient against nillion-devnet
    # Create Nillion Client for user
    client = create_nillion_client(userkey, nodekey)

    party_id = client.party_id
    user_id = client.user_id

    # 3. Pay for and store the program
    # Set the program name and path to the compiled program
    program_mir_path = os.path.join(target_dir, compiled_name)

    # Create payments config, client and wallet
    payments_config = create_payments_config(chain_id, grpc_endpoint)
    payments_client = LedgerClient(payments_config)
    payments_wallet = LocalWallet(
        PrivateKey(bytes.fromhex(os.getenv("NILLION_NILCHAIN_PRIVATE_KEY_0"))),
        prefix="nillion",
    )

    # Pay to store the program and obtain a receipt of the payment
    receipt_store_program = await get_quote_and_pay(
        client,
        nillion.Operation.store_program(program_mir_path),
        payments_wallet,
        payments_client,
        cluster_id,
    )

    # Store the program
    action_id = await client.store_program(
        cluster_id, program_name, program_mir_path, receipt_store_program
    )

    # Create a variable for the program_id, which is the {user_id}/{program_name}. We will need this later
    program_id = f"{user_id}/{program_name}"
    print("Stored program. action_id:", action_id)
    print("Stored program_id:", program_id)

    # 4. Create the 1st secret, add permissions, pay for and store it in the network
    # Create a secret named "my_int1" with any value, ex: 500
    new_secret = nillion.NadaValues(
        {
            "my_int1": nillion.SecretInteger(500),
        }
    )

    # Set the input party for the secret
    # The party name needs to match the party name that is storing "my_int1" in the program
    party_name = "Party1"

    # Set permissions for the client to compute on the program
    permissions = nillion.Permissions.default_for_user(client.user_id)
    permissions.add_compute_permissions({client.user_id: {program_id}})

    # Pay for and store the secret in the network and print the returned store_id
    receipt_store = await get_quote_and_pay(
        client,
        nillion.Operation.store_values(new_secret, ttl_days=5),
        payments_wallet,
        payments_client,
        cluster_id,
    )
    # Store a secret
    store_id = await client.store_values(
        cluster_id, new_secret, permissions, receipt_store
    )
    print(f"Computing using program {program_id}")
    print(f"Use secret store_id: {store_id}")

    # 5. Create compute bindings to set input and output parties, add a computation time secret and pay for & run the computation
    compute_bindings = nillion.ProgramBindings(program_id)
    compute_bindings.add_input_party(party_name, party_id)
    compute_bindings.add_output_party(party_name, party_id)

    # Add my_int2, the 2nd secret at computation time
    computation_time_secrets = nillion.NadaValues(
        {"my_int2": nillion.SecretInteger(10)}
    )

    # Pay for the compute
    receipt_compute = await get_quote_and_pay(
        client,
        nillion.Operation.compute(program_id, computation_time_secrets),
        payments_wallet,
        payments_client,
        cluster_id,
    )

    # Compute on the secret
    compute_id = await client.compute(
        cluster_id,
        compute_bindings,
        [store_id],
        computation_time_secrets,
        receipt_compute,
    )

    # 8. Return the computation result
    print(f"The computation was sent to the network. compute_id: {compute_id}")
    while True:
        compute_event = await client.next_compute_event()
        if isinstance(compute_event, nillion.ComputeFinishedEvent):
            print(f"✅  Compute complete for compute_id {compute_event.uuid}")
            print(f"🖥️  The result is {compute_event.result.value}")

            actual_result = int(compute_event.result.value["my_output"])
            if actual_result == expected_result:
                print("🦄  The computed value is as expected")
                return
            else:
                print(
                    "🚨  The computed value is not as expected, got: {actual_result} but expected {expected_result}"
                )
                return


if __name__ == "__main__":
    asyncio.run(main())

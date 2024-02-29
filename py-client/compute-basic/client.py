import asyncio
import json
import os
import py_nillion_client


SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
with open(os.path.join(SCRIPT_DIR, "local.json"), "r") as fp:
    config = json.load(fp)


async def main():
    bootnodes = config['bootnodes']
    cluster_id = config['cluster_id']
    program_id = config['programs']['basic']

    payments_config = py_nillion_client.PaymentsConfig(
        config['payments_config']['rpc_endpoint'],
        config['payments_config']['signer']['wallet']['private_key'],
        int(config['payments_config']['signer']['wallet']['chain_id']),
        config['payments_config']['smart_contract_addresses']['payments'],
        config['payments_config']['smart_contract_addresses']['blinding_factors_manager'],
    )

    nodekey = py_nillion_client.NodeKey.from_file(config['keypath']['node'])
    userkey = py_nillion_client.UserKey.from_file(config['keypath']['wuser'])

    # Create Nillion Client
    client = py_nillion_client.NillionClient(
        nodekey,
        bootnodes,
        py_nillion_client.ConnectionMode.relay(),
        userkey,
        payments_config
    )

    # SecretInteger as in my_program
    my_int1 = py_nillion_client.SecretInteger(42)

    # SecretInteger as in my_program
    my_int2 = py_nillion_client.SecretInteger(24)

    to_be_store_secrets = py_nillion_client.Secrets({"my_int1": my_int1})

    # We bind the storage of the secret to the circuit and the concrete party
    bindings = py_nillion_client.ProgramBindings(program_id)
    bindings.add_input_party("Party1", client.party_id())
    print(f"Storing secret: {to_be_store_secrets}")
    # Store the secret
    store_id = await client.store_secrets(
        cluster_id, bindings, to_be_store_secrets, None
    )
    print(f"Stored secret, store_id ={store_id}")
    to_be_used_in_computation = py_nillion_client.Secrets({"my_int2": my_int2})

    # bind the parties in the computation to the client
    bindings = py_nillion_client.ProgramBindings(program_id)
    bindings.add_input_party("Party1", client.party_id())
    bindings.add_output_party("Party1", client.party_id())

    print(f"Computing using program {program_id}")
    print(f"Stored secret: {store_id}")
    print(f"Provided secret: {to_be_used_in_computation}")
    # do the computation
    compute_id = await client.compute(
        cluster_id,
        bindings,
        [store_id],
        to_be_used_in_computation,
        py_nillion_client.PublicVariables({}),
    )

    print(f"Computation sent to the network, compute_id = {compute_id}")
    print("Waiting computation response")
    while True:
        event = await client.next_compute_event()
        if isinstance(event, py_nillion_client.ComputeFinishedEvent):
            print(
                f"Received computation result for {event.uuid}, value = {event.result.value}"
            )
            break

    print(f"Retrieving secret from the network")
    result = await client.retrieve_secret(cluster_id, store_id, "my_int1")
    print(f"Retrieved secret, value = {result[1].value}")


asyncio.run(main())

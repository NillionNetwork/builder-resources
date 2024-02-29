import React from "react";
import Button from "./Button";

import config from "../../nillion.config";
import { useClient } from "../context/nillion";

interface ComputeProps {}

const bigIntFromByteArray = (byteArray: Uint8Array) => {
  let hexString = "0x";
  for (let i = byteArray.length - 1; i >= 0; i--) {
    hexString += byteArray[i].toString(16).padStart(2, "0");
  }
  return BigInt(hexString);
};

const Compute: React.FC<ComputeProps> = () => {
  const { client, nillion } = useClient();
  const [retrievalCode, setRetrievalCode] = React.useState<String | null>(null);

  const actionCompute = async () => {
    console.log(`starting client.compute`);
    let party_id = await client.party_id();
    console.log(party_id);

    try {
      console.log(`>>> new WasmProgramBindings ${config.programs.simple_mult}`);
      let program_bindings = new nillion.WasmProgramBindings(
        config.programs.simple_mult,
      );
      console.log(`<<< new WasmProgramBindings ${config.programs.simple_mult}`);
      console.log(`>>> adding party bindings to WasmProgramBindings`);
      program_bindings.add_input_party("Dealer", party_id);
      console.log(`<<< adding party bindings to WasmProgramBindings`);

      console.log(`>>> adding store_secrets from config`);
      const store_secrets = new nillion.NilSecrets();
      for (let secret_id of Object.keys(config.store_secrets)) {
        console.log(`>>>--> secret_id: ${secret_id}`);
        if (config.store_secrets[secret_id].hasOwnProperty("BigUint")) {
          console.log(
            `>>>-----> biguint: ${
              config.store_secrets[secret_id].BigUint.value
            }`,
          );
          const encoded = await nillion.encode_unsigned_integer_secret(
            secret_id,
            { as_string: config.store_secrets[secret_id].BigUint.value },
          );
          await store_secrets.insert(encoded);
        }
      }
      console.log(`>>> client.store with program binding`);
      let store_id = await client.store(
        config.cluster_id,
        store_secrets,
        program_bindings,
      );
      console.log(`<<< client.store: ${store_id}`);

      console.log(`>>> new WasmProgramBindings ${config.programs.simple_mult}`);
      program_bindings = new nillion.WasmProgramBindings(
        config.programs.simple_mult,
      );
      console.log(`<<< new WasmProgramBindings ${config.programs.simple_mult}`);
      console.log(`>>> adding party bindings to WasmProgramBindings`);
      program_bindings.add_input_party("Dealer", party_id);
      program_bindings.add_output_party("Result", party_id);
      console.log(`<<< adding party bindings to WasmProgramBindings`);

      console.log(`>>> adding compute_secrets from config`);
      const compute_secrets = new nillion.NilSecrets();
      for (let secret_id of Object.keys(config.compute_secrets)) {
        if (config.compute_secrets[secret_id].hasOwnProperty("BigUint")) {
          const encoded = await nillion.encode_unsigned_integer_secret(
            secret_id,
            { as_string: config.compute_secrets[secret_id].BigUint.value },
          );
          await compute_secrets.insert(encoded);
        }
      }
      console.log(`<<< adding compute_secrets from config`);

      console.log(`>>> running client.compute`);
      const compute_result_uuid = await client.compute(
        config.cluster_id,
        program_bindings,
        [store_id],
        compute_secrets,
      );
      console.log(`<<< running client.compute ${compute_result_uuid}`);

      console.log(`>>> running client.compute`);
      const compute_result = await client.compute_result(
        compute_result_uuid,
      );
      console.log(`<<< running client.compute ${compute_result}`);

      const my_int = bigIntFromByteArray(compute_result.value);
      setRetrievalCode(my_int.toString());

      console.log(`client.compute completed - ${my_int}`);
      console.log(`DONE`);
      console.log(`finished client.compute`);

    } catch (error) {
      console.log(`ERROR`);
      console.log(JSON.stringify(error, null, 4));
    }
  };

  return (
    <section className="p-6 font-mono">
      <h3 className="px-4 py-3 border" id="test-3-name">
        test-3: compute
        <p>{`Expecting: ${config.compute_expected_result}`}</p>
      </h3>
      <ul>
        <li className="px-4 py-3 border">
          <Button
            id="test-3-trigger"
            data-expected={config.compute_expected_result}
            className="text-blue-700 border border-blue-500 rounded"
            onClick={actionCompute}
          >
            test-3-trigger
          </Button>
        </li>
        <li className="px-4 py-3 border">
          <input
            type="text"
            className="py-3 px-4 w-full rounded font-thin focus:outline-none"
            id="test-3-input"
            disabled={true}
            value="input hardcoded into Compute.tsx"
          />
        </li>
        <li className="px-4 py-3 border">
          {retrievalCode ? <div id="test-3-result">{retrievalCode}</div> : (
            <div>
              <i>pending result...</i>
            </div>
          )}
        </li>
      </ul>
    </section>
  );
};

export default Compute;
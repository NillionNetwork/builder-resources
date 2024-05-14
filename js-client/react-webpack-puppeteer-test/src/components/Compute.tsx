import React from "react";
import Button from "./Button";

import config from "../../nillion.config";
import { useClient } from "../context/nillion";

interface ComputeProps { }

const Compute: React.FC<ComputeProps> = () => {
  const { client, nillion } = useClient();
  const [retrievalCode, setRetrievalCode] = React.useState<String | null>(null);

  const actionCompute = async () => {
    console.log(`starting client.compute`);
    let party_id = (typeof client.party_id === "function")
      ? client.party_id()
      : client.party_id;
    console.log(party_id);

    try {
      console.log(`>>> new ProgramBindings ${config.programs.simple_mult}`);
      let program_bindings = new nillion.ProgramBindings(
        config.programs.simple_mult,
      );
      console.log(`<<< new ProgramBindings ${config.programs.simple_mult}`);
      console.log(`>>> adding party bindings to ProgramBindings`);
      program_bindings.add_input_party("Dealer", party_id);
      console.log(`<<< adding party bindings to ProgramBindings`);

      console.log(`>>> adding store_secrets from config`);
      const store_secrets = new nillion.Secrets();
      for (let secret_id of Object.keys(config.store_secrets)) {
        console.log(`>>>--> secret_id: ${secret_id}`);
        if (config.store_secrets[secret_id].hasOwnProperty("BigUint")) {
          console.log(
            `>>>-----> biguint: ${config.store_secrets[secret_id].BigUint.value
            }`,
          );
          store_secrets.insert(
            secret_id,
            nillion.Secret.new_unsigned_integer(
              config.store_secrets[secret_id].BigUint.value,
            ),
          );
        }
      }
      console.log(`>>> client.store with program binding`);
      let store_id = await client.store_secrets(
        config.cluster_id,
        store_secrets,
        program_bindings,
      );
      console.log(`<<< client.store: ${store_id}`);

      console.log(`>>> new ProgramBindings ${config.programs.simple_mult}`);
      program_bindings = new nillion.ProgramBindings(
        config.programs.simple_mult,
      );
      console.log(`<<< new ProgramBindings ${config.programs.simple_mult}`);
      console.log(`>>> adding party bindings to ProgramBindings`);
      program_bindings.add_input_party("Dealer", party_id);
      program_bindings.add_output_party("Result", party_id);
      console.log(`<<< adding party bindings to ProgramBindings`);

      console.log(`>>> adding compute_secrets from config`);
      const compute_secrets = new nillion.Secrets();
      for (let secret_id of Object.keys(config.compute_secrets)) {
        if (config.compute_secrets[secret_id].hasOwnProperty("BigUint")) {
          compute_secrets.insert(
            secret_id,
            nillion.Secret.new_unsigned_integer(
              config.compute_secrets[secret_id].BigUint.value,
            ),
          );
        }
      }
      const public_variables = new nillion.PublicVariables();

      console.log(`<<< adding compute_secrets from config`);

      console.log(`>>> running client.compute`);
      const compute_result_uuid = await client.compute(
        config.cluster_id,
        program_bindings,
        [store_id],
        compute_secrets,
        public_variables,
      );
      console.log(`<<< running client.compute ${compute_result_uuid}`);

      console.log(`>>> running client.compute_result`);
      const compute_result = await client.compute_result(
        compute_result_uuid,
      );
      console.log(`<<< running client.compute_result`);

      setRetrievalCode(compute_result["Add0"].toString());

      console.log(`DONE`);
      console.log(`finished client.compute`);
    } catch (error) {
      console.log(`ERROR: ${error}`);
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

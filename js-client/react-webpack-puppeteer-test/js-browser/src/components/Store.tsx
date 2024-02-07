import React from "react";
import Button from "./Button";

import config from "../../nillion.config";
import { useClient } from "../context/nillion";

interface StoreProps {}

const toByteArray = (str: string | undefined): Uint8Array => {
  const encoder = new TextEncoder();
  const byteArray = encoder.encode(str);
  return byteArray;
};

const Store: React.FC<StoreProps> = () => {
  const { client, nillion } = useClient();
  const [retrievalCode, setRetrievalCode] = React.useState<string | null>(null);
  const content = React.useRef<HTMLInputElement>(null);

  console.log(JSON.stringify(config, null, 4));

  const actionStore = async () => {
    const resultBytes = toByteArray(content.current?.value);
    console.log(`starting client.store of: ${resultBytes.byteLength} bytes`);

    const t0 = performance.now();
    try {
      console.profile();
      const collection = new nillion.NilSecrets();
      const encoded = await nillion.encode_blob_secret(
        `My Secrets ID`,
        {
          bytes: resultBytes,
        },
      );
      await collection.insert(encoded);
      console.log(
        `going to start store of string [${content.current?.value}] to cluster: ${config.cluster_id}`,
      );
      let result = await client.store(config.cluster_id, collection);
      console.profileEnd();
      const t1 = performance.now();
      console.log(`DONE - took ${t1 - t0} milliseconds.`);

      setRetrievalCode(result);
      console.log(`client.store ID: ${result}`);
      console.log(`finished client.store`);
    } catch (error) {
      const t1 = performance.now();
      console.log(`ERROR - took ${t1 - t0} milliseconds.`);
      console.log(JSON.stringify(error, null, 4));
    }
  };

  return (
    <section className="p-6 font-mono">
      <h3 className="px-4 py-3 border" id="test-1-name">
        test-1: store
        {retrievalCode && " ✅"}
      </h3>
      <ul>
        <li className="px-4 py-3 border">
          <Button
            id="test-1-trigger"
            className="text-blue-700 border border-blue-500 rounded"
            onClick={actionStore}
            disabled={content.current?.value ? true : false}
          >
            test-1-trigger
          </Button>
        </li>
        <li className="px-4 py-3 border">
          <input
            type="text"
            className="py-3 px-4 w-full rounded font-thin focus:outline-none"
            id="test-1-input"
            ref={content}
          />
        </li>
        <li className="px-4 py-3 border">
          {retrievalCode ? <div id="test-1-result">{retrievalCode}</div> : (
            <div>
              <i>pending result...</i>
            </div>
          )}
        </li>
      </ul>
    </section>
  );
};

export default Store;

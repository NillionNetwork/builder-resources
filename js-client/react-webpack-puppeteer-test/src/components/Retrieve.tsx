import React from "react";
import Button from "./Button";

import config from "../../nillion.config";
import { useClient } from "../context/nillion";

interface RetrieveProps { }

const Retrieve: React.FC<RetrieveProps> = () => {
  const { client, nillion } = useClient();
  const [retrievalCode, setRetrievalCode] = React.useState<string | null>(null);
  const content = React.useRef<HTMLInputElement>(null);

  const actionRetrieve = async () => {
    const file_uuid = content.current?.value;
    console.log(`starting client.retrieve of: ${file_uuid}`);

    try {
      const mySecretsId = "My Secrets ID";
      console.log(`starting client.retrieve(${file_uuid})`);

      const secret = await client.retrieve(
        config.cluster_id,
        file_uuid,
        mySecretsId,
      );

      console.log(`client.retrieve completed`);
      console.log(JSON.stringify(secret, null, 4));
      const result = await nillion.decode_bytearray_secret(secret);
      console.log(`decode_bytearray_secret completed`);
      console.log(`DONE`);
      console.log(`finished client.retrieve`);
      // console.log(JSON.stringify(result, null, 4));
      // createFileFromByteArray(result, "output.txt");
      setRetrievalCode(new TextDecoder("utf-8").decode(result));
    } catch (error) {
      console.log(`ERROR`);
      console.log(error);
    }
  };

  return (
    <section className="p-6 font-mono">
      <h3 className="px-4 py-3 border" id="test-2-name">
        test-2: retrieve
        {retrievalCode && " ✅"}
      </h3>
      <ul>
        <li className="px-4 py-3 border">
          <Button
            id="test-2-trigger"
            className="text-blue-700 border border-blue-500 rounded"
            onClick={actionRetrieve}
            disabled={content.current?.value ? true : false}
          >
            test-2-trigger
          </Button>
        </li>
        <li className="px-4 py-3 border">
          <input
            type="text"
            className="py-3 px-4 w-full rounded font-thin focus:outline-none"
            id="test-2-input"
            ref={content}
          />
        </li>
        <li className="px-4 py-3 border">
          {retrievalCode
            ? <div id="test-2-result">{retrievalCode}</div>
            : <div><i>pending result...</i></div>}
        </li>
      </ul>
    </section>
  );
};

export default Retrieve;

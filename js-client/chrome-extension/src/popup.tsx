import { useEffect, useRef, useState } from "react";

import * as nillion from "@nillion/nillion-client-js-browser";

function IndexOptions() {

  const [client, setClient] = useState(null);
  const [peerId, setPeerId] = useState(null);

  const loaded = useRef(false);

  const config = {
    "bootnodes": [
      "/ip4/127.0.0.1/tcp/54633/ws/p2p/12D3KooWA92jGs5nqrhXR7DFSz121jSsQG82EVd3oEJGvmnJEtvR",
    ],
    "cluster_id": "be1792bf-c1b8-429a-88ed-ac6b4cc32bba",
    "payments_config": {
      "rpc_endpoint": "http://localhost:45659",
      "smart_contract_addresses": {
        "blinding_factors_manager": "a513e6e4b8f2a923d98304ec87f64353c4d5c853",
        "payments": "5fc8d32690cc91d4c39d9d3abcbd16989f875707",
      },
      "signer": {
        "wallet": {
          "chain_id": 31337,
          "private_key":
            "92db14e403b83dfe3df233f83dfa3a0d7096f21ca9b0d6d6b8d88b2b4ec1564e",
        },
      },
    },
    "keypath": {
      "node": "/tmp/tmp.hxYdpSAcEy",
      "user": "/tmp/tmp.gb6Q4DqKV3",
    },
    "programs": {
      "basic":
        "4ztcmrQztaTL1mCsB5BQPe6VVVKG8mHb5EnKd7aKGpc6Y2o161PRxwjJpW8rNoQsihShUpv912pCFEUTtPs3Gtsa/basic",
      "simple":
        "4ztcmrQztaTL1mCsB5BQPe6VVVKG8mHb5EnKd7aKGpc6Y2o161PRxwjJpW8rNoQsihShUpv912pCFEUTtPs3Gtsa/simple",
    },
  };

  useEffect(() => {
    const loadWasm = async () => {
      if (loaded.current || client !== null) return;
      loaded.current = true;
      try {
        console.error(`>> STARTING LOAD nillion_client_js_browser`);

        await nillion.default();

        // if you set the 4th positional argument to true, it will activate
        // the remote websocket logging client that expects to find a listener
        // active on port 11100
        // You can launch a listener with a simple tool like https://github.com/vi/websocat
        // $ websocat -s 11100 | tee /tmp/wasm.log
        var userkey = nillion.UserKey.generate();
        var nodekey = nillion.NodeKey.from_seed("this is a test");
        const wasmclient = new nillion.WasmNillionClient(
          userkey,
          nodekey,
          config.bootnodes,
          false,
          config.payments_config,
        );
        setClient(wasmclient);

        console.error(`<< FINISHED LOAD nillion_client_js_browser`);
      } catch (err) {
        console.error(`failed to load wasm module: ${err}`);
      }
    };
    loadWasm();
  }, [setClient, nillion]);

  useEffect(() => {
    const getPeerId = async () => {
      if (client === null) return;
      const peer_id = await client.party_id();
      setPeerId(peer_id);
    };
    getPeerId();
  }, [client, nillion]);

  return (
    <div
      style={{
        padding: 16,
      }}
    >
      <h1>
        Nillion JS Client Extension!
      </h1>
      Client Loaded:
      <span className="plasmo-inline-flex plasmo-items-center plasmo-justify-center plasmo-w-8 plasmo-h-4 plasmo-ml-2 plasmo-text-xs plasmo-font-semibold plasmo-rounded-full">
        {client === null ? "❌" : "✅"}
      </span>
      {peerId && (
        <span className="plasmo-inline-flex plasmo-items-center plasmo-justify-center plasmo-w-8 plasmo-h-4 plasmo-ml-2 plasmo-text-xs plasmo-font-semibold plasmo-rounded-full">
          {peerId}
        </span>
      )}
    </div>
  );
}

export default IndexOptions;

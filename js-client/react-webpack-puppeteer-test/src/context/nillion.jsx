import React, { createContext, useContext, useEffect, useState } from "react";

import config from "../../nillion.config";

const defaultState = {
  client: null,
  nillion: null,
};

const NillionContext = createContext(defaultState);
export const useClient = () => useContext(NillionContext);
export const NillionContextProvider = (props) => {
  const [client, setClient] = useState(null);
  const [nillion, setNillion] = useState(null);

  const loaded = React.useRef(false);

  useEffect(() => {
    const loadWasm = async () => {
      if (loaded.current || client !== null || nillion !== null) return;
      loaded.current = true;
      try {
        console.error(`>> STARTING LOAD nillion_client_js_browser`);
        const nil = await import("@nillion/nillion-client-js-browser");

        await nil.default();

        var userkey = nil.UserKey.generate();
        var nodekey = nil.NodeKey.from_seed(
          config.private_key_seed,
        );

        // if you set the 4th positional argument to true, it will activate
        // the remote websocket logging client that expects to find a listener
        // active on port 11100
        // You can launch a listener with a simple tool like https://github.com/vi/websocat
        // $ websocat -s 11100 | tee /tmp/wasm.log
        const wasmclient = new nil.NillionClient(
          userkey,
          nodekey,
          config.bootnodes_ws,
          config.payments_config,
        );
        setClient(wasmclient);
        setNillion(nil);

        console.error(`<< FINISHED LOAD nillion_client_js_browser`);
      } catch (err) {
        console.error(`failed to load wasm module: ${err}`);
      }
    };
    loadWasm();
  }, [setClient, setNillion]);

  return (
    <NillionContext.Provider
      value={{ client, config, nillion }}
    >
      {props.children}
    </NillionContext.Provider>
  );
};

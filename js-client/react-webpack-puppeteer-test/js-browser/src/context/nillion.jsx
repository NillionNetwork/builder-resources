import React, { useState, useEffect, createContext, useContext } from "react";

import config from "../../nillion.config";

const defaultState = {
  client: null,
  nillion: null,
  timing: {},
};

const NillionContext = createContext(defaultState);
export const useClient = () => useContext(NillionContext);
export const NillionContextProvider = (props) => {
  const [client, setClient] = useState(null);
  const [nillion, setNillion] = useState(null);
  const [timing, setTiming] = useState({});

  const loaded = React.useRef(false)

  useEffect(() => {
    const loadWasm = async () => {
      if (loaded.current || client !== null || nillion !== null) return;
      loaded.current = true;
      try {
        console.error(`>> STARTING LOAD nillion_client_js_browser`);
        const t0 = performance.now();
        const nil = await import("@nillion/nillion-client-js-browser");
        const t1 = performance.now();

        const t2 = performance.now();
        await nil.default();

        // if you set the 4th positional argument to true, it will activate
        // the remote websocket logging client that expects to find a listener
        // active on port 11100
        // You can launch a listener with a simple tool like https://github.com/vi/websocat
        // $ websocat -s 11100 | tee /tmp/wasm.log
        const wasmclient = new nil.WasmNillionClient(config.user_key, config.private_key_seed, config.bootnodes, false, config.payments_config);
        setClient(wasmclient);
        setNillion(nil);

        const t3 = performance.now();
        setTiming({ import: t1 - t0, constructor: t3 - t2 });
        console.error(`<< FINISHED LOAD nillion_client_js_browser`);
      } catch (err) {
        console.error(`failed to load wasm module: ${err}`);
      }
    };
    loadWasm();
  }, [setClient, setNillion]);

  console.log(client);
  console.log(nillion);

  return (
    <NillionContext.Provider value={{ client, timing, setTiming, config, nillion }}>
      {props.children}
    </NillionContext.Provider>
  );
};

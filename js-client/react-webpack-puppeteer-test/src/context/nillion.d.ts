import * as nillion from "@nillion/nillion-client-js-browser";
import React from "react";

interface NillionConfig {
  private_key_seed: string;
  cluster_id: string;
  bootnodes: string[];
}

interface NillionContextProviderProps {
  children: any;
}

interface TimingObject {
  import: number;
  constructor: string;
}

interface NillionContextType {
  client: nillion.WasmNillionClient;
  nillion: typeof nillion;
  config: NillionConfig;
  timing: TimingObject;
  setTiming: React.Dispatch<React.SetStateAction<TimingObject>>;
}

declare const NillionContext: React.Context<NillionContextType>;
declare const NillionContextProvider: React.FC<NillionContextProviderProps>;
declare function useClient(): NillionContextType;

export { NillionContext, NillionContextProvider, useClient };

type Secret = {
  value: string;
  encoding: string;
};

type Secrets = {
  [key: string]: Secret;
};

declare const config: {
  bootnodes: string[];
  cluster_id: string;
  compute_expected_result: string,
  compute_secrets: {
    [key: string]: Secrets;
  };
  payments_config: {
    rpc_endpoint: string;
    signer: {
      wallet: {
        "chain_id": number;
        "private_key": string;
      };
    };
    smart_contract_addresses: {
      "blinding_factors_manager": string;
      "payments": string;
    };
  };
  private_key_seed: string;
  program_id: string;
  store_secrets: {
    [key: string]: Secrets;
  };
  user_key: string;
};
export default config;

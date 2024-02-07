import autoconfig from './nillion.config.json';

const config = {
  ...autoconfig,
  private_key_seed: "fiddler on the roof",
  store_secrets: {
    I03: {
      BigUint: {
        value: "2877",
      },
    },
    I04: {
      BigUint: {
        value: "2564",
      },
    },
  },
  compute_secrets: {
    I00: {
      BigUint: {
        value: "17517",
      },
    },
    I02: {
      BigUint: {
        value: "15981",
      },
    },
    I01: {
      BigUint: {
        value: "5226",
      },
    },
  },
  compute_expected_result: 1462969515630
};
export default config;

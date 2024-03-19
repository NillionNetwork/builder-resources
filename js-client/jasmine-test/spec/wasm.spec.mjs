import * as nillion from "@nillion/nillion-client-js-browser";

import { loadFixtureConfig } from "../src/config.js";
import {
  bigIntFromByteArray,
  strFromByteArray,
  strToByteArray,
} from "../src/utils.js";

window.jasmine.DEFAULT_TIMEOUT_INTERVAL = 500;

async function new_nillion_client(config) {
  await nillion.default();

  var user_key = nillion.UserKey.from_seed(
    "this is the writer key"
  );
  var node_key = nillion.NodeKey.from_seed(
    "test-seed-0",
  );

  // $ websocat -s 11100 | tee /tmp/wasm.log
  return new nillion.NillionClient(
    user_key,
    node_key,
    config.bootnodes_ws,
    false,
    config.payments_config,
  );
}

const encode_and_insert = async (secrets, id, value) => {
  const encoded = await nillion.encode_unsigned_integer_secret(
    id,
    { as_string: String(value) },
  );
  await secrets.insert(encoded);
};
// We cannot create multiple clients that share the same
// node key and cluster_id
describe("Nillion Client", () => {
  let context = {};

  beforeAll(async () => {
    context.config = await loadFixtureConfig();
    context.it_requires_programs = () => {
      // helper fn -
      // always expect simple_mult program to be loaded
      return !context.config.programs?.simple_mult
        ? pending("programs not loaded - skipping test")
        : null;
    };
    context.test1 = {
      expected_party_id: "12D3KooWMG9FbK6gDYMBJxJk9S4m9AK69r5G3XLJM2CtkKGurjKc",
      input: "this is a test",
      input_2: "this is a second test",
    };
  });

  //<==============================================
  // TEST 1
  it("should create a nillion js client", async () => {
    context.client = await new_nillion_client(context.config);
    expect(context.client).toBeDefined();
    expect(context.client).toBeInstanceOf(nillion.NillionClient);
  });

  it("should have predictable party_id because of the hardcoded node key seed", async () => {
    let my_party_id = await context.client.party_id();
    expect(my_party_id).toBeDefined();
    expect(my_party_id).toEqual(context.test1.expected_party_id);
    context.test1.party_id = my_party_id;
  });

  it("should be able to encode a blob secret (string)", async () => {
    const resultBytes = strToByteArray(context.test1.input);
    const encoded = await nillion.encode_blob_secret(
      "secret-blob",
      { bytes: resultBytes },
    );
    expect(encoded).toBeDefined();
    context.test1.input_encoded_str = encoded;
    expect(encoded).toBeInstanceOf(nillion.Secret);
  });

  it("should be able to push a blob secret to Secrets", async () => {
    const secrets = new nillion.Secrets();
    expect(secrets).toBeInstanceOf(nillion.Secrets);
    expect(secrets).toBeDefined();
    await secrets.insert(context.test1.input_encoded_str);
    context.test1.secrets = secrets;
  });

  it("should be able to store a Secrets", async () => {
    let result = await context.client.store_secrets(
      context.config.cluster_id,
      context.test1.secrets,
    );
    expect(result).toBeDefined();
    expect(result).not.toBe("");
    context.test1.store_result = result;
  }, 20000);

  it("should be able to retrieve a Secrets", async () => {
    expect(context.test1.store_result).toBeDefined();
    const secret = await context.client.retrieve_secret(
      context.config.cluster_id,
      context.test1.store_result,
      "secret-blob",
    );
    expect(secret).toBeDefined();
    expect(secret).not.toBe("");
    context.test1.retrieve_result = secret;
  }, 20000);

  it("should be able to decode a blob secret", async () => {
    expect(context.test1.retrieve_result).toBeDefined();
    const result = await nillion.decode_bytearray_secret(
      context.test1.retrieve_result,
    );
    let result_decoded = strFromByteArray(result);
    expect(result_decoded).toBe(context.test1.input);
  });

  it("should be able to encode a second blob secret (string)", async () => {
    const resultBytes = strToByteArray(context.test1.input_2);
    const encoded = await nillion.encode_blob_secret(
      "secret-blob",
      { bytes: resultBytes },
    );
    expect(encoded).toBeDefined();
    context.test1.input_encoded_str_2 = encoded;
    expect(encoded).toBeInstanceOf(nillion.Secret);
  });

  it("should be able to push a second blob secret to Secrets", async () => {
    const secrets = new nillion.Secrets();
    expect(secrets).toBeInstanceOf(nillion.Secrets);
    expect(secrets).toBeDefined();
    await secrets.insert(context.test1.input_encoded_str_2);
    context.test1.secrets_2 = secrets;
  });

  it("should be able to store a second Secrets", async () => {
    let result = await context.client.store_secrets(
      context.config.cluster_id,
      context.test1.secrets_2,
    );
    expect(result).toBeDefined();
    expect(result).not.toBe("");
    context.test1.store_result_2 = result;
  }, 20000);

  it("should be able to create a program binding", async () => {
    context.it_requires_programs();
    expect(context.config.programs.simple_mult).toBeDefined();
    const result = new nillion.ProgramBindings(
      context.config.programs.simple_mult,
    );
    context.test1.program_binding_simple_mult = result;
    expect(result).toBeInstanceOf(nillion.ProgramBindings);
  });

  it("should be able to encode an signed integer secret", async () => {
    const encoded = await nillion.encode_signed_integer_secret(
      "secret-integer",
      { as_string: "-42" },
    );
    context.test1.input_encoded_integer = encoded;
    expect(encoded).toBeInstanceOf(nillion.Secret);
  });

  it("should be able to encode an unsigned integer secret", async () => {
    const encoded = await nillion.encode_unsigned_integer_secret(
      "secret-uinteger",
      { as_string: "42" },
    );
    context.test1.input_encoded_uinteger = encoded;
    expect(encoded).toBeInstanceOf(nillion.Secret);
  });

  // The parties of the simple_mult program are
  // - Dealer
  // - Result
  it("should be able to add_input_party to a program binding", async () => {
    context.it_requires_programs();
    context.test1.program_binding_simple_mult.add_input_party(
      "Dealer",
      context.test1.party_id,
    );
  });

  it("should be able to add_output_party to a program binding", async () => {
    context.it_requires_programs();
    context.test1.program_binding_simple_mult.add_output_party(
      "Result",
      context.test1.party_id,
    );
  });

  it("should be able to prep compute inline secrets: [simple_mult]", async () => {
    const compute_secrets = new nillion.Secrets();
    await encode_and_insert(compute_secrets, `I00`, 17517);
    await encode_and_insert(compute_secrets, `I01`, 5226);
    await encode_and_insert(compute_secrets, `I02`, 15981);
    context.test1.compute_secrets = compute_secrets;
  });

  it(
    "should be able to prep stored compute secrets: [simple_mult]",
    async () => {
      context.it_requires_programs();

      const my_secrets = new nillion.Secrets();
      await encode_and_insert(my_secrets, `I03`, 2877);
      await encode_and_insert(my_secrets, `I04`, 2564);

      const bindings = new nillion.ProgramBindings(
        context.config.programs.simple_mult,
      );
      expect(bindings).toBeDefined();

      bindings.add_input_party("Dealer", context.test1.party_id);
      bindings.add_output_party("Result", context.test1.party_id);

      let store_uuid = await context.client.store_secrets(
        context.config.cluster_id,
        my_secrets,
        bindings,
      );
      expect(store_uuid).toBeDefined();
      context.test1.compute_store_secrets_uuid = store_uuid;
    },
    35000,
  );

  it("should be able to compute program: [simple_mult]", async () => {
    context.it_requires_programs();
    if (!context.test1.compute_store_secrets_uuid) {
      pending("compute store secrets uuid not set, skipping test.");
    }
    const bindings = new nillion.ProgramBindings(
      context.config.programs.simple_mult,
    );
    bindings.add_input_party("Dealer", context.test1.party_id);
    bindings.add_output_party("Result", context.test1.party_id);

    const compute_result_uuid = await context.client.compute(
      context.config.cluster_id,
      bindings,
      [context.test1.compute_store_secrets_uuid],
      context.test1.compute_secrets,
    );

    expect(compute_result_uuid).toBeDefined();
    expect(compute_result_uuid).not.toBe("");
    context.test1.compute_result = compute_result_uuid;
  }, 30000);

  it("should be able to get a result from compute operation", async () => {
    // compute_result
    if (!context.test1.compute_result) {
      pending("compute result not set, skipping test.");
    }
    const compute_result = await context.client.compute_result(
      context.test1.compute_result,
    );
    expect(compute_result).toBeDefined();
    expect(compute_result).not.toBe("");
    const my_int = bigIntFromByteArray(compute_result.value);
    expect(typeof my_int).toBe("bigint");
    expect(my_int).toEqual(BigInt(1462969515630));
  }, 10000);

  it("should be able to update a secret", async () => {
    const secrets = new nillion.Secrets();
    const encoded = await nillion.encode_signed_integer_secret(
      "another-integer",
      { as_string: "1024" },
    );
    await secrets.insert(encoded);
    const new_store_id = await context.client.update_secrets(
      context.config.cluster_id,
      context.test1.store_result,
      secrets,
    );

    // TODO: how can I check that the store has been updated? (maybe a compute program?)
    expect(new_store_id).toBeDefined();
    expect(new_store_id).not.toBe("");
    context.test1.store_result = new_store_id;
  }, 20000);

  // TODO: this test does not pass
  xit("should be able to retrieve_permissions", async () => {
    const result = await context.client.retrieve_permissions(
      context.config.cluster_id,
      context.test1.store_result,
      "another-integer",
    );
    expect(result).toBeDefined();
    expect(result).toBeInstanceOf(nillion.Permissions);
  }, 10000);

  // TODO: this test does not pass
  xit("should be able to delete a secret", async () => {
    expect(context.test1.store_result).toBeDefined();
    await context.client.delete_secrets(
      context.config.cluster_id,
      context.test1.store_result,
    );
    const secret = await context.client.retrieve_secret(
      context.config.cluster_id,
      context.test1.store_result,
    );
    expect(secret).not.toBeDefined();
  }, 10000);
});

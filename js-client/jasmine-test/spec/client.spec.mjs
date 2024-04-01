import * as nillion from "@nillion/nillion-client-js-browser";

import { loadFixtureConfig } from "../src/config.js";
import {
  bigIntFromByteArray,
  strFromByteArray,
  strToByteArray,
} from "../src/utils.js";

window.jasmine.DEFAULT_TIMEOUT_INTERVAL = 500;

describe("Nillion Client", () => {
  let context = {};

  beforeAll(async () => {
    await nillion.default();
    context.config = await loadFixtureConfig();
    context.test1 = {
      expected_party_id: "12D3KooWGq5MCUuLARrwM95muvipNWy4MqmCk41g9k9JVth6AF6e",
      input: "this is a test",
      program_id: context.config.programs.simple_mult
    };
  });

  //<==============================================
  // TEST 1
  it("should create a nillion js client", async () => {
    var user_key = nillion.UserKey.generate();
    var node_key = nillion.NodeKey.from_seed(
      "nillion-testnet-seed-1",
    );

    // $ websocat -s 11100 | tee /tmp/wasm.log
    context.client = new nillion.NillionClient(
      user_key,
      node_key,
      context.config.bootnodes_ws,
      context.config.payments_config,
    );
    expect(context.client).toBeDefined();
    expect(context.client).toBeInstanceOf(nillion.NillionClient);
  });

  it("should have predictable party_id because of the hardcoded node key seed", () => {
    let my_party_id = context.client.party_id();
    expect(my_party_id).toBeDefined();
    expect(my_party_id).toEqual(context.test1.expected_party_id);
    context.test1.party_id = my_party_id;
  });

  it("should be able to store secrets", async () => {
    const bytes = strToByteArray(context.test1.input);
    const secrets = new nillion.Secrets();
    secrets.insert("blob", nillion.Secret.new_blob(bytes));
    secrets.insert("int", nillion.Secret.new_integer("-42"));
    const store_id = await context.client.store_secrets(
      context.config.cluster_id,
      secrets,
    );
    expect(store_id).toBeDefined();
    expect(store_id).not.toBe("");
    context.test1.store_id = store_id;
    context.test1.original_blob = bytes;
    context.test1.original_integer = "-42";
  }, 20000);

  it("should be able to retrieve a blob secret", async () => {
    const secret = await context.client.retrieve_secret(
      context.config.cluster_id,
      context.test1.store_id,
      "blob",
    );
    expect(secret.to_byte_array(), context.test1.original_blob);
  }, 20000);

  it("should be able to retrieve an integer secret", async () => {
    const secret = await context.client.retrieve_secret(
      context.config.cluster_id,
      context.test1.store_id,
      "int",
    );
    expect(secret.to_integer(), context.test1.original_integer);
  }, 20000);

  it("should be able to create a program binding", async () => {
    const result = new nillion.ProgramBindings(
      context.test1.program_id,
    );
    context.test1.program_binding_simple = result;
    expect(result).toBeInstanceOf(nillion.ProgramBindings);
  });

  // The parties of the simple program are
  // - Dealer
  // - Result
  it("should be able to add_input_party to a program binding", async () => {
    context.test1.program_binding_simple.add_input_party(
      "Dealer",
      context.test1.party_id,
    );
  });

  it("should be able to add_output_party to a program binding", async () => {
    context.test1.program_binding_simple.add_output_party(
      "Result",
      context.test1.party_id,
    );
  });

  it("should be able to prep compute inline secrets", async () => {
    const compute_secrets = new nillion.Secrets();
    compute_secrets.insert("I00", nillion.Secret.new_unsigned_integer("17517"));
    compute_secrets.insert("I01", nillion.Secret.new_unsigned_integer("5226"));
    compute_secrets.insert("I02", nillion.Secret.new_unsigned_integer("15981"));
    context.test1.compute_secrets = compute_secrets;
  });

  it("should be able to store secrets for compute", async () => {
    const secrets = new nillion.Secrets();
    secrets.insert("I03", nillion.Secret.new_unsigned_integer("2877"));
    secrets.insert("I04", nillion.Secret.new_unsigned_integer("2564"));

    const bindings = new nillion.ProgramBindings(
      context.test1.program_id,
    );
    bindings.add_input_party("Dealer", context.test1.party_id);
    bindings.add_output_party("Result", context.test1.party_id);

    const store_uuid = await context.client.store_secrets(
      context.config.cluster_id,
      secrets,
      bindings,
    );
    expect(store_uuid).toBeDefined();
    context.test1.compute_store_secrets_id = store_uuid;
  }, 30000);

  it("should be able to compute program", async () => {
    const bindings = new nillion.ProgramBindings(
      context.test1.program_id,
    );
    bindings.add_input_party("Dealer", context.test1.party_id);
    bindings.add_output_party("Result", context.test1.party_id);

    const public_variables = new nillion.PublicVariables();
    const compute_result_uuid = await context.client.compute(
      context.config.cluster_id,
      bindings,
      [context.test1.compute_store_secrets_id],
      context.test1.compute_secrets,
      public_variables,
    );

    expect(compute_result_uuid).toBeDefined();
    expect(compute_result_uuid).not.toBe("");
    context.test1.compute_id = compute_result_uuid;
  }, 30000);

  it("should be able to get a result from compute operation", async () => {
    const compute_result = await context.client.compute_result(
      context.test1.compute_id,
    );
    expect(compute_result).toBeDefined();
    expect(compute_result).not.toBe("");
    expect(compute_result).toEqual({
      "Add0": BigInt(1462969515630),
    });
  }, 10000);

  it("should be able to update a secret", async () => {
    const secrets = new nillion.Secrets();
    secrets.insert("another-int", nillion.Secret.new_integer("1024"));
    const new_store_id = await context.client.update_secrets(
      context.config.cluster_id,
      context.test1.store_id,
      secrets,
    );

    const secret = await context.client.retrieve_secret(
      context.config.cluster_id,
      context.test1.store_id,
      "another-int",
    );
    expect(secret.to_integer(), context.test1.original_integer);
  }, 10000);

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
    const secret = await context.client.retrieve(
      context.config.cluster_id,
      context.test1.store_result,
    );
    expect(secret).not.toBeDefined();
  }, 10000);
});

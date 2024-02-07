# JS Browser Nillion Client User Guide

This guide shows you how to integrate Nillion’s Browser Client library into your application.

| Nillion Network is a decentralized storage and computation network underpinned by NMC. Nil Message Compute, or NMC, is a technique that enables storage and computation over private data without revealing it, similar to SMPC. The process involves nodes in a network pre-processing pools of randomness, or "blinding factors", and distributing shares of these factors to each node. During the online phase, a dealer requests shares from the nodes and reconstructs the blinding factor using these shares. The dealer then masks their secret using a one-time mask (OTM), which can be thought of as a multiplicative version of a one-time pad (OTP). This masked secret is called a "particle", and the dealer sends it to the nodes. Using their share of the blinding factor, the nodes can evaluate arithmetic circuits over the particles, generating a share of the result which can be sent to a Result Node. Once a certain threshold of shares is reached, the Result Node can reconstruct the final result.

Consider that the javascript client is a WASM portable program that has javascript bindings as a librarythat you import into your browser project. This library is custom built to use browser web workers and will not work with plain nodejs. Because we rely on these web-workers and a shared memory space, the browser itself must be activated into a particular CORS mode using these HTTP headers:
```
"Cross-Origin-Embedder-Policy": "require-corp"
"Cross-Origin-Opener-Policy": "same-origin"
```

In this User guide, you’ll learn how to:

- Create an instance of the Nillion Client library.
- Store secrets in the network
- Retrieve secrets in the network
- Perform computations in the network

## Preparation

To work on the network, you will need the following:

1. A Nillion network (via `run-local-cluster` tool or the official Nillion testnet)
2. A cluster ID
3. A private key seed; NOTE: If you are running against the official Nillion testnet, you must provide the resultant peerId for whitelist purposes.
4. A user key

You can follow the SDK Tutorial steps to see how to setup your local network and obtain these values. You can also review the `start-test.sh` script to see how some of this is automated.


## Constructor


```javascript
const nil = await import("@nillion/nillion-client-js-browser");
await nil.default();
const client = new nil.WasmNillionClient(config.user_key, config.private_key_seed, config.bootnodes, false);
```

### Ordered Parameters:

- user_key: (string) This is the result of the `user-keygen` utility. See more in the SDK Tutorial
- key_pair_seed: (string) A seed used to generate the public and private key pair; (This can match a whitelisted key generated using `node-keygen --seed <YOUR_SEED>` for use in the testnet)
- bootnodes: (string[]) A list of strings representing the addresses of the bootnodes to connect to on the Nillion network.
- (optional) logger: (bool) This will activate the logging hook to broadcast internal client logging to a websocket located at `localhost:11100`. See below for more info.


## Store secrets in Nillion

A secret is stored in a retrievable structure that has keyed elements. These elements must be encoded depending on the data type that you desire for it to be stored as so that it can operate correctly with Nillion network programs in the compute actions.

Here are the supported encoding types:
* encode_unsigned_decimal_secret
* encode_signed_integer_secret
* encode_unsigned_integer_secret
* encode_blob_secret

> Example signed type
```javascript
    const collection = new nillion.NilSecrets();
    const encoded = await nillion.encode_blob_secret(
      `My Blob ID`,
      {
        bytes: resultBytes,
      },
    );
    await collection.insert(encoded);
    let uuid = await client.store(config.cluster_id, collection);
```
> Example signed integer type
```javascript
    const collection = new nillion.NilSecrets();
    const encoded = await nillion.encode_signed_integer_secret(
      `My Integer ID`,
      {
        as_string: "-1234"
      },
    );
    await collection.insert(encoded);
    let uuid = await client.store(config.cluster_id, collection);
```

## Retrieve secrets in Nillion

Retrieving secrets is basically reverse operations of the storage function above.

Here are the supported decoding types:
* decode_bytearray_secret
> NOTE: decoding integers or decimals do not require additional decoding


```javascript
        const secret = await client.retrieve(
          config.cluster_id,
          uuid,
          `My Blob ID`
        );
        const byteArray = await nillion.decode_bytearray_secret(secret);
        // createFileFromByteArray(byteArray, props.name);
```

## Compute actions in Nillion

When a user creates an MPC protocol instance using a Nillion Client, they need to specify the number of parties that will participate in the computation and provide the instance party ID for their party. The instance party ID serves as a unique identifier for the party within the instance and is used to distinguish the party's input and output data from those of the other parties.

In order to compute a program operation you must have first compiled and uploaded it to the network. This is demonstrated in the SDK Tutorial, or you can review this automation in the `start-test.sh` script.

Some or all of the secrets will first be stored on the network, and then the program will be executed with references to these secrets or encoded just-in-time (unstored) secrets with instructions on which parties are to provide them.

The sequence of operation is:
1. Define stored program inputs atomically
    a. Bind parties to values
    b. Store values to network
    c. Bind stored values to program
2. Define program just-in-time inputs and computation outputs
    a. Bind parties to program
    b. Bind additional values to program
5. Execute computation (`client.compute`)
6. Collect result (`client.compute_result`)


### Obtain your party ID
```javascript
let party_id = await client.party_id();
```

### Store a program secret
```javascript
// program_id is provided after uploading a program to the network (see start-test.sh)
program_bindings = new nillion.WasmProgramBindings(program_id);
program_bindings.add_input_party("Dealer", party_id);
store_secrets = new nillion.NilSecrets();
await store_secrets.insert(encoded);
store_uuid = await client.store(config.cluster_id, store_secrets, program_bindings);
```

### Execute computation

The result of this operation is a uuid which can be used to fetch the computation result from the network.
```javascript
uuid = await client.compute(
  cluster_id,  // this is provided from run-local-cluster
  program_bindings,
  [store_uuid],
  compute_secrets,
);
```

### Wait for computation result
```javascript
await client.compute_result(uuid);
```

### Program Example

A sample compiled program is provided in `resources/programs/simple` that sums the products of a collection of numbers. Here is the `nada` code of the arithmatic for it:

```
    I00 = SecretUnsignedInteger(Input(name="I00", party=dealer))
    I01 = SecretUnsignedInteger(Input(name="I01", party=dealer))
    I02 = SecretUnsignedInteger(Input(name="I02", party=dealer))
    I03 = SecretUnsignedInteger(Input(name="I03", party=dealer))
    I04 = SecretUnsignedInteger(Input(name="I04", party=dealer))

    Mul0 = I00 * I01
    Mul1 = Mul0 * I02
    Mul2 = I03 * I04
    Add0 = Mul1 + Mul2

```

You can see in `js-browser/nillion.config.jsx` where we have the program's parameters for each of the above referenced secrets.

The complete javascript client execution of this sample program can be found `js-browser/src/components/Compute.tsx`

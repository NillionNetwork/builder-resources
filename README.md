![public-notice-3](https://github.com/NillionNetwork/builder-resources/assets/33910651/d0f1e23b-7c8f-4762-8029-54213faf4d60)

# Builder Resources

> [!WARNING]
> This repository contains code examples that may not be working with your SDK version. Please see compatability chart below and please [report any issues](https://github.com/NillionNetwork/builder-resources/issues/new/choose) you uncover.

### Current SDK

`0.2.1`

**testnet v2024-04-02-9190481d5**

> [!NOTE]
> Live testnet requires that you have a pre-funded eth wallet on our custom chain. Please speak to your Nillion tech for guidance
>
> You will plug in the private key of your wallet into remote.json
>
> Also, consider that the examples are copy/paste runnable with local cluster, you will need to adjust the configs and config loaders
> to suit the remote.json changes.

# Getting Started

🚀🚀 Visit the [Nillion Docs Repository](https://docs.nillion.com) where you can find all the latest up-to-date technical documentation, concepts and resources.

# Setting up your system for this repo:

> [!NOTE]
> The README of each example will have instructions for installing the client

1. Use the guide to install [SDK and Tools](https://docs.nillion.com/nillion-sdk-and-tools)
2. Install python client library and py-nada-lang from pypi - [py-nillion-client](https://pypi.org/project/py-nillion-client/)
3. Install javascript client library from npmjs - [nillion-client-js-browser](https://www.npmjs.com/package/@nillion/nillion-client-js-browser)


# Running examples in this repo

Then for the tests, each corresponding README file will give exact instructions but follow this general pattern:

1. Make sure your SDK binaries are in the path
2. Kick off the bootstrap script which will place the generated config file in the directory of your choosing 
> Note: This will start the anvil blockchain and Nillion nillion-devnet daemons in the background; you can reuse a single local.json file across all examples
3. Chdir to the test directory and launch the test



# Demo Code Compatibility Matrix
> [!NOTE]
> The following exercises or examples are known to be working with the SDK bundle and/or deployment endpoint (testnet)
> 
> Symbols:
> 
> ✅ - it works! please file a bug report if it fails in your usage
> 
> ⭕ - not yet tested
>
> ❌ - failed testing

| SDK | Client  | Testnet  | Local | Remote (Testnet) |  Path |
|:---:|:-------:|:--------:|:-----:|:----------------:|:-----:|
| 0.1.1 | Python 3.7+                                                                                   | v2024-04-02-9190481d5 | ✅ | ✅ | [py-client/compute-basic](py-client/compute-basic) |
| 0.1.1 | Python 3.7+                                                                                   | v2024-04-02-9190481d5 | ✅ | ✅ | [py-client/compute-with-permissions](py-client/compute-with-permissions) |
| 0.1.1 | Javascript ([recent chrome](https://developer.chrome.com/blog/enabling-shared-array-buffer/)) | v2024-04-02-9190481d5 | ✅ | ✅ | [js-client/basic-html](js-client/basic-html) |
| 0.1.1 | Javascript ([recent chrome](https://developer.chrome.com/blog/enabling-shared-array-buffer/)) | v2024-04-02-9190481d5 | ✅ | ✅ | [js-client/jasmine-test](js-client/jasmine-test) |
| 0.1.1 | Javascript ([recent chrome](https://developer.chrome.com/blog/enabling-shared-array-buffer/)) | v2024-04-02-9190481d5 | ✅ (see readme) | ✅ | [js-client/react-webpack-puppeteer-test](js-client/react-webpack-puppeteer-test) |
| 0.2.1 | Python 3.7+                                                                                   | n/a | ✅ | ⭕ | [py-client/compute-basic](py-client/compute-basic) |
| 0.2.1 | Python 3.7+                                                                                   | n/a | ✅ | ⭕ | [py-client/compute-with-permissions](py-client/compute-with-permissions) |
| 0.2.1 | Javascript ([recent chrome](https://developer.chrome.com/blog/enabling-shared-array-buffer/)) | n/a | ✅ | ⭕ | [js-client/basic-html](js-client/basic-html) |
| 0.2.1 | Javascript ([recent chrome](https://developer.chrome.com/blog/enabling-shared-array-buffer/)) | n/a | ✅ | ⭕ | [js-client/jasmine-test](js-client/jasmine-test) |
| 0.2.1 | Javascript ([recent chrome](https://developer.chrome.com/blog/enabling-shared-array-buffer/)) | n/a | ✅ (see readme) | ⭕ | [js-client/react-webpack-puppeteer-test](js-client/react-webpack-puppeteer-test) |


# Tools

## libp2p-direct

This tool can be used to test out the connectivity of your node keys using the `tools/test-remote-network.sh` script (see below).

First, you'll need to make sure the modified `libp2p-direct` is installed into your path:
```shell
cargo install --git https://github.com/wwwehr/libp2p-lookup.git --branch feature/keypair-file
```

You can manually run this command against a libp2p cluster like this:
```bash
libp2p-lookup direct --address $MULTIADDR --keypair-path /path/to/your/nodekey
```

Note: this command will fail if your node key is not whitelisted on our network.

## bootstrap-local-environment.sh

Using the SDK, this tool sets up a local nillion cluster and runs it in the background, loads programs found in `resources/programs` and dumps the configuration
to json files so that you can easily develop locally.


```shell
# create random output files
./tools/bootstrap-local-environment.sh

# write config to a named directory
mkdir -p /your/desired/directory
bash ./tools/bootstrap-local-environment.sh /your/desired/directory
```

stop the cluster by running:
```shell
killall nillion-devnet
```

## test-remote-network.sh

Check your SDK connectivity and whitelist capability against the published testnet.

Nillion's closed testnet is only available to submitted and approved peerIds. You can find your peerId using the SDK
binary called `node-key2peerid`. Submit this to your Nillion team and we will get you whitelisted.

See:
* `node-keygen`
* `node-key2peerid`

| Run the test script. It will probe the remote cluster, connect to the remote cluster, run a diagnostic, 
| then store and retrieve a secret.
```bash
./tools/test-remote-network.sh /path/to/your/nodekey
```



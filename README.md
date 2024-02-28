![image](https://github.com/nillion-oss/builder-resources/assets/33910651/9a38748b-9d5f-4673-a49a-04d2cca180b9)

# Builder Resources

> [!WARNING]
> This repository contains code examples that may not be working with your SDK version. Please see compatability chart below and please [report any issues](https://github.com/nillion-oss/builder-resources/issues/new/choose) you uncover.

### Current SDK

**release_version photon-v1.0.0-rc.4**

> Note: testnet is undergoing maintenance

# Getting Started

🚀🚀 Visit the [Nillion Docs Repository](https://nillion.gitbook.io/docs/D7EurBeioQRXZMzb41z3/welcome-to-nillions-docs) where you can find all the latest up-to-date technical documentation, concepts and resources.

## Demo Code Compatibility Matrix
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

| Client  | Version  | Local | Remote (Testnet) |  Path |
|:--------|:--------:|:-----:|:----------------:|:-----:|
| Python 3.7+                                                                                   | photon-v1.0.0-rc.4 | ✅ | ⭕ | [py-client/compute-basic](py-client/compute-basic) |
| Python 3.7+                                                                                   | photon-v1.0.0-rc.4 | ⭕ | ⭕ | [py-client/compute-with-permissions](py-client/compute-with-permissions) |
| Javascript ([recent chrome](https://developer.chrome.com/blog/enabling-shared-array-buffer/)) | photon-v1.0.0-rc.4 | ✅ | ⭕ | [js-client/basic-html](js-client/basic-html) |
| Javascript ([recent chrome](https://developer.chrome.com/blog/enabling-shared-array-buffer/)) | photon-v1.0.0-rc.4 | ✅ | ⭕ | [js-client/jasmine-test](js-client/jasmine-test) |
| Javascript ([recent chrome](https://developer.chrome.com/blog/enabling-shared-array-buffer/)) | photon-v1.0.0-rc.4 | ✅ (interactive) | ⭕ | [js-client/react-webpack-puppeteer-test](js-client/react-webpack-puppeteer-test) |

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
bash ./bootstrap-local-environment.sh

# write config to a named directory
mkdir -p /your/desired/directory
bash ./bootstrap-local-environment.sh /your/desired/directory
```

stop the cluster by running:
```shell
killall run-local-cluster
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



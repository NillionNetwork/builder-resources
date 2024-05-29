# how to run the demo

## 1. Run test
# prereqs

### create/use a node key; docker compose (currently) expects this in the following path:
```shell
node-keygen --seed <your-seed> ~/nillion-node.key
```

### place remote config in this path; it MUST have a funded private key value:
```shell
../../resources/remote/config.json
```

# from this directory
```bash
docker compose build
docker compose run --rm heartbeat
```

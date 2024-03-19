# Permissions python examples

Before running through permissions examples, `bootstrap-local-environment.sh` creates user keys for the secret writer and for the reader who the writer will allow to read the secret. Permissions examples are labeled 1-5:

1. The reader fetches their user id
2. The writer stores a secret and gives the reader retrieve permissions on the secret based on the reader's user id, resulting in a store id for the secret
3. The reader retrieves the secret with the store id
4. The writer revokes secret permissions by rewriting them
5. The reader tries to retrieve the secret, but no longer has access to it

## Getting started with permissions examples

### Pre-req: install cli dependencies

The bootstrap-local-environment.sh file uses pidof and grep.

- [Install pidof](https://command-not-found.com/pidof)
- [Install grep](https://command-not-found.com/grep)

### Running examples

## 1. start your test cluster
```bash
# from the workspace root - this starts the cluster and places the 
# config and program into the expected dir
./tools/bootstrap-local-environment.sh py-client/compute-with-permissions
```

## 2. install pre-requisite libraries
```bash
source activate_virtualenv.sh
pip install -r requirements.txt
```

## 3. create a .env file by converting the local.json 
```bash
# you need to do this for every restart of the bootstrap/cluster
./convert_json_to_dotenv.py
```

## 4. Check .env file - keys, bootnodes, cluster, and payment info should now be present.

## 5. Run permissions examples

```shell
cd permissions
python3 01-fetch-reader-userid.py
python3 02-store-permissioned-secret.py --retriever_user_id {READER_USER_ID}
python3 03-retrieve-secret.py --store_id {STORE_ID}
python3 04-revoke-read-permissions.py --store_id {STORE_ID} --revoked_user_id {READER_USER_ID}
python3 05-test-revoked-permissions  --store_id {STORE_ID}
```

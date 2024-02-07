#!/usr/bin/env bash
THIS_SCRIPT_DIR="$(dirname "$0")"

set -euo pipefail
trap "exit" INT TERM
trap "kill 0" EXIT

RUN_LOCAL_CLUSTER="$(command -v run-local-cluster)"
NIL_CLI="$(command -v nil-cli)"
USER_KEYGEN=$(command -v user-keygen)
NODE_KEYGEN=$(command -v node-keygen)
PYNADAC=$(command -v pynadac)

ENV_DIR=$(mktemp -d);
PIDFILE=$(mktemp);
OUTFILE=$(mktemp);
PROGRAMINFO=$(mktemp);
USERKEYFILE=$(mktemp);
NODEKEYFILE=$(mktemp);

if [[ -n "${VIRTUAL_ENV:-}" ]]; then
  deactivate
fi
python3.10 -m pip install --user virtualenv >/dev/null 2>&1
virtualenv -p python3.10 "$ENV_DIR" >/dev/null 2>&1
# shellcheck disable=SC1091
source "$ENV_DIR/bin/activate" >/dev/null 2>&1
pip install -r requirements.txt >/dev/null 2>&1

SEED_PHRASE="test-py-client";

"$RUN_LOCAL_CLUSTER" --seed "$SEED_PHRASE" 2>/dev/null >"$OUTFILE" & echo $! >"$PIDFILE";
sleep 15;

CLUSTER_ID=$(grep -oP 'cluster id is \K.*' "$OUTFILE");
BOOT_MULTIADDR=$(grep -oP 'bootnode is at \K.*' "$OUTFILE");
WS_MULTIADDR=$(grep -oP 'websocket: \K.*' "$OUTFILE");

"$USER_KEYGEN" "$USERKEYFILE"
"$NODE_KEYGEN" "$NODEKEYFILE"

"$PYNADAC" --target-dir "$THIS_SCRIPT_DIR" "$THIS_SCRIPT_DIR/resources/my_program.py"

"$NIL_CLI" \
  --listen-address 127.0.0.1:0 --user-key-path "$USERKEYFILE" \
  --node-key-path "$NODEKEYFILE" -b "$BOOT_MULTIADDR" \
    store-program --cluster-id "$CLUSTER_ID" \
    "$THIS_SCRIPT_DIR/my_program.nada.bin" my_program >"$PROGRAMINFO"
PROGRAM_ID=$(grep -oP 'Program ID: \K.*' "$PROGRAMINFO");

echo "---- sleeping for 10 seconds to enable alpha generation"
sleep 10;

echo "---- injecting program, bootnode and cluster_id into config";

jq -n \
    --arg bootnode "$BOOT_MULTIADDR" \
    --arg cluster "$CLUSTER_ID" \
    --arg program "$PROGRAM_ID" \
    --arg userkey "$USERKEYFILE" \
    --arg nodekey "$NODEKEYFILE" \
    '{
        YOUR_BOOTNODE_MULTIADDRESS_HERE: $bootnode,
        YOUR_CLUSTER_ID_HERE: $cluster,
        YOUR_PROGRAM_ID_HERE: $program,
        YOUR_USERKEY_PATH_HERE: $userkey,
        YOUR_NODEKEY_PATH_HERE: $nodekey
    }' >.nillion-config.json

echo "---- starting python test";
"$ENV_DIR/bin/jinja2" "$THIS_SCRIPT_DIR/resources/client.py.j2" .nillion-config.json >client.py
"$ENV_DIR/bin/python3.10" client.py

exit 0

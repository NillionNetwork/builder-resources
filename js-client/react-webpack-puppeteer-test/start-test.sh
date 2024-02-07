#!/usr/bin/env bash
THIS_SCRIPT_DIR="$(dirname "$0")"

set -euo pipefail
trap "kill 0" SIGINT SIGTERM SIGQUIT EXIT

# shellcheck source=../utils.sh
source "$THIS_SCRIPT_DIR/utils.sh"

# shellcheck source=../activate_venv.sh
# source "$THIS_SCRIPT_DIR/../activate_venv.sh"

check_for_sdk_root
compile_program

RUN_LOCAL_CLUSTER="$(discover_sdk_bin_path run-local-cluster)"
NIL_CLI="$(discover_sdk_bin_path nil-cli)"
USER_KEYGEN=$(discover_sdk_bin_path user-keygen)
NODE_KEYGEN=$(discover_sdk_bin_path node-keygen)

for var in RUN_LOCAL_CLUSTER USER_KEYGEN NODE_KEYGEN NIL_CLI; do
  printf "ℹ️ found bin %-18s -> [${!var:?Failed to discover $var}]\n" "$var"
done


PIDFILE=$(mktemp);
OUTFILE=$(mktemp);

trap 'kill $(pidof run-local-cluster)' SIGINT SIGTERM SIGQUIT EXIT

PROGRAMINFO=$(mktemp);
USERKEYFILE=$(mktemp);
NODEKEYFILE=$(mktemp);

SEED_PHRASE="$0";

if pidof "$RUN_LOCAL_CLUSTER" > /dev/null; then
  __echo_red_bold "⚠️ $RUN_LOCAL_CLUSTER is already running! It is unlikely you want this, consider terminating that process and re-running this test."
fi

__echo_yellow_bold "⚠️ starting Nillion cluster; logging to [$OUTFILE]"
export RUST_LOG=error
("$RUN_LOCAL_CLUSTER" --seed "$SEED_PHRASE" 2>&1 | tee "$OUTFILE") &
echo $! >"$PIDFILE";

time_limit=40
while true; do
    # Use 'wait' to check if the log file contains the string
    if grep "cluster is running, bootnode is at" "$OUTFILE"; then
        break
    fi

    # If the time limit has been reached, print an error message and exit
    if [[ $SECONDS -ge $time_limit ]]; then
        echo "Timeout reached while waiting for cluster to be ready in '$OUTFILE'" >&2
        exit 1
    fi
    sleep 1
done

CLUSTER_ID=$(grep -oP 'cluster id is \K.*' "$OUTFILE");
BOOT_MULTIADDR=$(grep -oP 'bootnode is at \K.*' "$OUTFILE");

PAYMENTS_CONFIG_FILE=$(grep -oP 'payments configuration written to \K.*' "$OUTFILE");
WALLET_KEYS_FILE=$(grep -oP 'wallet keys written to \K.*' "$OUTFILE");

PAYMENTS_RPC=$(grep -oP 'blockchain_rpc_endpoint: \K.*' "$PAYMENTS_CONFIG_FILE");
PAYMENTS_CHAIN=$(grep -oP 'chain_id: \K.*' "$PAYMENTS_CONFIG_FILE");
PAYMENTS_SC_ADDR=$(grep -oP 'payments_sc_address: \K.*' "$PAYMENTS_CONFIG_FILE");
PAYMENTS_BF_ADDR=$(grep -oP 'blinding_factors_manager_sc_address: \K.*' "$PAYMENTS_CONFIG_FILE");

WALLET_PRIVATE_KEY=$(tail -n1 "$WALLET_KEYS_FILE")

WS_MULTIADDR=$(grep -oP 'websocket: \K.*' "$OUTFILE");

__echo_yellow_bold "✔️ Nillion cluster is UP!"

"$USER_KEYGEN" "$USERKEYFILE"
"$NODE_KEYGEN" "$NODEKEYFILE"

# Usage: nil-cli -b <BOOTNODES> --payments-private-key <PRIVATE_KEY> store-program --cluster-id <CLUSTER_ID> <PROGRAM_PATH> <PROGRAM_NAME>
__echo_yellow_bold "⚠️ loading Nillion sample program; dumping to [$PROGRAMINFO]"
"$NIL_CLI" \
  --listen-address 127.0.0.1:0 --user-key-path "$USERKEYFILE" \
  --node-key-path "$NODEKEYFILE" -b "$BOOT_MULTIADDR" \
  --payments-private-key "$WALLET_PRIVATE_KEY" \
  --blockchain-config-path "$PAYMENTS_CONFIG_FILE" \
    store-program --cluster-id "$CLUSTER_ID" \
    "$THIS_SCRIPT_DIR/resources/programs/build/simple.nada.bin" simple >"$PROGRAMINFO"

PROGRAM_ID=$(grep -oP 'Program ID: \K.*' "$PROGRAMINFO");
__echo_yellow_bold "✔️ Nillion program is LOADED!"

NILLION_CONFIG="$THIS_SCRIPT_DIR/js-browser/nillion.config.json"
__echo_yellow_bold "⚠️ dumping Nillion auto config to [$NILLION_CONFIG]"
jq -n \
    --arg blinding_factors_manager_sc_address "$PAYMENTS_BF_ADDR" \
    --arg blockchain_rpc_endpoint "$PAYMENTS_RPC" \
    --arg bootnode "$WS_MULTIADDR" \
    --argjson chain_id "$PAYMENTS_CHAIN" \
    --arg cluster "$CLUSTER_ID" \
    --arg payments_sc_address "$PAYMENTS_SC_ADDR" \
    --arg program "$PROGRAM_ID" \
    --arg userkey "$(cat $USERKEYFILE)" \
    --arg wallet_private_key "$WALLET_PRIVATE_KEY" \
    '{
        bootnodes: [$bootnode],
        cluster_id: $cluster,
        payments_config: {
          rpc_endpoint: $blockchain_rpc_endpoint,
          smart_contract_addresses: {
            "blinding_factors_manager": $blinding_factors_manager_sc_address,
            "payments": $payments_sc_address
          },
          signer: {
            wallet: {
              chain_id: $chain_id,
              private_key: $wallet_private_key
            }
          }
        },
        program_id: $program,
        user_key: $userkey
    }' >"$NILLION_CONFIG"

echo "---- sleeping for 60 seconds to enable alpha generation"
sleep 60;

__echo_yellow_bold "✔️ Nillion cluster is ready!"
echo "---- starting chrome test";
pushd "$THIS_SCRIPT_DIR/js-browser";
install_js_nillion_client;
npm i;

set +e
npm run test:headful;
#npm run test:headless;

exit 0

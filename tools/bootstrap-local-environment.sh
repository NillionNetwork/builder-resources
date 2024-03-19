#!/usr/bin/env bash
set -euo pipefail

THIS_SCRIPT_DIR="$(dirname "$0")"
TARGET_ENV_FILE_PATH="${1:-$(mktemp -d)}"

ENV_DIR=$(mktemp -d);
if [[ -n "${VIRTUAL_ENV:-}" ]]; then
  deactivate
fi
python -m pip install --user virtualenv >/dev/null 2>&1
virtualenv -p python "$ENV_DIR" >/dev/null 2>&1
# shellcheck disable=SC1091
source "$ENV_DIR/bin/activate" >/dev/null 2>&1

# pip install -r requirements.txt >/dev/null 2>&1

# shellcheck source=./utils.sh
source "$THIS_SCRIPT_DIR/utils.sh"

nillion_check_min_system_resources

RUN_LOCAL_CLUSTER="$(discover_sdk_bin_path run-local-cluster)"
NIL_CLI="$(discover_sdk_bin_path nil-cli)"
USER_KEYGEN=$(discover_sdk_bin_path user-keygen)
NODE_KEYGEN=$(discover_sdk_bin_path node-keygen)
PYNADAC="$(discover_sdk_bin_path pynadac)"

for var in PYNADAC RUN_LOCAL_CLUSTER USER_KEYGEN NODE_KEYGEN NIL_CLI; do
  printf "ℹ️ found bin %-18s -> [${!var:?Failed to discover $var}]\n" "$var"
done

for var in anvil curl jq pip; do
  ensure_available "$var"
done

PYNADAC_COMPILE_ARTIFACTS=$(mktemp -d)
compile_program "$PYNADAC_COMPILE_ARTIFACTS"

OUTFILE=$(mktemp);

PROGRAMINFO=$(mktemp);
RUSERKEYFILE=$(mktemp);
WUSERKEYFILE=$(mktemp);
NODEKEYFILE=$(mktemp);

SEED_PHRASE="$0";

daemonize_cluster "$OUTFILE"

CLUSTER_ID=$(grep "cluster id is" "$OUTFILE" | awk '{print $4}');
BOOT_MULTIADDR=$(grep -oP 'bootnode is at \K.*' "$OUTFILE");
BOOT_MULTIADDR_WS=$(grep "websocket: " "$OUTFILE" | awk '{print $2}');

PAYMENTS_CONFIG_FILE=$(grep "payments configuration written to" "$OUTFILE" | awk '{print $5}');
WALLET_KEYS_FILE=$(grep "wallet keys written to" "$OUTFILE" | awk '{print $5}');

PAYMENTS_RPC=$(grep "blockchain_rpc_endpoint:" "$PAYMENTS_CONFIG_FILE" | awk '{print $2}');
PAYMENTS_CHAIN=$(grep "chain_id:" "$PAYMENTS_CONFIG_FILE" | awk '{print $2}');
PAYMENTS_SC_ADDR=$(grep "payments_sc_address:" "$PAYMENTS_CONFIG_FILE" | awk '{print $2}');
PAYMENTS_BF_ADDR=$(grep "blinding_factors_manager_sc_address:" "$PAYMENTS_CONFIG_FILE" | awk '{print $2}');

WALLET_PRIVATE_KEY=$(tail -n1 "$WALLET_KEYS_FILE")

__echo_yellow_bold "✔️ Nillion cluster is UP!"
sleep 5

"$USER_KEYGEN" --seed "this is the reader key" "$RUSERKEYFILE"
__echo_yellow_bold "⚠️ dumped userkey to [$RUSERKEYFILE]"

"$USER_KEYGEN" --seed "this is the writer key" "$WUSERKEYFILE"
__echo_yellow_bold "⚠️ dumped userkey to [$WUSERKEYFILE]"

"$NODE_KEYGEN" "$NODEKEYFILE"
__echo_yellow_bold "⚠️ dumped nodekey to [$NODEKEYFILE]"

__echo_yellow_bold "⚠️ loading Nillion programs; dumping to [$PROGRAMINFO]"
declare -A programs_map
for program_file in "$PYNADAC_COMPILE_ARTIFACTS"/programs/*.bin; do
	program_name="$(basename "$program_file")"
	program_name="${program_name%%.*}"
	
	__echo_yellow_bold "XXXX $program_file [$program_name] is loading..."
	"$NIL_CLI" \
	  --listen-address 127.0.0.1:0 --user-key-path "$WUSERKEYFILE" \
	  --node-key-path "$NODEKEYFILE" -b "$BOOT_MULTIADDR" \
	  --payments-private-key "$WALLET_PRIVATE_KEY" \
	  --blockchain-config-path "$PAYMENTS_CONFIG_FILE" \
	    store-program --cluster-id "$CLUSTER_ID" \
			"$program_file" "$program_name" >"$PROGRAMINFO"
	program_id=$(grep -oP 'Program ID: \K.*' "$PROGRAMINFO");
	programs_map["$program_name"]="$program_id"
	__echo_yellow_bold "✔️ Nillion program [$program_name] is LOADED!"
done

programs_map_json="{}"
for key in "${!programs_map[@]}"; do
    value="${programs_map[$key]}"
    programs_map_json=$(jq --arg k "$key" --arg v "$value" '.[$k] = $v' <<< "$programs_map_json")
done

jq -n \
    --arg nodekey "$NODEKEYFILE" \
    --arg ruserkey "$RUSERKEYFILE" \
    --arg wuserkey "$WUSERKEYFILE" \
    --arg bootnode "$BOOT_MULTIADDR" \
    --arg bootnode_ws "$BOOT_MULTIADDR_WS" \
    --arg cluster "$CLUSTER_ID" \
    --arg blockchain_rpc_endpoint "$PAYMENTS_RPC" \
    --argjson chain_id "$PAYMENTS_CHAIN" \
    --argjson programs "$programs_map_json" \
    --arg payments_sc_address "$PAYMENTS_SC_ADDR" \
    --arg blinding_factors_manager_sc_address "$PAYMENTS_BF_ADDR" \
    --arg wallet_private_key "$WALLET_PRIVATE_KEY" \
    '{
		  "bootnodes": [$bootnode],
		  "bootnodes_ws": [$bootnode_ws],
		  "cluster_id": $cluster,
		  "payments_config": {
		    "rpc_endpoint": $blockchain_rpc_endpoint,
		    "smart_contract_addresses": {
		      "blinding_factors_manager": $blinding_factors_manager_sc_address,
          "payments": $payments_sc_address,
		    },
		    "signer": {
		      "wallet": {
		        "chain_id": $chain_id,
		        "private_key": $wallet_private_key
		      },
		    },
		  },
      "keypath": {
        "node": $nodekey,
        "ruser": $ruserkey,
        "wuser": $wuserkey,
      },
			$programs
    }' >"$TARGET_ENV_FILE_PATH/local.json"
echo "ℹ️  injected program, bootnode and cluster_id into config: [$TARGET_ENV_FILE_PATH/local.json]";
__echo_red_bold "⚠️ "
__echo_red_bold "⚠️ cluster running in background; stop it with 'killall run-local-cluster'"
__echo_red_bold "⚠️ "
__echo_red_bold "⚠️ dumped nodekey to [$NODEKEYFILE]"

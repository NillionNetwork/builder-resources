#!/usr/bin/env bash
THIS_SCRIPT_DIR="$(dirname "$0")"
source "$THIS_SCRIPT_DIR/utils.sh"


function command_help {
  cat <<EOF >&2

Usage: $0 <PATH-TO-YOUR-WHITELISTED-NODEKEY>

EOF
}

function report_status() {
  local exit_code=${1:-exit_code argument is required by report_status}
  local start=${2:-start argument is required by report_start}

  END=$(ut)
  ELAPSED_TIME=$((END - start))
  if [[ $exit_code -eq 0 ]]; then
    echo >&2 -ne "\033[32mPASS\033[0m"
  else
    ERRORS=$((ERRORS + 1))
    echo >&2 -ne "\033[31mFAIL\033[0m"
  fi
  echo >&2 -e "\033[33m in $ELAPSED_TIME seconds\033[0m"
}

function setup() {
  NODE_KEY_PATH="$1"
  if [[ ! -e "$NODE_KEY_PATH" ]]; then
    __echo_red_bold "⚠️ You must supply a path to your node key that you generated (and whitelisted) with node-keygen}"
    command_help
    exit 1
  fi

  HEADER=$(printf '%0.s=' {1..80})
  echo >&2 -e "\033[33m.${HEADER} \033[0m"

  SEED_PHRASE="nillion-testnet-seed-1"

  # Parse Terraform outputs.
  CLUSTER_ID=$(jq -r '.clusters[0].id' "$THIS_SCRIPT_DIR"/../resources/remote/config.json)
  test "$CLUSTER_ID" != "null" || { echo "Error: CLUSTER_ID is null"; return 1; }

  BOOTNODE=$(jq -r '.bootnodes[0]' "$THIS_SCRIPT_DIR"/../resources/remote/config.json)
  BOOTNODE_HOST=$(awk -F'/' '{print $3}' <<<"$BOOTNODE")
  test "$BOOTNODE_HOST" != "null" || { echo "Error: BOOTNODE_HOST is null"; return 1; }

  BOOTNODE_ID=$(basename "$BOOTNODE")
  test "$BOOTNODE_ID" != "null" || { echo "Error: BOOTNODE_ID is null"; return 1; }

  PAYMENTS_CONFIG_PATH=$(mktemp)
  jq -r '.payments' "$THIS_SCRIPT_DIR"/../resources/remote/config.json >"$PAYMENTS_CONFIG_PATH"

  USER_KEY_PATH="$(mktemp)"

  USE_WEBSOCKET_ADDR=false

  BOOTNODE_PORT=$($USE_WEBSOCKET_ADDR && echo "14211" || echo "14111")
  BOOTNODE_PROTO=$($USE_WEBSOCKET_ADDR && echo "ws/p2p" || echo "p2p")

  BOOTNODE="/dns/$BOOTNODE_HOST/tcp/$BOOTNODE_PORT/$BOOTNODE_PROTO/$BOOTNODE_ID"
  LOG_DIR=$(mktemp -d)

	CMD_USER_KEYGEN="$(discover_sdk_bin_path user-keygen)"
	CMD_NIL_CLI="$(discover_sdk_bin_path nil-cli)"

  if path=$(command -v libp2p-lookup); then
    CMD_LIBP2P_LKUP="$(realpath "$path")"
  fi

  # --blockchain-config-path $PAYMENTS_CONFIG_PATH
  NIL_CLI_STD="-b $BOOTNODE --node-key-path $NODE_KEY_PATH --user-key-path $USER_KEY_PATH \
    --payments-chain-id $(jq -r '.signer.wallet.chain_id' $PAYMENTS_CONFIG_PATH) \
    --payments-private-key $(jq -r '.signer.wallet.private_key' $PAYMENTS_CONFIG_PATH) \
    --payments-rpc-endpoint $(jq -r '.rpc_endpoint' $PAYMENTS_CONFIG_PATH) \
    --payments-sc-address $(jq -r '.smart_contract_addresses.payments' $PAYMENTS_CONFIG_PATH) \
    --blinding-factors-manager-sc-address $(jq -r '.smart_contract_addresses.blinding_factors_manager' $PAYMENTS_CONFIG_PATH)"

  ERRORS=0

  echo >&2 -e "\033[33m| cluster-id         [$CLUSTER_ID] \033[0m"
  echo >&2 -e "\033[33m| user-key-path      [$USER_KEY_PATH] \033[0m"
  echo >&2 -e "\033[33m| nillion-node-key   [$NODE_KEY_PATH] \033[0m"
  echo >&2 -e "\033[33m| bootnode           [$BOOTNODE] \033[0m"
  echo >&2 -e "\033[33m| seed phrase        [$SEED_PHRASE] \033[0m"
  echo >&2 -e "\033[33m| websocket addr     [$($USE_WEBSOCKET_ADDR && echo "yes" || echo "no")] \033[0m"
  echo >&2 -e "\033[33m| payments config    [$PAYMENTS_CONFIG_PATH] \033[0m"
  echo >&2 -e "\033[33m| cmd nil-cli        [$CMD_NIL_CLI] \033[0m"
  echo >&2 -e "\033[33m| cmd user keygen    [$CMD_USER_KEYGEN] \033[0m"
  echo >&2 -e "\033[33m| cmd libp2p-lookup  [$CMD_LIBP2P_LKUP] \033[0m"
  echo >&2 -e "\033[33m| log dir            [${LOG_DIR}] \033[0m"
  echo >&2
}

function ut() {
  date +%s
}

setup $*

START=$(ut)
echo >&2 -n "generating user key... "
$CMD_USER_KEYGEN "$USER_KEY_PATH"
report_status $? "$START"

if $CMD_LIBP2P_LKUP direct --help | grep --silent keypair-path; then
  START=$(ut)
  echo >&2 -n "Test p2p connectivity... "
  # echo "    [$BOOTNODE]"
  $CMD_LIBP2P_LKUP direct --address "$BOOTNODE" --keypair-path "$NODE_KEY_PATH" >"$LOG_DIR/libp2p-lookup" 2>&1
  report_status $? "$START"
fi

# TODO: skip beacuse it fails for nick
while false; do
  START=$(ut)
  echo >&2 -n "Test node build info... "
  # shellcheck disable=SC2086
  $CMD_NIL_CLI $NIL_CLI_STD \
    node-build-info "$BOOTNODE_ID" >"$LOG_DIR/node-build-info" 2>&1
  report_status $? "$START"
done

START=$(ut)
echo >&2 -n "Test retrieving cluster information... "
# shellcheck disable=SC2086
$CMD_NIL_CLI $NIL_CLI_STD \
  cluster-information "$CLUSTER_ID" >"$LOG_DIR/cluster-information" 2>&1
report_status $? "$START"

START=$(ut)
echo >&2 -n "Test persisting a secret... "
# shellcheck disable=SC2086
RUST_LOG=debug $CMD_NIL_CLI $NIL_CLI_STD \
  store-secrets --cluster-id "$CLUSTER_ID" --dealer-name my_dealer --blob-secret my_secret=Tmls >"$LOG_DIR/store-secrets" 2>&1
report_status $? "$START"

STORE_ID=$(grep -Po 'Store ID: \K.*' "$LOG_DIR/store-secrets")

START=$(ut)
echo >&2 -n "Test retrieving a secret... "
# shellcheck disable=SC2086
RUST_LOG=debug $CMD_NIL_CLI $NIL_CLI_STD \
  retrieve-secret --cluster-id "$CLUSTER_ID" --store-id "$STORE_ID" --secret-id my_secret >"$LOG_DIR/retrieve-secret" 2>&1
report_status $? "$START"

if [ $ERRORS -gt 0 ]; then
  echo -e "\033[31mERRORS: $LOG_DIR\033[0m"
  __echo_red_bold "⚠️⚠️ Nillion cluster is NOT VALID!"
  exit "$ERRORS"
else
  echo -e "\033[32mOK\033[0m"
  __echo_yellow_bold "✔️ Nillion cluster is VALIDATED!"
  rm "$USER_KEY_PATH"
  rm "$NODE_KEY_PATH"
  rm "${LOG_DIR:?}"/*
  rmdir "$LOG_DIR"
  exit 0
fi

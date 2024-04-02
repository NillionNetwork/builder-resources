#!/usr/bin/env bash
set -eo pipefail

function command_help {
  cat <<EOF >&2

This script will merge uploaded program ids into the remote.json

Usage: $0 <PATH-TO-YOUR-WHITELISTED-NODEKEY> <DESTINATION-PATH-OF-REMOTE-CONFIG>

EOF
}

THIS_SCRIPT_DIR="$(dirname "$0")"
NODEKEYFILE="$1"
TARGET_ENV_FILE_PATH="${2:-$(mktemp -d)}"

ENV_DIR=$(mktemp -d);
if [[ -n "${VIRTUAL_ENV:-}" ]]; then
  deactivate
fi

python -m pip install --user virtualenv >/dev/null 2>&1
virtualenv -p python "$ENV_DIR" >/dev/null 2>&1
# shellcheck disable=SC1091
source "$ENV_DIR/bin/activate" >/dev/null 2>&1

# shellcheck source=./utils.sh
source "$THIS_SCRIPT_DIR/utils.sh"

if [[ $(uname) == *"Darwin"* ]]; then
  echo "TODO: check system resources on macos"
else
  nillion_check_min_system_resources
fi

check_sdk_bins
check_system_bins

PYNADAC_COMPILE_ARTIFACTS=$(mktemp -d)
compile_program "$PYNADAC_COMPILE_ARTIFACTS"
__echo_yellow_bold "⚠️ compiled programs to [$PYNADAC_COMPILE_ARTIFACTS]"

PROGRAMINFO=$(mktemp);

PATH_TO_CONFIG="$(realpath "$THIS_SCRIPT_DIR/../resources/remote/config.json")"
function __conf () {
  local query
  query="$1"
  jq -r "$query" "$PATH_TO_CONFIG"
}

RUSERKEYFILE="$(mktemp)";
WUSERKEYFILE="$(mktemp)";


if [[ ! -e "$NODEKEYFILE" ]]; then
  __echo_red_bold "⚠️ You must supply a path to your node key that you generated (and whitelisted) with node-keygen}"
  command_help
  exit 1
fi
"$USER_KEYGEN" --seed "this is the reader key" "$RUSERKEYFILE"
__echo_yellow_bold "⚠️ loaded userkey from [$RUSERKEYFILE]"

"$USER_KEYGEN" --seed "this is the writer key" "$WUSERKEYFILE"
__echo_yellow_bold "⚠️ loaded userkey from [$WUSERKEYFILE]"

__echo_yellow_bold "⚠️ loaded nodekey from [$NODEKEYFILE]"

__echo_yellow_bold "⚠️ loading Nillion programs; dumping to [$PROGRAMINFO]"

declare -A programs_map
for program_file in "$PYNADAC_COMPILE_ARTIFACTS"/programs/*.bin; do
	program_name="$(basename "$program_file")"
	program_name="${program_name%%.*}"
	
	__echo_yellow_bold "XXXX $program_file [$program_name] is loading..."
	"$NIL_CLI" \
	  --listen-address 127.0.0.1:0 --user-key-path "$WUSERKEYFILE" \
    --node-key-path "$NODEKEYFILE" -b "$(__conf '.bootnodes[0]')" \
    --payments-private-key "$(__conf '.payments_config.signer.wallet.private_key')" \
    store-program --cluster-id "$(__conf '.cluster_id')" \
			"$program_file" "$program_name" >"$PROGRAMINFO"
	program_id=$("$CMD_GREP" -oP 'Program ID: \K.*' "$PROGRAMINFO");
	programs_map["$program_name"]="$program_id"
	__echo_yellow_bold "✔️ Nillion program [$program_name] is LOADED!"
done

programs_map_json="{}"
for key in "${!programs_map[@]}"; do
    value="${programs_map[$key]}"
    programs_map_json=$(jq --arg k "$key" --arg v "$value" '.[$k] = $v' <<< "$programs_map_json")
done

PROGRAMS_JSON="$(mktemp)"
jq -n \
    --argjson programs "$programs_map_json" \
    --arg nodekey "$NODEKEYFILE" \
    --arg ruserkey "$RUSERKEYFILE" \
    --arg wuserkey "$WUSERKEYFILE" \
    '{
      "keypath": {
        "node": $nodekey,
        "ruser": $ruserkey,
        "wuser": $wuserkey,
      },
			$programs
    }' >"$PROGRAMS_JSON"

jq -s '.[0] * .[1]' "$PATH_TO_CONFIG" "$PROGRAMS_JSON" >"$TARGET_ENV_FILE_PATH/remote.json"

echo "ℹ️  uploaded and injected program to config: [$TARGET_ENV_FILE_PATH/remote.json]";

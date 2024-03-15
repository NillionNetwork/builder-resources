#!/usr/bin/env bash

function __echo_red_bold {
  echo -e "\033[1;31m${1}\033[0m"
}

function __echo_yellow_bold {
  echo -e "\033[1;33m${1}\033[0m"
}

function nillion_check_min_system_resources () {
  
  # Detect number of CPUs
  NUM_CPUS=$(grep -c ^processor /proc/cpuinfo 2>/dev/null)
  if [ -z "$NUM_CPUS" ]; then
    # macOS and other systems that do not support /proc/cpuinfo
    NUM_CPUS=$(sysctl -n hw.ncpu 2>/dev/null || echo 1)
  fi
  
  # Detect total memory in MB
  MEM_TOTAL=$(grep MemTotal /proc/meminfo 2>/dev/null | awk '{print int($2/1024)}')
  if [ -z "$MEM_TOTAL" ]; then
    # macOS and other systems that do not support /proc/meminfo
    MEM_TOTAL=$(sysctl -n hw.memsize 2>/dev/null | awk '{print int($1/1024/1024)}')
  fi
  
  MIN_CPUS=2
  MIN_MEM_MB=4096
  
  # Check if the resources are below the minimum requirements
  if [ "$NUM_CPUS" -lt "$MIN_CPUS" ] || [ "$MEM_TOTAL" -lt "$MIN_MEM_MB" ]; then
    __echo_red_bold "⚠️ Warning: Insufficient environment resources for your Nillion cluster. Expect problems!"
    __echo_yellow_bold "Required minimum: $MIN_CPUS CPUs, ${MIN_MEM_MB}MB Memory"
  else
    echo "ℹ️ Environment resources are sufficient."
  fi

}

function __nillion_pip_install() {
  WHLPATH=$(find -L "$NILLION_SDK_ROOT" -iname "$1" -type f -print | head -n1)
  echo $WHLPATH
  pip install --force-reinstall "${WHLPATH:?could not find $1 in $NILLION_WHL_ROOT}"
}

function install_nada_dsl() {
  __nillion_pip_install "nada_dsl-*-any.whl"
}

function ensure_available() {
  
  if ! command -v "$1" > /dev/null; then
    echo "${1} was not found in PATH. Check system installs" 1>&2
    exit 1
  else
    printf "ℹ️ found bin %-18s -> [$(which $1)]\n" "$1"
  fi
}

function discover_sdk_bin_path() {
  
  BINPATH=$(find -L "$NILLION_SDK_ROOT" -name "$1" -type f -print | head -n1)

  if ! command -v "$BINPATH" > /dev/null; then
    echo "${1} was not discovered. Check $NILLION_SDK_ROOT" 1>&2
    exit 1
  fi
  echo "$BINPATH"
}

function daemonize_cluster() {

  OUTFILE="$1"
  RUN_LOCAL_CLUSTER="$(discover_sdk_bin_path run-local-cluster)"
  SEED_PHRASE="$0";
  if pidof "$RUN_LOCAL_CLUSTER" > /dev/null; then
    __echo_red_bold "⚠️ $RUN_LOCAL_CLUSTER is already running! It is unlikely you want this, consider terminating that process and re-running this test."
  fi
  
  __echo_yellow_bold "⚠️ starting Nillion cluster; logging to [$OUTFILE]"
  
  nohup setsid "$RUN_LOCAL_CLUSTER" --seed "$SEED_PHRASE" > "$OUTFILE" 2>&1 &
  
  SECONDS=0
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
  
  echo "ℹ️ Cluster has been STARTED (see $OUTFILE)"
  cat "$OUTFILE"

}

function compile_program() {

  TARGET_PROGRAM_PATH="$(realpath "${1:?missing program path base}"/programs)"
	rm -rf "$TARGET_PROGRAM_PATH"
	mkdir -p "$TARGET_PROGRAM_PATH"
	PYNADAC="$(discover_sdk_bin_path pynadac)"
  install_nada_dsl

  pushd "$(git rev-parse --show-toplevel || echo .)/resources/programs" || exit 1
  
  for file in basic*.py simple*.py test*.py; do
    echo "Compiling ${file} to [$TARGET_PROGRAM_PATH]"
    "$PYNADAC" --target-dir "$TARGET_PROGRAM_PATH" --generate-mir-json "${file}"
  done 
  
  echo "COMPLETE: programs compiled to mir in dir: [$1]"
  popd
  
}

#!/usr/bin/env bash
function __echo_yellow_bold {
  echo -e "\033[1;33m${1}\033[0m"
}

function __echo_red_bold {
  echo -e "\033[1;31m${1}\033[0m"
}

function __nillion_npm_install() {
  NPMPATH=$(find "$NILLION_SDK_ROOT" -iname "$1" -type f -print | head -n1)
  npm install "${NPMPATH:?could not find $1 in $NILLION_SDK_ROOT}"
}

function install_js_nillion_client() {
  __nillion_npm_install "nillion-client-browser-npm.tar.gz"
}

function discover_sdk_bin_path() {
  BINPATH=$(find "$NILLION_SDK_ROOT" -name "$1" -type f -executable -print | head -n1)
  if ! command -v "$BINPATH" > /dev/null; then
    echo "${1} was not discovered. Check NILLION_SDK_ROOT" 1>&2
    exit 1
  fi
  echo "$BINPATH"
}

function check_for_sdk_root() {
  if [ -z "$NILLION_SDK_ROOT" -a ! -d "$NILLION_SDK_ROOT" ]; then
    echo "Error: NILLION_SDK_ROOT is not set to a directory"
    exit 1
  fi
}

function __nillion_pip_install() {
  WHLPATH=$(find "$NILLION_SDK_ROOT" -iname "$1" -type f -print | head -n1)
  pip install --force-reinstall "${WHLPATH:?could not find $1 in $NILLION_SDK_ROOT}"
}

function install_nada_dsl() {
  __nillion_pip_install "nada_dsl-*-any.whl"
}

function compile_program() {
  PYNADAC="$(discover_sdk_bin_path pynadac)"
  pip install --user virtualenv==20.24.6
  
  echo "Building virtualenv"
  NILLION_VENV=$(mktemp -d --suffix '-virtualenv')
  virtualenv -p python "$NILLION_VENV"
  
  echo "Activate virtualenv"
  source "$NILLION_VENV/bin/activate"

  install_nada_dsl

  PYNADAC="$(discover_sdk_bin_path pynadac)"
  
  pushd "resources/programs" || exit 1
  
  for file in *.py ; do
    echo "Compiling ${file}"
    "$PYNADAC" --target-dir "build" \
      --generate-mir-json \
      "${file}"
  done 
  
  echo "COMPLETE: programs compiled to mir in dir: [resources/programs/build]"
  popd
  
  echo "Virtualenv READY"


}

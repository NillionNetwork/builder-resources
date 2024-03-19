ENV_DIR=$(mktemp -d);
if [[ -n "${VIRTUAL_ENV:-}" ]]; then
  deactivate
fi
python3 -m pip install --user virtualenv >/dev/null 2>&1
virtualenv -p python3 "$ENV_DIR" >/dev/null 2>&1
# shellcheck disable=SC1091
source "$ENV_DIR/bin/activate" >/dev/null 2>&1

ARCH=$(uname -m | tr '[:upper:]' '[:lower:]')
OS=$(uname -s | tr '[:upper:]' '[:lower:]')
WHLPATH=$(find -L "$NILLION_SDK_ROOT" -iname "py_nillion_client-*${OS}*${ARCH}*.whl" -type f -print | head -n1)

pip install -r requirements.txt
pip install "$WHLPATH"

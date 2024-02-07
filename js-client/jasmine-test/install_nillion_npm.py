#!/usr/bin/env python
import json
import os

# Read and parse package.json
package_json_path = "./package.json"
with open(package_json_path, "r") as file:
    package_json = json.load(file)

# Update the package version
package_json["devDependencies"][
    "@nillion/nillion-client-js-browser"
] = f"file:{os.environ['NILLION_SDK_ROOT']}/nillion-client-browser-npm.tar.gz"

# Write the modified package.json back to disk
with open(package_json_path, "w") as file:
    json.dump(package_json, file, indent=2)

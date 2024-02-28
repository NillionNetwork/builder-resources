#!/usr/bin/env python
"""
This script will update this project package.json devDependencies with the expected
npm js client sdk package location so that artifacts paths are developer independent
and remove old installs so that re-runs will always install latest tar.gz build
"""
import json
import os
import shutil

node_modules_path = "./node_modules"
package_json_path = "./package.json"
package_lock_path = "./package-lock.json"


def update_npm_package_json():
    NPM_FILEPATH = f"file:{os.environ['NILLION_SDK_ROOT']}/nillion-client-browser-npm.tar.gz"
    print(f"updating package.json with {NPM_FILEPATH}")
    # Read and parse package.json
    with open(package_json_path, "r") as file:
        package_json = json.load(file)

    # Update the package version
    package_json["devDependencies"]["@nillion/nillion-client-js-browser"] = NPM_FILEPATH

    # Write the modified package.json back to disk
    with open(package_json_path, "w") as file:
        json.dump(package_json, file, indent=2)


def remove_node_modules_and_package_lock():
    # Path to the `node_modules` directory and `package_lock.json` file

    # Remove `node_modules` directory if it exists
    if os.path.isdir(node_modules_path):
        print(f"Removing {node_modules_path}...")
        shutil.rmtree(node_modules_path)
        print(f"{node_modules_path} removed successfully.")
    else:
        print(f"{node_modules_path} does not exist, skipping...")

    # Remove `package-lock.json` file if it exists
    if os.path.isfile(package_lock_path):
        print(f"Removing {package_lock_path}...")
        os.remove(package_lock_path)
        print(f"{package_lock_path} removed successfully.")
    else:
        print(f"{package_lock_path} does not exist, skipping...")


if __name__ == "__main__":
    remove_node_modules_and_package_lock()
    update_npm_package_json()

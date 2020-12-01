#!/bin/bash
# Exit on first error
set -ex

# Bring the test network down
# pushd ../
./network.sh down
# popd

# clean out any old identites in the wallets
rm -rf ./application/server/**/*.id
rm -rf ./application/server/node_modules/*
rm -rf ./application/node_modules
rm -rf ./application/package-lock.json
rm -rf ./application/client/application/site.db

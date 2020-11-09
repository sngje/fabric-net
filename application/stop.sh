#!/bin/bash
# Exit on first error
set -ex

# Bring the test network down
pushd ../
./network.sh down
popd

# clean out any old identites in the wallets
rm -rf javascript/wallet/*
rm -rf javascript/org1-wallet/*
rm -rf javascript/org2-wallet/*
rm -rf javascript/node_modules/*
rm -r javascript/node_modules
rm -rf javascript/package-lock.json

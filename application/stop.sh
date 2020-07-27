#!/bin/bash
#
# Copyright IBM Corp All Rights Reserved
#
# SPDX-License-Identifier: Apache-2.0
#
# Exit on first error
set -ex

# Bring the test network down
pushd ../
./network.sh down
popd

# clean out any old identites in the wallets
rm -rf javascript/wallet/*
rm -rf javascript/node_modules/*
rm -r javascript/node_modules
rm -rf javascript/package-lock.json

#!/bin/bash
# Exit on first error
set -e

# create npm packages
pushd ./contract/javascript
npm install
popd


# don't rewrite paths for Windows Git Bash users
export MSYS_NO_PATHCONV=1
starttime=$(date +%s)
CC_SRC_LANGUAGE=${1:-"javascript"}
CC_SRC_LANGUAGE=`echo "$CC_SRC_LANGUAGE" | tr [:upper:] [:lower:]`
if [ "$CC_SRC_LANGUAGE" != "javascript"  -a "$CC_SRC_LANGUAGE" != "typescript" ] ; then

	echo The chaincode language ${CC_SRC_LANGUAGE} is not supported by this script
 	echo Supported chaincode languages are: go, java, javascript, and typescript
 	exit 1

fi

# clean out any old identites in the wallets
# rm -rf ./application/server/**/*.id

# launch network; create channel and join peer to channel
# pushd ../
./network.sh down
./network.sh up createChannel -ca -s couchdb
./network.sh deployFarm -l javascript
# popd


cat <<EOF
  Now run ./init.sh command to install npm packages and register admin and user
EOF

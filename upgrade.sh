export PATH=${PWD}/./bin:$PATH
export FABRIC_CFG_PATH=$PWD/./config/
export CORE_PEER_MSPCONFIGPATH=${PWD}/organizations/peerOrganizations/org1.example.com/users/Admin@org1.example.com/msp

VERSION=6
CHANNEL_NAME="mychannel"
CHAINCODE_PATH="./contract/javascript"
CHAINCODE_LABEL="farm_${VERSION}"
CHAINCODE_NAME="farm"

packgageChain() {
    echo "============== Chaincode installition =============="
    peer lifecycle chaincode package $CHAINCODE_LABEL.tar.gz --path ${CHAINCODE_PATH} --lang node --label $CHAINCODE_LABEL
    sleep 2
}
getOrg1() {
    echo "============== Get organization 1 =================="
    export CORE_PEER_TLS_ENABLED=true
    export CORE_PEER_LOCALMSPID="Org1MSP"
    export CORE_PEER_TLS_ROOTCERT_FILE=${PWD}/organizations/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/tls/ca.crt
    export CORE_PEER_MSPCONFIGPATH=${PWD}/organizations/peerOrganizations/org1.example.com/users/Admin@org1.example.com/msp
    export CORE_PEER_ADDRESS=localhost:7051
    sleep 2
}
getOrg2() {
    echo "================= Get organization 2 ================="
    export CORE_PEER_LOCALMSPID="Org2MSP"
    export CORE_PEER_TLS_ROOTCERT_FILE=${PWD}/organizations/peerOrganizations/org2.example.com/peers/peer0.org2.example.com/tls/ca.crt
    export CORE_PEER_MSPCONFIGPATH=${PWD}/organizations/peerOrganizations/org2.example.com/users/Admin@org2.example.com/msp
    export CORE_PEER_ADDRESS=localhost:10051
    sleep 2
}

getOrg3() {
    echo "================= Get organization 3 ================="
    export CORE_PEER_LOCALMSPID="Org3MSP"
    export CORE_PEER_TLS_ROOTCERT_FILE=${PWD}/organizations/peerOrganizations/org3.example.com/peers/peer0.org3.example.com/tls/ca.crt
    export CORE_PEER_MSPCONFIGPATH=${PWD}/organizations/peerOrganizations/org3.example.com/users/Admin@org3.example.com/msp
    export CORE_PEER_ADDRESS=localhost:13051
    sleep 2
}

installChain() {
    echo "============== Chaincode installition ==================="
    peer lifecycle chaincode install $CHAINCODE_LABEL.tar.gz >&log.txt
    sleep 2
}
queryChain() {
    echo "===================== Querychain installition ==========="
    peer lifecycle chaincode queryinstalled >&log.txt
    cat log.txt
	export PACKAGE_ID=$(sed -n "/${CHAINCODE_LABEL}/{s/^Package ID: //; s/, Label:.*$//; p;}" log.txt)
    sleep 2
}
appForOrg() {
    echo "============== Chaincode approval installition ========="
    peer lifecycle chaincode approveformyorg -o localhost:7050 --ordererTLSHostnameOverride orderer0.example.com \
    --channelID $CHANNEL_NAME --name $CHAINCODE_NAME --version ${VERSION} --package-id ${PACKAGE_ID} \
    --sequence ${VERSION} --tls --cafile ${PWD}/organizations/ordererOrganizations/example.com/orderers/orderer0.example.com/msp/tlscacerts/tlsca.example.com-cert.pem
    sleep 2
}
checkCommitReadiness() {
    echo "============ checkCommitReadiness installition ========="
    peer lifecycle chaincode checkcommitreadiness --channelID $CHANNEL_NAME --name $CHAINCODE_NAME \
    --version ${VERSION} --sequence ${VERSION} --tls \
    --cafile ${PWD}/organizations/ordererOrganizations/example.com/orderers/orderer0.example.com/msp/tlscacerts/tlsca.example.com-cert.pem --output json
    sleep 2
}
commitChaincodeDefinition() {
    echo "============== commitChaincodeDefinition ================"
    peer lifecycle chaincode commit -o localhost:7050 \
    --ordererTLSHostnameOverride orderer0.example.com --channelID $CHANNEL_NAME --name $CHAINCODE_NAME --version ${VERSION} --sequence ${VERSION} --tls --cafile ${PWD}/organizations/ordererOrganizations/example.com/orderers/orderer0.example.com/msp/tlscacerts/tlsca.example.com-cert.pem \
    --peerAddresses localhost:7051 --tlsRootCertFiles ${PWD}/organizations/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/tls/ca.crt \
    --peerAddresses localhost:10051 --tlsRootCertFiles ${PWD}/organizations/peerOrganizations/org2.example.com/peers/peer0.org2.example.com/tls/ca.crt \
    --peerAddresses localhost:13051 --tlsRootCertFiles ${PWD}/organizations/peerOrganizations/org3.example.com/peers/peer0.org3.example.com/tls/ca.crt
    sleep 2
}
chaincodeInvokeInit() {
    echo "===================== chaincodeInvokeInit ====================="
    peer chaincode invoke -o localhost:7050 \
    --ordererTLSHostnameOverride orderer0.example.com --tls --cafile ${PWD}/organizations/ordererOrganizations/example.com/orderers/orderer0.example.com/msp/tlscacerts/tlsca.example.com-cert.pem -C $CHANNEL_NAME -n farm \
    --peerAddresses localhost:7051 --tlsRootCertFiles ${PWD}/organizations/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/tls/ca.crt \
    --peerAddresses localhost:10051 --tlsRootCertFiles ${PWD}/organizations/peerOrganizations/org2.example.com/peers/peer0.org2.example.com/tls/ca.crt \
    --peerAddresses localhost:13051 --tlsRootCertFiles ${PWD}/organizations/peerOrganizations/org3.example.com/peers/peer0.org3.example.com/tls/ca.crt \
    -c '{"function":"queryAssetsAll","Args":[]}'
    sleep 2
}

packgageChain

# Org1
getOrg1
installChain
queryChain
appForOrg

# Org2
getOrg2
installChain
appForOrg

# Org3
getOrg3
installChain
appForOrg


checkCommitReadiness
commitChaincodeDefinition
chaincodeInvokeInit
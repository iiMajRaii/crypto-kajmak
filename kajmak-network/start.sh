#!/bin/bash

set -e

#delete containers
function dkcl(){
        CONTAINER_IDS=$(docker ps -aq)
	echo
        if [ -z "$CONTAINER_IDS" -o "$CONTAINER_IDS" = " " ]; then
                echo "========== No containers available for deletion =========="
        else
                docker rm -f $CONTAINER_IDS
        fi
	echo
}

#delete docker images
function dkrm(){
        DOCKER_IMAGE_IDS=$(docker images | grep "dev\|none\|test-vp\|peer[0-9]-" | awk '{print $3}')
	echo
        if [ -z "$DOCKER_IMAGE_IDS" -o "$DOCKER_IMAGE_IDS" = " " ]; then
		echo "========== No images available for deletion ==========="
        else
                docker rmi -f $DOCKER_IMAGE_IDS
        fi
	echo
}

function restartNetwork() {
	echo
  	#teardown the network and clean the containers and intermediate images
	docker-compose -f docker-compose.yaml down
	dkcl
	dkrm

	#Cleanup the stores
	rm -rf ./fabric-client-kv-org*

	#Start the network
	docker-compose -f docker-compose.yaml up -d ca.org1.example.com ca.org2.example.com ca.org3.example.com orderer.example.com peer0.org1.example.com peer1.org1.example.com peer0.org2.example.com peer1.org2.example.com peer0.org3.example.com peer1.org3.example.com
	echo
}


restartNetwork

export FABRIC_START_TIMEOUT=10 
sleep ${FABRIC_START_TIMEOUT}

docker exec -e "CORE_PEER_LOCALMSPID=Org1MSP" -e "CORE_PEER_MSPCONFIGPATH=/etc/hyperledger/crypto/users/org1/Admin@org1.example.com/msp" peer0.org1.example.com peer channel create -o orderer.example.com:7050 -c mychannel -f /etc/hyperledger/configtx/channel.tx

docker exec -e "CORE_PEER_LOCALMSPID=Org1MSP" -e "CORE_PEER_ADDRESS=peer0.org1.example.com:7051" -e "CORE_PEER_MSPCONFIGPATH=/etc/hyperledger/crypto/users/org1/Admin@org1.example.com/msp" peer0.org1.example.com peer channel join -b mychannel.block
docker exec -e "CORE_PEER_LOCALMSPID=Org1MSP" -e "CORE_PEER_ADDRESS=peer1.org1.example.com:7051" -e "CORE_PEER_MSPCONFIGPATH=/etc/hyperledger/crypto/users/org1/Admin@org1.example.com/msp" peer0.org1.example.com peer channel join -b mychannel.block

docker exec -e "CORE_PEER_LOCALMSPID=Org2MSP" -e "CORE_PEER_ADDRESS=peer0.org2.example.com:7051" -e "CORE_PEER_MSPCONFIGPATH=/etc/hyperledger/crypto/users/org2/Admin@org2.example.com/msp" peer0.org1.example.com peer channel join -b mychannel.block
docker exec -e "CORE_PEER_LOCALMSPID=Org2MSP" -e "CORE_PEER_ADDRESS=peer1.org2.example.com:7051" -e "CORE_PEER_MSPCONFIGPATH=/etc/hyperledger/crypto/users/org2/Admin@org2.example.com/msp" peer0.org1.example.com peer channel join -b mychannel.block
#!/bin/bash

export PATH=$GOPATH/src/github.com/hyperledger/fabric/build/bin:${PWD}/../bin:${PWD}:$PATH
export FABRIC_CFG_PATH=${PWD}

CHANNEL_NAME=mychannel

rm -fr config/*
rm -fr crypto-config/*
mkdir config

./bin/cryptogen generate --config=./crypto-config.yaml
if [ "$?" -ne 0 ]; then
    echo "Failed to generate crypto material..."
    exit 1
fi 

./bin/configtxgen -profile ThreeOrgsOrdererGenesis -outputBlock ./config/genesis.block
if [ "$?" -ne 0 ]; then
    echo "Failed to generate orderer genesis block..."
    exit 1
fi 

./bin/configtxgen -profile ThreeOrgsChannel -outputCreateChannelTx ./config/channel.tx -channelID $CHANNEL_NAME
if [ "$?" -ne 0 ]; then
    echo "Failed to generate channel configuration transaction..."
    exit 1
fi 


./bin/configtxgen -profile ThreeOrgsChannel -outputAnchorPeersUpdate ./config/Org1MSPanchors.tx -channelID $CHANNEL_NAME -asOrg Org1MSP
if [ "$?" -ne 0 ]; then
    echo "Failed to generate anchor peer update for Org1MSP..."
    exit 1
fi 

./bin/configtxgen -profile ThreeOrgsChannel -outputAnchorPeersUpdate ./config/Org2MSPanchors.tx -channelID $CHANNEL_NAME -asOrg Org2MSP
if [ "$?" -ne 0 ]; then
    echo "Failed to generate anchor peer update for Org2MSP..."
    exit 1
fi 

#./bin/configtxgen -profile ThreeOrgsChannel -outputAnchorPeersUpdate ./config/Org3MSPanchors.tx -channelID $CHANNEL_NAME -asOrg Org3MSP
#if [ "$?" -ne 0 ]; then
 #   echo "Failed to generate anchor peer update for Org3MSP..."
  #  exit 1
#fi 
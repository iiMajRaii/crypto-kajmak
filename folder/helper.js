/**
 * Copyright 2017 IBM All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the 'License');
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 *  Unless required by applicable law or agreed to in writing, software
 *  distributed under the License is distributed on an 'AS IS' BASIS,
 *  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *  See the License for the specific language governing permissions and
 *  limitations under the License.
 */
'use strict';
var log4js = require('log4js');
var logger = log4js.getLogger('Helper');
logger.setLevel('DEBUG');

var path = require('path');
var util = require('util');
var copService = require('fabric-ca-client');

var hfc = require('fabric-client');
hfc.setLogger(logger);
var ORGS = hfc.getConfigSetting('network-config'); //??

var clients = {};
var channels = {};
var caClients = {};

var sleep = async function (sleep_time_ms) {
	return new Promise(resolve => setTimeout(resolve, sleep_time_ms));
}

async function getClientForOrg (userorg, username) {
	logger.debug('getClientForOrg - ****** START %s %s', userorg, username)
	// get a fabric client loaded with a connection profile for this org
	let config = '-connection-profile-path';

	// build a client context and load it with a connection profile
	// lets only load the network settings and save the client for later
	//klijent pomocu kojeg aplikacija komunicira sa peerovima i orderima
	console.log("a");
	let client = hfc.loadFromConfig(hfc.getConfigSetting('network'+config)); //napravi se veza sa connection profile za cijelu mrezu
	console.log("b");
	// This will load a connection profile over the top of the current one one
	// since the first one did not have a client section and the following one does
	// nothing will actually be replaced.
	// This will also set an admin identity because the organization defined in the
	// client section has one defined
	client.loadFromConfig(hfc.getConfigSetting(userorg+config)); //napravi vezu sa connection profile za tacno odredjenu organizaciju
	console.log("c");
	// this will create both the state store and the crypto store based
	// on the settings in the client section of the connection profile
	//Sets the state and crypto suite for use by this client. This requires that a network config has been loaded. Will use the settings 
	//from the network configuration along with the system configuration to build instances of the stores and assign them to this client 
	//and the crypto suites if needed. 
	await client.initCredentialStores();
	console.log("d");
	// The getUserContext call tries to get the user from persistence.
	// If the user has been saved to persistence then that means the user has
	// been registered and enrolled. If the user is found in persistence
	// the call will then assign the user to the client object.
	if(username) {
		//This function attempts to load the user by name from the local storage (via the KeyValueStore interface).
		let user = await client.getUserContext(username, true);
		if(!user) {
			throw new Error(util.format('User was not found :', username));
		} else {
			logger.debug('User %s was found to be registered and enrolled', username);
		}
	}
	logger.debug('getClientForOrg - ****** END %s %s \n\n', userorg, username)

	return client;
}

var getRegisteredUser = async function(username, userOrg, isJson) {
	try {
		var client = await getClientForOrg(userOrg);
		logger.debug('Successfully initialized the credential stores');
			// client can now act as an agent for organization Org1
			// first check to see if the user is already enrolled
		var user = await client.getUserContext(username, true);
		var response;
		if (user && user.isEnrolled()) {
			logger.info('Successfully loaded member from persistence');
		} else {
			// user was not enrolled, so we will need an admin user object to register
			logger.info('User %s was not enrolled, so we will need an admin user object to register',username);
			var admins = hfc.getConfigSetting('admins');
			let adminUserObj = await client.setUserContext({username: admins[0].username, password: admins[0].secret});
			let caClient = client.getCertificateAuthority();
			let secret = await caClient.register({
				enrollmentID: username
			}, adminUserObj);
			logger.debug('Successfully got the secret for user %s',username);
			user = await client.setUserContext({username:username, password:secret});
			logger.debug('Successfully enrolled username %s  and setUserContext on the client object', username);
		}
		if(user && user.isEnrolled) {
			if (isJson && isJson === true) {
				response = {
					message: 'User ' + username + ' registered and enrolled successfully!'
				};
				return response;
			}
		} else {
			response = {
				message: username + ' failed to register and enroll!'
			};
			return response;
		}
	} catch(error) {
		logger.error('Failed to get registered user: %s with error: %s', username, error.toString());
		response = {
			message: username + ' failed to register and enroll!'
		};
		return response;
	}
};

var getAllKajmak = async function(username,userOrg) {
	try {
		var client = await getClientForOrg(userOrg,username);
		logger.debug('Successfully got the fabric client for the organization "%s"', userOrg);
		var channel = client.getChannel('mychannel');
		if(!channel) {
			let message = util.format('Channel %s was not defined in the connection profile', channelName);
			logger.error(message);
			throw new Error(message);
		}
		var targets = null;
		if(userOrg == "Org1") {
			targets = ['peer0.org1.example.com'];
		} else if(userOrg == "Org2") {
			targets = ['peer0.org2.example.com'];
		}

		var tx_id = client.newTransactionID();
		const request = {
			targets: targets,
		    chaincodeId: 'kajmak-app',
		    txId: tx_id,
	        fcn: 'queryAllKajmak',
	        args: ['']
	    };
	    let results = await channel.queryByChaincode(request);
	    console.log("Query has completed, checking results");
		    if (results && results.length == 1) {
		        if (results[0] instanceof Error) {
		            console.error("error from query = ", results[0]);
		        } else {
		            console.log("Response is ", results[0].toString());
		            return results;
		        }
		    } else {
		        console.log("No payloads were returned from query");
		    }
	} catch(error) {
		logger.error('Failed to get all kajmak with error: %s', error.toString());
	}
};

var addKajmak = async function(username,userOrg,kajmakData) {
	var error_message = null;
	try {
		var array = kajmakData.split("-");

		var key = array[0]
		var name = array[1]
		var animal = array[2]
		var location = array[3]
		var quantity = array[4]
		var productionDate = array[5]
		var expirationDate = array[6]
		var owner = array[7]

		console.log(key,name,animal,location,quantity,productionDate,expirationDate,owner);

		var client = await getClientForOrg(userOrg,username);
		logger.debug('Successfully got the fabric client for the organization "%s"', userOrg);
		var channel = client.getChannel('mychannel');
		if(!channel) {
			let message = util.format('Channel %s was not defined in the connection profile', channelName);
			logger.error(message);
			throw new Error(message);
		}
		var targets = null;
		if(userOrg == "Org1") {
			targets = ['peer0.org1.example.com'];
		} else if(userOrg == "Org2") {
			targets = ['peer0.org2.example.com'];
		}

		var tx_id = client.newTransactionID();
		var tx_id_string = tx_id.getTransactionID();
		console.log("Assigning transaction_id: ", tx_id._transaction_id);

		const request = {
	        targets : targets,
	        chaincodeId: 'kajmak-app',
	        fcn: 'recordKajmak',
		    args: [key, name, owner, animal, location, quantity, productionDate, expirationDate],
	        chainId: channel,
	        txId: tx_id
 	    };
		    
	    let results = await channel.sendTransactionProposal(request);

	    var proposalResponses = results[0];
		var proposal = results[1];

		let isProposalGood = false;
		if (proposalResponses && proposalResponses[0].response && proposalResponses[0].response.status === 200) {
		    isProposalGood = true;
		    console.log('Transaction proposal was good');
		} else {
		    console.error('Transaction proposal was bad');
		}

		if (isProposalGood) {
		    console.log(util.format('Successfully sent Proposal and received ProposalResponse: Status - %s, message - "%s"',
		        proposalResponses[0].response.status, proposalResponses[0].response.message));

		    var promises = [];
			let event_hubs = channel.getChannelEventHubsForOrg();
			event_hubs.forEach((eh) => {
				logger.debug('invokeAddKajmakEventPromise - setting up event');
				let invokeEventPromise = new Promise((resolve, reject) => {
					let event_timeout = setTimeout(() => {
						
						let message = 'REQUEST_TIMEOUT:' + eh.getPeerAddr();
						logger.error(message);
						eh.disconnect();
						reject();
					}, 20000);
					eh.registerTxEvent(tx_id_string, (tx, code, block_num) => {
						logger.info('The addKajmak invoke chaincode transaction has been committed on peer %s',eh.getPeerAddr());
						logger.info('Transaction %s has status of %s in block %s', tx, code, block_num);
						clearTimeout(event_timeout);
						eh.unregisterTxEvent(tx_id_string);
            			eh.disconnect();

						if (code !== 'VALID') {
							let message = util.format('The invoke chaincode transaction was invalid, code:%s',code);
							logger.error(message);
							reject(new Error(message));
						} else {
							let message = 'The invoke chaincode transaction was valid.';
							logger.info(message);
							resolve(message);
						}
					}, (err) => {
						clearTimeout(event_timeout);
						logger.error(err);
						reject(err);
					},
						// the default for 'unregister' is true for transaction listeners
						// so no real need to set here, however for 'disconnect'
						// the default is false as most event hubs are long running
						// in this use case we are using it only once
						{unregister: true, disconnect: true}
					);
					eh.connect();
				});
				promises.push(invokeEventPromise);
			});

			var requestMain = {
				txId: tx_id,
			    proposalResponses: proposalResponses,
		        proposal: proposal
			};

			var sendPromise = channel.sendTransaction(requestMain); 
			promises.push(sendPromise); 

			let results = await Promise.all(promises);
			logger.debug(util.format('------->>> R E S P O N S E : %j', results));
			let response = results.pop(); //  orderer results are last in the results
			if (response.status === 'SUCCESS') {
				logger.info('Successfully sent transaction to the orderer.');
			} else {
				error_message = util.format('Failed to order the transaction. Error code: %s',response.status);
				logger.debug(error_message);
			}

			// now see what each of the event hubs reported
			for(let i in results) {
				let event_hub_result = results[i];
				let event_hub = event_hubs[i];
				logger.debug('Event results for event hub :%s',event_hub.getPeerAddr());
				if(typeof event_hub_result === 'string') {
					logger.debug(event_hub_result);
					var rezultat = {
						message: "Kajmak created successfully!"
					};
					return rezultat;
				} else {
					if(!error_message) error_message = event_hub_result.toString();
					logger.debug(event_hub_result.toString());
					var rezultat = {
						message: "Kajmak failed to create!"
					};
					return rezultat;
				}
			}
		} else {
			error_message = util.format('Failed to send Proposal and receive all good ProposalResponse');
			logger.debug(error_message);
		}
	} catch(error) {
		logger.error('Failed to add kajmak with error: %s', error.toString());
	}
};


var deleteKajmak = async function(username,userOrg,kajmakData) {
	var error_message = null;
	try {
		var array = kajmakData.split("-");
		console.log(array);

		var key = array[0]
		var name = array[1]
		var owner = array[2]
		var animal = array[3]
		var location = array[4]
		var quantity = array[5]
		var productionDate = array[6]
		var expirationDate = array[7]

		var client = await getClientForOrg(userOrg,username);
		logger.debug('Successfully got the fabric client for the organization "%s"', userOrg);
		var channel = client.getChannel('mychannel');
		if(!channel) {
			let message = util.format('Channel %s was not defined in the connection profile', channelName);
			logger.error(message);
			throw new Error(message);
		}
		var targets = null;
		if(userOrg == "Org1") {
			targets = ['peer0.org1.example.com'];
		} else if(userOrg == "Org2") {
			targets = ['peer0.org2.example.com'];
		}

		var tx_id = client.newTransactionID();
		console.log("Assigning transaction_id: ", tx_id._transaction_id);
		var tx_id_string = tx_id.getTransactionID();

		var request = {
		    targets: targets,
		    chaincodeId: 'kajmak-app',
		    fcn: 'deleteKajmak',
		    args: [key, name, owner, animal, location, quantity, productionDate, expirationDate],
		    chainId: channel,
		    txId: tx_id
		};
		    
	    let results = await channel.sendTransactionProposal(request);

	    var proposalResponses = results[0];
		var proposal = results[1];

		let isProposalGood = false;
		if (proposalResponses && proposalResponses[0].response && proposalResponses[0].response.status === 200) {
		    isProposalGood = true;
		    console.log('Transaction proposal was good');
		} else {
		    console.error('Transaction proposal was bad');
		}

		if (isProposalGood) {
		    console.log(util.format('Successfully sent Proposal and received ProposalResponse: Status - %s, message - "%s"',
		        proposalResponses[0].response.status, proposalResponses[0].response.message));

			var promises = [];
			let event_hubs = channel.getChannelEventHubsForOrg();
			event_hubs.forEach((eh) => {
				logger.debug('invokeDeleteKajmakEventPromise - setting up event');
				console.log(eh);
				let invokeEventPromise = new Promise((resolve, reject) => {
					let regid = null;
					let event_timeout = setTimeout(() => {
						if(regid) {
							let message = 'REQUEST_TIMEOUT:' + eh.getPeerAddr();
							logger.error(message);
							eh.unregisterChaincodeEvent(regid);
							eh.disconnect();
						}
						reject();
					}, 20000);

					regid = eh.registerChaincodeEvent('kajmak-app', 'deleteEvent',
				        (event, block_num, txnid, status) => {
						console.log('Successfully got a chaincode event with transid:'+ txnid + ' with status:'+status);
				        let event_payload = event.payload.toString();
				        console.log(event_payload);
				        if(event_payload.indexOf(array[0]) > -1) {
				            clearTimeout(event_timeout);
				            // Chaincode event listeners are meant to run continuously
				            // Therefore the default to automatically unregister is false
				            // So in this case we want to shutdown the event listener once
				            // we see the event with the correct payload
				            eh.unregisterChaincodeEvent(regid);
				            console.log('Successfully received the chaincode event on block number '+ block_num);
				            resolve(event_payload);
				        } else {
				            console.log('Successfully got chaincode event ... just not the one we are looking for on block number '+ block_num);
				        }  
					}, (err) => {
						clearTimeout(event_timeout);
						logger.error(err);
						reject(err);
					}
					// no options specified
			        // startBlock will default to latest
			        // endBlock will default to MAX
			        // unregister will default to false
			        // disconnect will default to false
					);
					eh.connect(true);
				});
				promises.push(invokeEventPromise);
				console.log(eh.isconnected());
			});

			var requestMain = {
				txId: tx_id,
			    proposalResponses: proposalResponses,
		        proposal: proposal
			};

			var sendPromise = channel.sendTransaction(requestMain); 
			promises.push(sendPromise); 

			let results = await Promise.all(promises);
			logger.debug(util.format('------->>> R E S P O N S E : %j', results));
			let response = results.pop(); //  orderer results are last in the results
			if (response.status === 'SUCCESS') {
				logger.info('Successfully sent transaction to the orderer.');
			} else {
				error_message = util.format('Failed to order the transaction. Error code: %s',response.status);
				logger.debug(error_message);
			}

			// now see what each of the event hubs reported
			for(let i in results) {
				let event_hub_result = results[i];
				let event_hub = event_hubs[i];
				logger.debug('Event results for event hub :%s',event_hub.getPeerAddr());
				if(typeof event_hub_result === 'string') {
					logger.debug(event_hub_result);
					var rezultat = {event_payload : event_hub_result};
					return rezultat;
				} else {
					if(!error_message) error_message = event_hub_result.toString();
					logger.debug(event_hub_result.toString());
				}
			}
		} else {
			error_message = util.format('Failed to send Proposal and receive all good ProposalResponse');
			logger.debug(error_message);
		}
	} catch(error) {
		logger.error('Failed to delete kajmak with error: %s', error.toString());
	}
};


var changeOwner = async function(username,userOrg,ownerData) {
	var error_message = null;
	try {
		console.log("changing owner of kajmak catch: ");

		var array = ownerData.split("-");
		var key = array[0]
		var owner = array[1];

		var client = await getClientForOrg(userOrg,username);
		logger.debug('Successfully got the fabric client for the organization "%s"', userOrg);
		var channel = client.getChannel('mychannel');
		if(!channel) {
			let message = util.format('Channel %s was not defined in the connection profile', channelName);
			logger.error(message);
			throw new Error(message);
		}
		var targets = null;
		if(userOrg == "Org1") {
			targets = ['peer0.org1.example.com'];
		} else if(userOrg == "Org2") {
			targets = ['peer0.org2.example.com'];
		}

		var tx_id = client.newTransactionID();
		console.log("Assigning transaction_id: ", tx_id._transaction_id);
		var tx_id_string = tx_id.getTransactionID();

		var request = {
		    targets : targets,
		    chaincodeId: 'kajmak-app',
	        fcn: 'changeKajmakOwner',
		    args: [key, owner],
		    chainId: channel,
	        txId: tx_id
	    };

	    let results = await channel.sendTransactionProposal(request);

	    var proposalResponses = results[0];
		var proposal = results[1];
	    var all_good = true;
		for(var i in proposalResponses) {
			let one_good = false;
			if(proposalResponses && proposalResponses[i].response && proposalResponses[i].response.status === 200) {
				one_good = true;
				logger.info('Transaction proposal was good');
			} else {
				logger.error('Transaction proposal was bad');
			}
			all_good = all_good & one_good;
		}

		if(all_good) {
			logger.info(util.format(
				'Successfully sent Proposal and received ProposalResponse: Status - %s, message - "%s", metadata - "%s", endorsement signature: %s',
				proposalResponses[0].response.status, proposalResponses[0].response.message,
				proposalResponses[0].response.payload, proposalResponses[0].endorsement.signature));

			var promises = [];
			let event_hubs = channel.getChannelEventHubsForOrg();
			event_hubs.forEach((eh) => {
				logger.debug('invokeChangeOwnerEventPromise - setting up event');
				let invokeEventPromise = new Promise((resolve, reject) => {
					let event_timeout = setTimeout(() => {
						
						let message = 'REQUEST_TIMEOUT:' + eh.getPeerAddr();
						logger.error(message);
						eh.disconnect();
						reject();
					}, 20000);
					eh.registerTxEvent(tx_id_string, (tx, code, block_num) => {
						logger.info('The changeOwner invoke chaincode transaction has been committed on peer %s',eh.getPeerAddr());
						logger.info('Transaction %s has status of %s in block %s', tx, code, block_num);
						clearTimeout(event_timeout);
						eh.unregisterTxEvent(tx_id_string);
            			eh.disconnect();

						if (code !== 'VALID') {
							let message = util.format('The invoke chaincode transaction was invalid, code:%s',code);
							logger.error(message);
							reject(new Error(message));
						} else {
							let message = 'The invoke chaincode transaction was valid.';
							logger.info(message);
							resolve(message);
						}
					}, (err) => {
						clearTimeout(event_timeout);
						logger.error(err);
						reject(err);
					},
						// the default for 'unregister' is true for transaction listeners
						// so no real need to set here, however for 'disconnect'
						// the default is false as most event hubs are long running
						// in this use case we are using it only once
						{unregister: true, disconnect: true}
					);
					eh.connect();
				});
				promises.push(invokeEventPromise);
			});

			var requestMain = {
				txId: tx_id,
			    proposalResponses: proposalResponses,
		        proposal: proposal
			};

			var sendPromise = channel.sendTransaction(requestMain); 
			promises.push(sendPromise); 

			let results = await Promise.all(promises);
			logger.debug(util.format('------->>> R E S P O N S E : %j', results));
			let response = results.pop(); //  orderer results are last in the results
			if (response.status === 'SUCCESS') {
				logger.info('Successfully sent transaction to the orderer.');
			} else {
				error_message = util.format('Failed to order the transaction. Error code: %s',response.status);
				logger.debug(error_message);
			}

			// now see what each of the event hubs reported
			for(let i in results) {
				let event_hub_result = results[i];
				let event_hub = event_hubs[i];
				logger.debug('Event results for event hub :%s',event_hub.getPeerAddr());
				if(typeof event_hub_result === 'string') {
					logger.debug(event_hub_result);
					var rezultat = {
						message: "Owner changed successfully!"
					}
					return rezultat;
				} else {
					if(!error_message) error_message = event_hub_result.toString();
					logger.debug(event_hub_result.toString());
				}
			}
		} else {
			error_message = util.format('Failed to send Proposal and receive all good ProposalResponse');
			logger.debug(error_message);
		}
	} catch(error) {
		logger.error('Failed to change owner with error: %s', error.toString());
	}
};

var changeQuantity = async function(username,userOrg,quantityData) {
	try {
		console.log("changing quantity of kajmak: ");

		var array = quantityData.split("-");
		var key = array[0]
		var quantity = array[1];

		var client = await getClientForOrg(userOrg,username);
		logger.debug('Successfully got the fabric client for the organization "%s"', userOrg);
		var channel = client.getChannel('mychannel');
		if(!channel) {
			let message = util.format('Channel %s was not defined in the connection profile', channelName);
			logger.error(message);
			throw new Error(message);
		}
		var targets = null;
		if(userOrg == "Org1") {
			targets = ['peer0.org1.example.com'];
		} else if(userOrg == "Org2") {
			targets = ['peer0.org2.example.com'];
		}

		var tx_id = client.newTransactionID();
		console.log("Assigning transaction_id: ", tx_id._transaction_id);
		var tx_id_string = tx_id.getTransactionID();

		var request = {
		    targets : targets,
		    chaincodeId: 'kajmak-app',
	        fcn: 'changeKajmakQuantity',
		    args: [key, quantity],
		    chainId: channel,
	        txId: tx_id
	    };

	    let results = await channel.sendTransactionProposal(request);

	    var proposalResponses = results[0];
		var proposal = results[1];

	    var all_good = true;
		for(var i in proposalResponses) {
			let one_good = false;
			if(proposalResponses && proposalResponses[i].response && proposalResponses[i].response.status === 200) {
				one_good = true;
				logger.info('Transaction proposal was good');
			} else {
				logger.error('Transaction proposal was bad');
			}
			all_good = all_good & one_good;
		}

		if(all_good) {
			logger.info(util.format(
				'Successfully sent Proposal and received ProposalResponse: Status - %s, message - "%s", metadata - "%s", endorsement signature: %s',
				proposalResponses[0].response.status, proposalResponses[0].response.message,
				proposalResponses[0].response.payload, proposalResponses[0].endorsement.signature));

			var promises = [];
			let event_hubs = channel.getChannelEventHubsForOrg();
			event_hubs.forEach((eh) => {
				logger.debug('invokeChangeQuantityEventPromise - setting up event');
				let invokeEventPromise = new Promise((resolve, reject) => {
					let event_timeout = setTimeout(() => {
						
						let message = 'REQUEST_TIMEOUT:' + eh.getPeerAddr();
						logger.error(message);
						eh.disconnect();
						reject();
					}, 20000);
					eh.registerTxEvent(tx_id_string, (tx, code, block_num) => {
						logger.info('The changeQuantity invoke chaincode transaction has been committed on peer %s',eh.getPeerAddr());
						logger.info('Transaction %s has status of %s in block %s', tx, code, block_num);
						clearTimeout(event_timeout);
						eh.unregisterTxEvent(tx_id_string);
            			eh.disconnect();

						if (code !== 'VALID') {
							let message = util.format('The invoke chaincode transaction was invalid, code:%s',code);
							logger.error(message);
							reject(new Error(message));
						} else {
							let message = 'The invoke chaincode transaction was valid.';
							logger.info(message);
							resolve(message);
						}
					}, (err) => {
						clearTimeout(event_timeout);
						logger.error(err);
						reject(err);
					},
						// the default for 'unregister' is true for transaction listeners
						// so no real need to set here, however for 'disconnect'
						// the default is false as most event hubs are long running
						// in this use case we are using it only once
						{unregister: true, disconnect: true}
					);
					eh.connect();
				});
				promises.push(invokeEventPromise);
			});

			var requestMain = {
				txId: tx_id,
			    proposalResponses: proposalResponses,
		        proposal: proposal
			};

			var sendPromise = channel.sendTransaction(requestMain); 
			promises.push(sendPromise); 

			let results = await Promise.all(promises);
			logger.debug(util.format('------->>> R E S P O N S E : %j', results));
			let response = results.pop(); //  orderer results are last in the results
			if (response.status === 'SUCCESS') {
				logger.info('Successfully sent transaction to the orderer.');
			} else {
				error_message = util.format('Failed to order the transaction. Error code: %s',response.status);
				logger.debug(error_message);
			}

			// now see what each of the event hubs reported
			for(let i in results) {
				let event_hub_result = results[i];
				let event_hub = event_hubs[i];
				logger.debug('Event results for event hub :%s',event_hub.getPeerAddr());
				if(typeof event_hub_result === 'string') {
					logger.debug(event_hub_result);
				} else {
					if(!error_message) error_message = event_hub_result.toString();
					logger.debug(event_hub_result.toString());
				}
			}
			let rezultatKreiranja = {
	    		message: "Sve je ok u kreiranju!"
	    	};
	   		return rezultatKreiranja;
		} else {
			error_message = util.format('Failed to send Proposal and receive all good ProposalResponse');
			logger.debug(error_message);
		}
	} catch(error) {
		logger.error('Failed to change quantity with error: %s', error.toString());
	}
};

var setupChaincodeDeploy = function() {
	process.env.GOPATH = path.join(__dirname, hfc.getConfigSetting('CC_SRC_PATH'));
};

var getLogger = function(moduleName) {
	var logger = log4js.getLogger(moduleName);
	logger.setLevel('DEBUG');
	return logger;
};

exports.getClientForOrg = getClientForOrg;
exports.getLogger = getLogger;
exports.setupChaincodeDeploy = setupChaincodeDeploy;
exports.getRegisteredUser = getRegisteredUser;
exports.getAllKajmak = getAllKajmak;
exports.addKajmak = addKajmak;
exports.deleteKajmak = deleteKajmak;
exports.changeOwner = changeOwner;
exports.changeQuantity = changeQuantity;
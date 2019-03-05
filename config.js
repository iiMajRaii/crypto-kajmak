var util = require('util');
var path = require('path');
var hfc = require('fabric-client');

var file = 'network-config.yaml';

hfc.setConfigSetting('network-connection-profile-path', path.join(__dirname, 'kajmak-network',file));
hfc.setConfigSetting('Org1-connection-profile-path', path.join(__dirname,'kajmak-network', 'org1.yaml'));
hfc.setConfigSetting('Org2-connection-profile-path', path.join(__dirname,'kajmak-network','org2.yaml'));
hfc.setConfigSetting('Org3-connection-profile-path', path.join(__dirname,'kajmak-network','org3.yaml'));

hfc.addConfigFile(path.join(__dirname,'config.json'));
'use strict';
var log4js = require('log4js');
var logger = log4js.getLogger('KajmakWebApp');
var fs = require('fs');

var express = require('express');
var bodyParser = require('body-parser');
var http = require('http');
var util = require('util');

var expressJWT = require('express-jwt');
var jwt = require('jsonwebtoken');
var bcrypt = require('bcryptjs'); //enkripcija passworda
var db = require('./database'); //konektovanje na bazu
var User = require('./user/User');

var cookieParser = require('cookie-parser');

//veza sa chaincodom
var helper = require('./folder/helper.js');
var path = require('path');


var app = express();

require('./config.js');

var hfc = require('fabric-client');
var port = process.env.PORT || hfc.getConfigSetting('port');
var host = process.env.HOST || hfc.getConfigSetting('host');

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());

//jwt
app.set('secret', 'cryptokajmaksecret');

app.use(express.static(path.join(__dirname, './client')));

var requestedArray = [];
var approvedArray = [];

//nezasticena ruta
app.post('/register', async function (req, res) {
	console.log("zahtjev primljen");
	console.log(req.body);
	var username = req.body.username;
	var orgName = req.body.orgname;
	let response = await helper.getRegisteredUser(username, orgName, true);
	logger.debug('-- returned from registering the username %s for organization %s', username, orgName);
	if (response && typeof response !== 'string') {
		logger.debug('Successfully registered the username %s for organization %s', username, orgName);
		var hashedPassword = bcrypt.hashSync(req.body.password, 8);
		var user = new User({
			email: req.body.email,
			username: req.body.username,
			password: hashedPassword,
			orgname: orgName,
			role: req.body.role,
			creation_dt: Date.now()
		});
		let promise = user.save();
		promise.then(function (doc) {
			return res.status(201).json(doc); //doc je user objekat koji vracamo kao odgovor
		});
		promise.catch(function (err) {
			return res.status(501).json({ messaga: "Error while registering admin user!" });
		});
		//res.json(response);
	} else {
		logger.debug('Failed to register the username %s for organization %s with::%s', username, orgName, response);
		res.json({ success: false, message: response });
	}
});


//nezasticena ruta
app.get('/login/:user', async function (req, res) {
	console.log("zahtjev primljen /login");
	console.log(req.url);
	var array = req.params.user.split("-");
	let promise = User.findOne({ username: array[0] }).exec();
	promise.then(function (doc) {
		if (doc) {
			console.log(doc);
			console.log(array[1]); //password ukucan na formi
			console.log(doc.password); //password u bazi
			var passwordIsValid = bcrypt.compareSync(array[1], doc.password);
			if (passwordIsValid) {
				//generate token
				let token = jwt.sign({ username: doc.username, orgname: doc.orgname }, 'cryptokajmaksecret', { expiresIn: '3h' });
				var expiryDate = new Date(Number(new Date()) + 315360000000);
				res.cookie('token', token, { expires: expiryDate, path: '/' }); //pisanje u cookie
				console.log("Token:" + token);
				if (doc.role == "admin") {
					return res.status(201).json({ message: "adminok" });
				} else if (doc.role == "user") {
					return res.status(201).json({ message: "userok" });
				}
			} else {
				return res.status(201).json({ message: "Invalid Credentials!" });
			}
		} else {
			console.log("errr");
			return res.status(201).json({ message: "User is not registered!" });
		}
	});
	promise.catch(function (err) {
		return res.status(501).json({ message: "Error while login!" });
	});
});



//middleware
app.use((req, res, next) => {
	console.log('==============================');
	console.log("Uslo u middlware");
	console.log(req.url);
	let token = req.cookies.token;
	console.log(token);
	if (!token) {
		return res.json({ message: 'Missing token.' });
	}

	jwt.verify(token, 'cryptokajmaksecret', (err, decoded) => {
		if (err) return res.json({ message: 'Failed to authenticate token.' });
		// do something else
		req.decoded = decoded;
		console.log(decoded);
		next();
	});
});

//ispod su sve zasticene rute
app.get('/addUser/:user', async function (req, res) {
	console.log("primljen zahtjev /addUser");
	var array = req.params.user.split("-");
	var username = array[1];
	console.log(username);
	var orgName = array[3];
	console.log(orgName);
	let response = await helper.getRegisteredUser(username, orgName, true);
	logger.debug('-- returned from registering the username %s for organization %s', username, orgName);
	if (response && typeof response !== 'string') {
		logger.debug('Successfully registered the username %s for organization %s', username, orgName);
		//res.json(res);
		var hashedPassword = bcrypt.hashSync(array[2], 8);
		var user = new User({
			email: array[0],
			username: array[1],
			password: hashedPassword,
			orgname: array[3],
			role: "user",
			creation_dt: Date.now()
		});
		let promise = user.save();
		promise.then(function (doc) {
			return res.status(201).json({message: response.message});
		});
		promise.catch(function (err) {
			return res.status(501).json({message: "Error while registering and enrolling user!" });
		});
	} else {
		logger.debug('Failed to register the username %s for organization %s with::%s', username, orgName, response);
		res.json({message: response.message});
	}
});


app.get('/logout', async function (req, res) {
	console.log("Primljen zahtjev na /logout");
	res.clearCookie('token');
	res.status(201).json({ message: "ok" });
});


app.get('/get_all_kajmak', async function (req, res) {
	console.log(req.decoded);
	let response = await helper.getAllKajmak(req.decoded.username, req.decoded.orgname);
	res.json(JSON.parse(response[0].toString()));
});


app.get('/add_kajmak/:kajmak', async function (req, res) {
	req.params.kajmak = req.params.kajmak + '-' + req.decoded.username;
	console.log(req.params.kajmak);
	let response = await helper.addKajmak(req.decoded.username, req.decoded.orgname, req.params.kajmak);
	res.json({message: response.message});
});


app.get('/delete_kajmak/:kjmk', async function (req, res) {
	console.log("\nZahtjev je primljen");
	let response = await helper.deleteKajmak(req.decoded.username, req.decoded.orgname, req.params.kjmk);
	console.log(response);
	var filename = "notifikacije.txt";
	let content = response.event_payload + '\r\n';
	fs.appendFile(filename,content,function(err) {
		if(err) throw err;
		console.log("Saved!");
	});
	res.json({message: "No Errors"});
});

app.get('/change_owner/:owner', async function (req, res) {
	console.log("\nZahtjev je primljen");
	var array = req.params.owner.split("-");
	console.log(array);
	if (req.decoded.username !== array[2]) {
		console.log("pozz iz if");
		res.json({ message: "You are not the owner!" });
	} else {
		let response = await helper.changeOwner(req.decoded.username, req.decoded.orgname, req.params.owner);
		res.json({message: response.message});
	}
});

app.get('/change_quantity/:quantity', async function (req, res) {
	console.log("\nZahtjev je primljen");
	var array = req.params.quantity.split("-");
	console.log(array);

	let response = await helper.changeQuantity(req.decoded.username, req.decoded.orgname, req.params.quantity);
	res.json({message: response.message});
});

app.get('/get_all_users', async function (req, res) {
	console.log("Primljen zahtje za citanjem korisnika");
	var registeredUsers = [];
	let promise = User.find({}).exec();
	promise.then(function (doc) {
		if (doc) {
			console.log(doc);
			for (var i = 1; i < doc.length; i++) {
				if (doc[i].username !== req.decoded.username) {
					console.log(doc[i].username);
					registeredUsers.push(doc[i].username);
				}
			}
			console.log(registeredUsers);
			return res.status(201).send(registeredUsers);
		}
	});
});

app.get('/check_owners/:kData', async function (req, res) {
	console.log("Primljen zahtjev za provjerom vlasnika");
	var array = req.params.kData.split("-");
	if (req.decoded.username == array[0] && req.decoded.username == array[1]) {
		console.log("uslo u if");
		return res.json({ message: "allow" });
	} else if (req.decoded.username == array[0] && req.decoded.username !== array[1]) {
		console.log("uslo u else if");
		var filename = array[1] + ".txt";

		
		//pretraziti niz dozvoljenih zahtjeva
		for(var i = 0; i < approvedArray.length; i++) {
			if(approvedArray[i].sender == array[0] && approvedArray[i].kajmakID == array[5]) {
				approvedArray.splice(i,1);
				return res.json({ message: "allow"});
			}
		}
	

		//pretrazi niz poslanih zahtjeva
		for(var i = 0; i < requestedArray.length; i++) {
			if(requestedArray[i].sender == array[0] && requestedArray[i].kajmakID == array[5]) {
				return res.json({ message: "Request is already sent"});
			}
		}
		requestedArray.push({sender: array[0], kajmakID: array[5]});
		console.log(requestedArray);
		var content = "User " + array[0] + " wants to mix " + array[3] + " with ID " + array[5] + " ." + '\r\n';
		fs.appendFile(filename, content, function (err) {
			if (err) throw err;
			console.log("Saved!");
		});
		var filenameResponses = array[1] + "Responses.txt";
		fs.closeSync(fs.openSync(filenameResponses, 'w'));
		return res.json({ message: "Request sent" });
	} else if (req.decoded.username !== array[0] && req.decoded.username == array[1]) {
		console.log("uslo u else if");
		var filename = array[0] + ".txt";
		
		//pretraziti niz
		for(var i = 0; i < approvedArray.length; i++) {
			if(approvedArray[i].sender == array[1] && approvedArray[i].kajmakID == array[4]) {
				approvedArray.splice(i,1);
				return res.json({ message: "allow"});
			}
		}
		
		for(var i = 0; i < requestedArray.length; i++) {
			if(requestedArray[i].sender == array[1] && requestedArray[i].kajmakID == array[4]) {
				return res.json({ message: "Request is already sent"});
			}
		}
		requestedArray.push({sender: array[1], kajmakID: array[4]});
		console.log(requestedArray);
		var content = "User " + array[1] + " wants to mix " + array[2] + " with ID " + array[4] + " ." + '\r\n';
		fs.appendFile(filename, content, function (err) {
			if (err) throw err;
			console.log("Saved!");
		});
		var filenameResponses = array[0] + "Responses.txt";
		fs.closeSync(fs.openSync(filenameResponses, 'w'));
		return res.json({ message: "Request sent" });
	} else if (req.decoded.username !== array[0] && req.decoded.username !== array[1]) {
		console.log("Kad oba vlasnika nisu trenutno logovani korisnik");
		var filename1 = array[0] + ".txt";
		var filename2 = array[1] + ".txt";
		
		//provjera da li se zahtjevi vec odobreni
		let firstApproved = false;
		let secondApproved = false;
		for(var i = 0; i < approvedArray.length; i++) {
			if(approvedArray[i].sender == req.decoded.username && approvedArray[i].kajmakID == array[4]) {
				approvedArray.splice(i,1);
				firstApproved = true;
			}
			if(approvedArray[i].sender == req.decoded.username && approvedArray[i].kajmakID == array[5]) {
				approvedArray.splice(i,1);
				secondApproved = true;
			}		
		}
		if(firstApproved == true && secondApproved == true) {
			return res.json({ message: "allow"});
		}

		// provjera da li je zahtjev vec poslan
		let firstRequestSent = false;
		let secondRequestSent = false;
		for(var i = 0; i < requestedArray.length; i++) {
			if(requestedArray[i].sender == req.decoded.username && requestedArray[i].kajmakID == array[4]) {
				firstRequestSent = true;
			}
			if(requestedArray[i].sender == req.decoded.username && requestedArray[i].kajmakID == array[5]) {
				secondRequestSent = true;
			}

		}
		if(firstRequestSent == true && secondRequestSent == true) {
			return res.json({ message: "Request is already sent"});
		} else if(firstRequestSent == true && secondRequestSent == false) {
			requestedArray.push({sender: req.decoded.username, kajmakID: array[5]});
			var content2 = "User " + req.decoded.username + " wants to mix " + array[3] + " with ID " + array[5] + " ." + '\r\n';
			fs.appendFile(filename2, content2, function (err) {
				if (err) throw err;
				console.log("Saved!");
			});
			var filenameResponses2 = array[1] + "Responses.txt";
			fs.closeSync(fs.openSync(filenameResponses2, 'w'));
			return res.json({ message: "Request is already sent to the first owner; request is sent to the second owner"});
		} else if(firstRequestSent == false && secondRequestSent == true) {
			requestedArray.push({sender: req.decoded.username, kajmakID: array[4]});
			var content1 = "User " + req.decoded.username + " wants to mix " + array[2] + " with ID " + array[4] + " ." + '\r\n';
			fs.appendFile(filename1, content1, function (err) {
				if (err) throw err;
				console.log("Saved!");
			});
			var filenameResponses1 = array[0] + "Responses.txt";
			fs.closeSync(fs.openSync(filenameResponses1, 'w'));
			return res.json({ message: "Request is already sent to the second owner; request is sent to the first owner"});
		} else {
			requestedArray.push({sender: req.decoded.username, kajmakID: array[5]});
			requestedArray.push({sender: req.decoded.username, kajmakID: array[4]});

			var content1 = "User " + req.decoded.username + " wants to mix " + array[2] + " with ID " + array[4] + " ." + '\r\n';
			fs.appendFile(filename1, content1, function (err) {
				if (err) throw err;
				console.log("Saved!");
			});
			var filenameResponses1 = array[0] + "Responses.txt";
			fs.closeSync(fs.openSync(filenameResponses1, 'w'));

			var content2 = "User " + req.decoded.username + " wants to mix " + array[3] + " with ID " + array[5] + " ." + '\r\n';
			fs.appendFile(filename2, content2, function (err) {
				if (err) throw err;
				console.log("Saved!");
			});
			var filenameResponses2 = array[1] + "Responses.txt";
			fs.closeSync(fs.openSync(filenameResponses2, 'w'));
			return res.json({ message: "Requests sent" });
		}
	}
});

app.get('/get_all_notifications/', async function (req, res) {
	console.log("Primljen zahtjev za citanjem noticikacija");
	console.log(requestedArray);
	console.log(approvedArray);
	var allNotifications = {
		requests: null,
		responses: null
	};

	var filename = req.decoded.username + '.txt';
	var dataRequests = fs.readFileSync(filename, 'utf8');
	var lines = dataRequests.toString().split(/\r?\n/);
	allNotifications.requests = lines;
	
	var filenameResponses = req.decoded.username + "Responses.txt";
	var dataResponse = fs.readFileSync(filenameResponses, 'utf8');
	var linesResponses = dataResponse.toString().split(/\r?\n/);
	allNotifications.responses = linesResponses;

	return res.send(allNotifications);
});

app.get('/send_approve/:data', async function (req, res) {
	console.log("Primljen zahtjev za slanjem odgovora");
	var index = req.params.data;
	approvedArray.push(requestedArray[index]);
	requestedArray.splice(index,1);
	console.log(approvedArray);
	console.log(requestedArray);
	var filename = req.decoded.username + '.txt';
	fs.readFile(filename, function (err, data) {
		if (err) throw err;
		console.log(data.toString());
		var lines = data.toString().split(/\r?\n/);
		var myLine = lines[index];
		console.log(myLine);
		var nizMyLine = myLine.split(" ");
		console.log(nizMyLine);

		lines.splice(index,1);
 		console.log(lines);
 		for(var i = 0; i < lines.length; i++) {
 			/*
			if(lines[i] === ""){
				console.log("Preskoceno");
				continue;
			}
			*/
			let content = lines[i] + '\r\n';
			console.log(content);
			fs.writeFile(filename,content, function(err) {
				if(err) throw err;
				console.log("Saved!");
			});
		}

		var filenameToWrite = nizMyLine[1] + "Responses.txt";
		var content = "User " + req.decoded.username + " approved request to mix " + nizMyLine[5] + " with ID " + nizMyLine[8] + "." + '\r\n';
		fs.appendFile(filenameToWrite, content, function(err) {
			if(err) throw err;
			console.log("Response sent");
		});
		var imeFajla = nizMyLine[1] + ".txt";
		fs.closeSync(fs.openSync(imeFajla, 'w'));
	});
	return res.json({message: "Request approved" });
});

app.get('/send_reject/:data', async function (req, res) {
	var index = req.params.data;
	console.log("Primljen zahtjev za odbijanjem");
	requestedArray.splice(index,1);
	console.log(requestedArray);
	let filename = req.decoded.username + ".txt";
	fs.readFile(filename, function(err,data) {
		if(err) throw err;
		var lines = data.toString().split(/\r?\n/);
    	console.log(lines); //niz sa praznim prostorom na kraju
    	for(var i = 0; i < lines.length; i++) {
        	if(lines[i] === "") {
            	lines.splice(i,1);
        	}
    	}
    	console.log(lines); //niz bez praznih prostora na kraju
    	lines.splice(index,1);
    	if(lines.length === 0) {
    		fs.closeSync(fs.openSync(filename, 'w'));
    	} else {
    		for(var i = 0; i < lines.length; i++) {
	        	let content = lines[i] + '\r\n';
	        	console.log(content);
	        	fs.writeFile(filename,content, function(err) {
	            	if(err) throw err;
	            	console.log("Saved!");
	        	});
   			}
    	}
	});
	return res.json({message: "Request deleted" });
});


var server = http.createServer(app).listen(port, function () { });
logger.info('*********** SERVER STARTED ***********');
logger.info('*********** http://%s:%s ***********', host, port);
server.timeout = 240000;
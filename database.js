var mongoose = require('mongoose');
//replace the connection string with your own
mongoose.connect('mongodb://<dbuser>:<dbpassword>@ds155352.mlab.com:55352/cryptokajmakdb',{ useNewUrlParser: true });
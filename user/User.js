var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var schema = new Schema({
    email : {type:String, require:true},
    username: {type:String, require:true},
    password:{type:String, require:true},
    orgname:{type:String, require:true},
    role:{type:String, require:true},
    creation_dt:{type:Date, require:true}
});

module.exports = mongoose.model('User',schema);
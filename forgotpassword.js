var pg = require('pg');
var bodyParser = require('body-parser');
var fs = require("fs");
var renderElement = require('./script/renderElement.js');
var common = require('./script/common.js');

var urlencodedParser = bodyParser.urlencoded({ extended: false });

var pool = new pg.Pool(common.postgresConfig());

var updateProfilePage = fs.readFileSync(__dirname + "/webpage/forgotpassword.html", "utf8");

module.exports = function(app){
	app.get('/forgotpassword', urlencodedParser, function(req, res) {
		var emailaddress = req.query.email;

		var formatted = updateProfilePage;
		formatted = formatted.replace('!%EMAILADDRESS%!', emailaddress);
		
		res.send(formatted);
	});	
}




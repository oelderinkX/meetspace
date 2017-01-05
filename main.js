var pg = require('pg');
var bodyParser = require('body-parser');
var fs = require("fs");
const util = require('util');
var common = require('./script/common.js');

var pool = new pg.Pool(common.postgresConfig());

var mainPage = fs.readFileSync(__dirname + "/webpage/main.html", "utf8");

module.exports = function(app){
	
	app.get('/', function(req, res) {
		var webpage = mainPage;
		
		res.send(webpage);
	});	
}
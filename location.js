var pg = require('pg');
var bodyParser = require('body-parser');
var fs = require("fs");

var urlencodedParser = bodyParser.urlencoded({ extended: false });

var pool = new pg.Pool(common.postgresConfig());

module.exports = function(app){
	app.get('/getcountries', function(req, res) {
		res.send('New Zealand');
	});	
}
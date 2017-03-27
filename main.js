var pg = require('pg');
var bodyParser = require('body-parser');
var fs = require("fs");
const util = require('util');
var common = require('./script/common.js');
var renderElement = require('./script/renderElement.js');

var urlencodedParser = bodyParser.urlencoded({ extended: false });

var pool = new pg.Pool(common.postgresConfig());

var mainPage = fs.readFileSync(__dirname + "/webpage/main.html", "utf8");

module.exports = function(app){
	
	app.get('/', urlencodedParser, function(req, res) {
		var showjoin = 'inline';
		var username = req.cookies['username'];
		var sessionId = req.cookies['sessionId'];
		var webpage = mainPage;

		if (username && sessionId) {
			webpage = renderElement.mainheading(webpage, true, username);
		} else {
			webpage = renderElement.mainheading(webpage, false, username);
		}
	
		res.send(webpage);
	});	
}
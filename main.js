const pg = require('pg');
const bodyParser = require('body-parser');
const fs = require("fs");
const common = require('./script/common.js');

const urlencodedParser = bodyParser.urlencoded({ extended: false });

const pool = new pg.Pool(common.postgresConfig());

const mainPage = fs.readFileSync(__dirname + "/webpage/main.html", "utf8");

module.exports = function(app){
	app.get('/', urlencodedParser, function(req, res) {
		const username = req.cookies['username'];
		const sessionId = req.cookies['sessionId'];
		let webpage = mainPage;

		let heading = '';

		if(username && sessionId) {
			heading = '<form action="/login">\n';
			heading += '\t<div class="btn-group">\n';
			heading += '\t\t<input type="submit" value="Login" class="btn btn-default btn-primary"/>\n';
			heading += '\t</div>\n';
			heading += '</form>\n';
		} else {
			heading = 'Welcome ' + username;
		}
	
		webpage = webpage.replace('!%MAINHEADING%!', heading);
	
		res.send(webpage);
	});	
}
var pg = require('pg');
var bodyParser = require('body-parser');
var fs = require("fs");
var renderElement = require('./script/renderElement.js');
var common = require('./script/common.js');

var urlencodedParser = bodyParser.urlencoded({ extended: false });

var pool = new pg.Pool(common.postgresConfig());

var updateProfilePage = fs.readFileSync(__dirname + "/webpage/updateprofile.html", "utf8");

module.exports = function(app){
	app.get('/updateprofile', urlencodedParser, function(req, res) {
		var username = req.cookies['username'];
		
		if(!username) {
			username = '';
		}
		
		var formatted = updateProfilePage;
		formatted = formatted.replace('!%USERNAME%!', username);
		formatted = formatted.replace('!%STATUS USERNAME%!', '');
		formatted = formatted.replace('!%STATUS PASSWORD%!', '');
		
		res.send(formatted);
	});	
	
	app.post('/updateprofile', urlencodedParser, function(req, res) {
		var formatted = updateProfilePage;

		var email = req.cookies['email'];
		var sessionId = req.cookies['sessionId'];
		
		var action = req.body.action;
		var newusername = req.body.username;
		var oldpassword = req.body.oldpassword;
		var newpassword = req.body.newpassword;
		
		var registrationStatus = 'OK';
		
		registrationStatus = action + ', ';
		registrationStatus += newusername + ', ';
		registrationStatus += oldpassword + ', ';
		registrationStatus += newpassword;
		
		formatted = formatted.replace('!%USERNAME%!', newusername);
		formatted = formatted.replace('!%STATUS USERNAME%!', registrationStatus);
		formatted = formatted.replace('!%STATUS PASSWORD%!', '');
		
		if (action = 'updateusername' && newusername) {
			updateUsernameSql = 'SELECT meetspace.update_username($1, $2, $3);';
			pool.connect(function(err, connection, done) {
				connection.query(updateUsernameSql, [newusername, email, sessionId], function(err) {
					connection.release();

					res.send(formatted);
				});
			});
		} else {
			res.send(formatted);
		}
	});
}




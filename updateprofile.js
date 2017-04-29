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
		var username = req.cookies['username'];
		
		var action = req.body.action;
		var newusername = req.body.username;
		var oldpassword = req.body.oldpassword;
		var newpassword = req.body.newpassword;
		
		console.log('action:' + action);
		console.log('newusername:' + newusername);
		console.log('oldpassword:' + oldpassword);
		console.log('newpassword:' + newpassword);
		
		if (action = 'updateusername' && newusername) {
			updateUsernameSql = 'SELECT meetspace.update_username($1, $2, $3);';
			pool.connect(function(err, connection, done) {
				connection.query(updateUsernameSql, [newusername, email, sessionId], function(err) {
					connection.release();

					if (err) {
						formatted = formatted.replace('!%STATUS USERNAME%!', 'Username Failure!');
					} else {
						res.cookie('username' , newusername);
						formatted = formatted.replace('!%STATUS USERNAME%!', 'Username Updated!');
					}
					
					formatted = formatted.replace('!%USERNAME%!', newusername);
					formatted = formatted.replace('!%STATUS PASSWORD%!', '');
					
					res.send(formatted);
				});
			});
		} else if (action = 'updatepassword' && newpassword && oldpassword) {
			updatePasswordSql = 'SELECT meetspace.update_password($1, $2, $3, $4);';
			pool.connect(function(err, connection, done) {
				connection.query(updatePasswordSql, [oldpassword, newpassword, email, sessionId], function(err) {
					connection.release();
					
					if (err) {
						console.log(err);
						formatted = formatted.replace('!%STATUS PASSWORD%!', 'Password Failure!');
					} else {
						formatted = formatted.replace('!%STATUS PASSWORD%!', 'Password Updated!');
					}						
		
					formatted = formatted.replace('!%USERNAME%!', username);
					formatted = formatted.replace('!%STATUS USERNAME%!', '');
					res.send(formatted);
				});
			});
		} else {
			formatted = formatted.replace('!%USERNAME%!', username);
			formatted = formatted.replace('!%STATUS USERNAME%!', 'Failure');
			formatted = formatted.replace('!%STATUS PASSWORD%!', 'Failure');			
			res.send(formatted);
		}
	});
}




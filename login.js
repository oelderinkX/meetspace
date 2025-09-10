var pg = require('pg');
var bodyParser = require('body-parser');
var fs = require("fs");
const util = require('util');
var renderElement = require('./script/renderElement.js');
var common = require('./script/common.js');

var urlencodedParser = bodyParser.urlencoded({ extended: false });

var pool = new pg.Pool(common.postgresConfig());

var loginPage = fs.readFileSync(__dirname + "/webpage/login.html", "utf8");

function guid() {
  return s4() + s4() + '-' + s4() + '-' + s4() + '-' +
    s4() + '-' + s4() + s4() + s4();
}

function s4() {
  return Math.floor((1 + Math.random()) * 0x10000)
    .toString(16)
    .substring(1);
}

module.exports = function(app){
	app.get('/login', function(req, res) {
		var formatted = loginPage;
		
		formatted = formatted.replace('!%PASSWORD%!', '');
		formatted = formatted.replace('!%EMAIL%!', '');
		
		formatted = formatted.replace('!%ERROR STATUS%!', '');
		
		res.send(formatted);
	});	
	
	app.post('/login', urlencodedParser, function(req, res) {
		var password = req.body.password;
		var email = req.body.email;
		var sessionId = guid();
		
		var sql = "SELECT ret_username from meetspace.login($1, $2, $3);"
	
		pool.connect(function(err, connection, done) {
			connection.query(sql, [email, password, sessionId], function(err, result) {
				done();

				if (err) {
					console.error(err);
					var errAsString = err.toString();
					var errorMessage = 'Unknown error occured when created user.  Please try again.  Error "' + errAsString + '"';
					
					var formatted = loginPage;
					formatted = formatted.replace('!%PASSWORD%!', password);
					formatted = formatted.replace('!%EMAIL%!', email);
					
					formatted = renderElement.error(formatted, errorMessage);
				
					res.send(formatted);
				} else {
					if (result && result.rowCount > 0) {
						res.cookie('username', result.rows[0].ret_username);
						res.cookie('email' , email);
						res.cookie('sessionId' , sessionId);
						
						var backUrl = req.cookies['activity'] || '/';
						res.redirect(backUrl);
					} else {
						var formatted = loginPage;
						formatted = formatted.replace('!%PASSWORD%!', password);
						formatted = formatted.replace('!%EMAIL%!', email);
						
						formatted = renderElement.error(formatted, 'Unknown user or password');
						
						res.send(formatted);
					}
				}
			});
		});
	});
}
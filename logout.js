var pg = require('pg');
var bodyParser = require('body-parser');
var fs = require("fs");
var common = require('./script/common.js');

var urlencodedParser = bodyParser.urlencoded({ extended: false });

var pool = new pg.Pool(common.postgresConfig());

var registrationPage = fs.readFileSync(__dirname + "/webpage/registration.html", "utf8");

module.exports = function(app){
	app.all('/logout', urlencodedParser, function(req, res) {
		var sql = 'DELETE FROM meetspace.session WHERE email = $1 AND sessionId = $2;';
		
		var email = req.cookies['email'];
		var sessionId = req.cookies['sessionId'];
		
		pool.connect(function(err, connection, done) {
			var q = connection.query(sql, [ email, sessionId], function(err, result) {
				done()
				
				if (err) {
					console.error(err);
					console.error(q.text);
				}
				
				console.log(result);
				console.error(q);
				
				res.clearCookie('username');
				res.clearCookie('email');
				res.clearCookie('sessionId');
				
				res.redirect('/');
			});
		});
	});
}




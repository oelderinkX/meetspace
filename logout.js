var pg = require('pg');
var bodyParser = require('body-parser');
var fs = require("fs");

var urlencodedParser = bodyParser.urlencoded({ extended: false });

const connectionString = process.env.DATABASE_URL;

var pool = new pg.Pool(connectionString);

var registrationPage = fs.readFileSync(__dirname + "/webpage/registration.html", "utf8");

module.exports = function(app){
	
	app.all('/logout', urlencodedParser, function(req, res) {
		
		var registrationStatus = 'OK';
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
				
				res.clearCookie('email');
				res.clearCookie('sessionId');
				
				res.redirect('/');
			});
		});
	});
}




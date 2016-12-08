var pg = require('pg');
var bodyParser = require('body-parser');
var fs = require("fs");

var urlencodedParser = bodyParser.urlencoded({ extended: false });

var config = {
  host: 'ec2-54-235-111-59.compute-1.amazonaws.com',
  user: 'qpidruggfishtd',
  database: 'df8uavpng011op',
  password: '2RgFbHtlj9eQO8MRwP48Vi_NFV',
  port: 5432,
  max: 10,
  idleTimeoutMillis: 30000
};

var pool = new pg.Pool(config);

var registrationPage = fs.readFileSync(__dirname + "/webpage/registration.html", "utf8");

module.exports = function(app){
	
	app.all('/logout', urlencodedParser, function(req, res) {
		
		var registrationStatus = 'OK';
		var sql = 'DELETE FROM meetspace.session WHERE email = ? AND sessionId = ?;';
		
		var email = req.cookies['email'];
		var sessionId = req.cookies['sessionId'];
		
		pool.connect(function(err, connection, done) {
			connection.query(sql, [ email, sessionId], function(err, result) {
				done()
				
				if (err) {
					console.error(err);
				}
				
				console.log(result);
				
				res.clearCookie('email');
				res.clearCookie('sessionId');
				
				res.redirect('/');
			});
		});
	});
}




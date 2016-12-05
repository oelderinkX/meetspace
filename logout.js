var mysql = require('mysql');
var bodyParser = require('body-parser');
var fs = require("fs");

var urlencodedParser = bodyParser.urlencoded({ extended: false });

var pool = mysql.createPool({
  connectionLimit : 10,
  host     : 'localhost',
  user     : 'root',
  password : 'oelderink',
  database : 'meetspace'
});

var registrationPage = fs.readFileSync(__dirname + "/webpage/registration.html", "utf8");

module.exports = function(app){
	
	app.all('/logout', urlencodedParser, function(req, res) {
		
		var registrationStatus = 'OK';
		var sql = 'DELETE FROM session WHERE email = ? AND sessionId = ?;';
		
		var email = req.cookies['email'];
		var sessionId = req.cookies['sessionId'];
		
		pool.getConnection(function(err, connection) {
			connection.query(sql, [ email, sessionId], function(err, row) {
				connection.release();
				
				if (err) {
					console.error(err);
				}
				
				res.clearCookie('email');
				res.clearCookie('sessionId');
				
				res.redirect('/');
			});
		});
	});
}




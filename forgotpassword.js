var pg = require('pg');
var bodyParser = require('body-parser');
var fs = require("fs");
var common = require('./script/common.js');
var notifications = require('./notifications.js');

var urlencodedParser = bodyParser.urlencoded({ extended: false });

var pool = new pg.Pool(common.postgresConfig());

var updateProfilePage = fs.readFileSync(__dirname + "/webpage/forgotpassword.html", "utf8");

module.exports = function(app){
	app.get('/forgotpassword', urlencodedParser, function(req, res) {
		var emailaddress = req.query.email;

		emailaddress = 'jared.oelderinkwale@telogis.com'  //delete me!

		var formatted = updateProfilePage;
		formatted = formatted.replace('!%EMAILADDRESS%!', emailaddress);
		
		sql = "SELECT username, password, email from meetspace.user where email='" + emailaddress + "' limit 1";

		pool.connect(function(err, client, done) {
			client.query(sql, function(err, result) {
				done();

				if (result.rows.length == 1)
				{
					var username = result.rows[0].username;
					var password = result.rows[0].password;

					emailaddress = 'joelderink.wale@gmail.com'  //delete me!
					notifications.forgotEmail(emailaddress, username, password);
				}

				res.send(formatted);
			});
		});
	});	
}




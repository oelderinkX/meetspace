var pg = require('pg');
var bodyParser = require('body-parser');
var fs = require("fs");
var common = require('./script/common.js');

var urlencodedParser = bodyParser.urlencoded({ extended: false });

var pool = new pg.Pool(common.postgresConfig());

var countries = [];

module.exports = function(app){
	app.get('/getcountries', function(req, res) {

		if (countries) {
			res.send(countries);
		} else {
			var postsql = "select id, name, code from meetspace.countries;";
			pool.connect(function(err, client, done) {
				client.query(postsql, function(err, result) {
					done();

					if (result) {
						for (var i = 0; i < result.rows.length; i++) {
							countries.push({
							  id: result.rows[i].id,
							  name: result.rows[i].name,
							  code: result.rows[i].code,
							});
						}
					}

					res.send(countries);
				});
			});
		});	
	}
}
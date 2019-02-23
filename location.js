var pg = require('pg');
var bodyParser = require('body-parser');
var fs = require("fs");
var common = require('./script/common.js');

var urlencodedParser = bodyParser.urlencoded({ extended: false });

var pool = new pg.Pool(common.postgresConfig());

var countries = [];
var regions = [];
var cities = [];

module.exports = function(app) {
	app.get('/getcountries', function(req, res) {

		if (countries.length > 0) {
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
		}
	});	
}

module.exports = function(app) {
	app.get('/regionsByCountryId', function(req, res) {
		var country_id = req.query.id;
		var regionByCountry = [];
		
		if (regions.length > 0) {
			for (var i = 0; i < regions.length ; i++) {
				if (regions[i].country_id == country_id) {
					regionByCountry.push({
						id: regions[i].id,
						name: regions[i].name,
						code: regions[i].code,
						country_id: regions[i].country_id
					});
				}
			}			
			res.send(regionByCountry);
		} else {
			var postsql = "select id, name, code, country_id from meetspace.regions;";
			pool.connect(function(err, client, done) {
				client.query(postsql, function(err, result) {
					done();

					if (result) {
						for (var i = 0; i < result.rows.length; i++) {
							regions.push({
							  id: result.rows[i].id,
							  name: result.rows[i].name,
							  code: result.rows[i].code,
							  code: result.rows[i].country_id
							});
						}
					}

					for (var i = 0; i < regions.length ; i++) {
						if (regions[i].country_id == country_id) {
							regionByCountry.push({
								id: regions[i].id,
								name: regions[i].name,
								code: regions[i].code,
								country_id: regions[i].country_id
							});
						}
					}
					
					res.send(countries);
				});
			});
		}
	});	
}
const pg = require('pg');
const bodyParser = require('body-parser');
const common = require('./script/common.js');
const logging = require('./logging.js');

const pool = new pg.Pool(common.postgresConfig());

let countries = [];
exports.Countries = countries;
let regions = [];
let cities = [];

async function retrieveCountries(callback) {
	if (countries.length > 0) {
		return countries;
	} else {
		const postsql = "select id, name, code from meetspace.countries order by name;";
		
		logging.logDbStats('retrieveCountries start', pool);
		let client = await pool.connect();
		let result = await client.query(postsql);

		if (result) {
			for (let i = 0; i < result.rows.length; i++) {
				countries.push({
					id: result.rows[i].id,
					name: result.rows[i].name,
					code: result.rows[i].code,
				});
			}
		}

		client.release();
		logging.logDbStats('retrieveCountries finish', pool);
		return countries;
	}
}
module.exports.RetrieveCountries = retrieveCountries;


async function retrieveActiveCountries() {
	if (countries.length > 0) {
		return countries;
	} else {
		const postsql = "select id, name, code from meetspace.countries where code in (select distinct(country) from meetspace.activity) order by name;";

		logging.logDbStats('retrieveActiveCountries start', pool);
		const client = await pool.connect();
		const result = await client.query(postsql);

		if (result) {
			for (let i = 0; i < result.rows.length; i++) {
				console.log('loading country ' + result.rows[i].name);
				countries.push({
					id: result.rows[i].id,
					name: result.rows[i].name,
					code: result.rows[i].code,
				});
			}
		}

		client.release();
		logging.logDbStats('retrieveActiveCountries finish', pool);
		return countries;
	}
}
module.exports.RetrieveActiveCountries = retrieveActiveCountries;

async function getActiveCountries(res) {
	retrieveActiveCountries().then(function(countries) {
		res.send(countries);
	});
}

async function getCountries(res) {
	retrieveCountries().then(function(countries) {
		res.send(countries);
	});
}

async function getRegionByCountry(res, id) {
	const regionByCountry = [];
	
	if (regions.length > 0) {
		for (let i = 0; i < regions.length ; i++) {
			if (regions[i].country_id == id) {
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
		const postsql = "select id, name, code, country_id from meetspace.regions order by name;";

		logging.logDbStats('getRegionByCountry start', pool);
		let client = await pool.connect();
		let result = await client.query(postsql);	

		if (result) {
			for (let i = 0; i < result.rows.length; i++) {
				regions.push({
					id: result.rows[i].id,
					name: result.rows[i].name,
					code: result.rows[i].code,
					country_id: result.rows[i].country_id
				});
			}
		}

		for (let i = 0; i < regions.length ; i++) {
			if (regions[i].country_id == id) {
				regionByCountry.push({
					id: regions[i].id,
					name: regions[i].name,
					code: regions[i].code,
					country_id: regions[i].country_id
				});
			}
		}
		
		client.release();
		logging.logDbStats('getRegionByCountry finish', pool);
		res.send(regionByCountry);
	}
}

async function getCitiesByRegion(res, id) {
	const citiesByRegion = [];
	
	const postsql = "select id, region_id, country_id, latitude, longitude, name from meetspace.cities where region_id = " + id + " order by name;";

	logging.logDbStats('getCitiesByRegion start', pool);
	let client = await pool.connect();
	let result = await client.query(postsql);	

	if (result) {
		for (let i = 0; i < result.rows.length; i++) {
			cities.push({
				id: result.rows[i].id,
				region_id: result.rows[i].region_id,
				country_id: result.rows[i].country_id,
				latitude: result.rows[i].latitude,
				longitude: result.rows[i].longitude,
				name: result.rows[i].name
			});
		}
	}

	for (let i = 0; i < cities.length ; i++) {
		if (cities[i].region_id == id) {
			citiesByRegion.push({
				id: cities[i].id,
				region_id: cities[i].region_id,
				country_id: cities[i].country_id,
				latitude: cities[i].latitude,
				longitude: cities[i].longitude,
				name: cities[i].name
			});
		}
	}
	
	client.release();
	logging.logDbStats('getCitiesByRegion finish', pool);
	res.send(citiesByRegion);
}

module.exports = function(app) {
	app.get('/location', async function(req, res) {
		var get = req.query.get;
		var id = req.query.id;
		var empty = [];
		
		if (get == "countries") {
			await getCountries(res);
		} else if (get == "activeCountries") {
			await getActiveCountries(res);
		} else if (get == "regions" && id) {
			await getRegionByCountry(res, id);
		} else if (get == "cities" && id) {
			await getCitiesByRegion(res, id);
		} else {
			res.send(empty);
		}
	});	
}
const pg = require('pg');
const bodyParser = require('body-parser');
const fs = require("fs");
const common = require('./script/common.js');
const renderElement = require('./script/renderElement.js');
const notifications = require('./notifications.js');
const logging = require('./logging.js');
const sqlCache = require('./sqlCache.js');

const urlencodedParser = bodyParser.urlencoded({ extended: false });
const jsonParser = bodyParser.json();

const pool = new pg.Pool(common.postgresConfig());

const style1Page = fs.readFileSync(__dirname + "/webpage/activity_style1.html", "utf8");
const listPage = fs.readFileSync(__dirname + "/webpage/activity_list.html", "utf8");
const infoPage = fs.readFileSync(__dirname + "/webpage/infopage.html", "utf8");

function getUrl(country, region, city, game) {
	let url = common.webpage_url;

	url += country + '/' + region + '/' + city + '/' + game;

	return url;
}

function renderPage(country, region, city, game, req, res) {
	const email = req.cookies['email'];

	let webpage = style1Page;

	const username = req.cookies['username'];
	const sessionId = req.cookies['sessionId'];
	
	const action = req.body.action;

	getUrl(country, region, city, game);

	webpage = renderElement.login(webpage, username, common.webpage_url);

	webpage = renderElement.breadcrumb(webpage, country, region, city, game);

	let sql = "SELECT * FROM meetspace.find_activity($1, $2, $3, $4);"

	pool.connect(function(err, client, done) {
		if(err) {
			console.log("ERROR! " + err);
		}

		client.query(sql, [country, region, city, game], function(err, result) {
			if (err) {
				console.log("errors!");
			} else {
				if (result.rows.length == 1) {
					var showjoin = 'none';
					var showunjoin = 'none';
					var showattend = 'none';
					var showunattend = 'none';
					var showchannel = 'none';
					var showpost = 'none';
					var showinvite = 'none';
					var showedit = 'none';
					var showmessaging = 'none';
					var actionlink = '/' + country;
					if (region) {
						actionlink += '/' + region;
					}
					actionlink += '/' + city;
					actionlink += '/' + game;

					var activityId = result.rows[0].ret_activityid;
					var title = result.rows[0].ret_title;
					var time = result.rows[0].ret_time;
					var day = result.rows[0].ret_day;
					game = result.rows[0].ret_game;
					description = result.rows[0].ret_description;

					sql = "SELECT * FROM meetspace.get_activity_details($1, $2, $3);"

					client.query(sql, [email, sessionId, activityId], function(err, result) {
						if (err) {
							console.log("error fail");
						} else {
							var isJoined = result.rows[0].ret_joined;
							var isAttending = result.rows[0].ret_attended;
							var isAdmin = result.rows[0].ret_admin;
						
							if (isJoined) {
								showunjoin = '';
								showpost = 'inline';
								showinvite = 'inline';
								showchannel = 'inline';
								showmessaging = 'inline';

								if (isAttending) {
									showunattend = 'inline';
								} else {
									showattend = 'inline';
								}
								
								if (isAdmin) {
									showreset = 'inline';
									showedit = 'inline';
									showreset = 'inline';
								}
							} else {
								if (username && sessionId) {
									showjoin = '';
									showchannel = 'inline';
								}
							}

							webpage = common.replaceAll(webpage, '!%TITLE%!', title);
							webpage = webpage.replace('!%TIME%!', common.getDay(day) + ' ' + common.getTime(time));

							webpage = webpage.replace('!%DESCRIPTION%!', description);
							webpage = common.replaceAll(webpage, '!%ACTION%!', actionlink);
							webpage = common.replaceAll(webpage, '!%ACTIVITYID%!', activityId);

							webpage = common.replaceAll(webpage, '!%SHOWJOIN%!', showjoin);
							webpage = common.replaceAll(webpage, '!%SHOWUNJOIN%!', showunjoin);
							webpage = common.replaceAll(webpage, '!%SHOWATTEND%!', showattend);
							webpage = common.replaceAll(webpage, '!%SHOWUNATTEND%!', showunattend);
							webpage = common.replaceAll(webpage, '!%SHOWMESSAGING%!', showmessaging);
							webpage = common.replaceAll(webpage, '!%SHOWEDIT%!', showedit);
							webpage = common.replaceAll(webpage, '!%SHOWCHANNEL%!', showchannel);

							webpage = webpage.replace('!%SHOWPOST%!', showpost);
							webpage = webpage.replace('!%SHOWINVITE%!', showinvite);

							webpage = webpage.replace('!%COUNTRY%!',country);
							webpage = webpage.replace('!%REGION%!',region);
							webpage = webpage.replace('!%CITY%!',city);
							webpage = webpage.replace('!%GAME%!',game);

							res.cookie('activity' , actionlink);

							done();
							res.send(webpage);
						}
					});
			} else if (result.rows.length == 0) {
				var noactivityPage = infoPage;

				if (game) {
					var message = 'No activty for ' + game + '.  Would you like to create it? <a href="/newactivity" class="btn btn-primary" role="button">Create</a>';
					noactivityPage = noactivityPage.replace('!%MESSAGE%!', message);
				} else {
					var message = 'No activties in your area.  Would you like to create one? <a href="/newactivity" class="btn btn-primary" role="button">Create</a>';
					noactivityPage = noactivityPage.replace('!%MESSAGE%!', message);
				}

				done();
				res.send(noactivityPage);
			} else if (result.rows.length > 1) {
				webpage = listPage;

				webpage = renderElement.breadcrumb(webpage, country, region, city, game);

				var titlelist = [];
				var gamelist = [];
				var citylist = [];
				var regionlist = [];
				var countrylist = [];
				var descriptionlist = [];
				var linklist = [];
				var numberofplayerslist = [];

				for (var i = 0; i < result.rows.length; i++) {
					var title = result.rows[i].ret_title;
					game = result.rows[i].ret_game;
					city = result.rows[i].ret_city;
					region = result.rows[i].ret_region;
					country = result.rows[i].ret_country;
					description = result.rows[i].ret_description;
					var numberofplayers = result.rows[i].ret_number_of_players;

					var link = getUrl(country, region, city, game);

					titlelist.push(title);
					gamelist.push(game);
					citylist.push(city);
					regionlist.push(region);
					countrylist.push(country);
					descriptionlist.push(description);
					linklist.push(link);
					numberofplayerslist.push(numberofplayers);
				}

				webpage = renderElement.activities(webpage, titlelist, gamelist, citylist, regionlist, countrylist, descriptionlist, linklist, numberofplayerslist);

				done();
				res.send(webpage);
			}
		}
	}); });
}

module.exports = function(app) {
	app.get('/{*activity}', urlencodedParser, function(req, res) {
		var url = req.url;
		var params = url.split("/");

		var country = undefined;
		var city = undefined;
		var region = undefined;
		var game = undefined;

		if (params.length > 1) {
			if (params[1] !== null && params[1] !== '') {
				country = params[1];
			}
		}

		if (params[2] !== null && params[2] !== '') {
			region = params[2];
		}

		if (params[3] !== null && params[3] !== '') {
			city = params[3];
		}
		
		if (params[4] !== null && params[4] !== '') {
			game = params[4];
		}
		
		renderPage(country, region, city, game, req, res);
	});

	app.post('/getposts', jsonParser, async function(req, res) {
		const activityId = req.body.activityId;

		const postsql = "SELECT username, message, postdate, title FROM meetspace.post INNER JOIN meetspace.user ON meetspace.post.userid = meetspace.user.id WHERE activityid = $1 ORDER BY postdate DESC LIMIT 10;";

		logging.logDbStats('/getposts start', pool);
		let client = await pool.connect();
		let result = await client.query(postsql, [activityId]);

		const posts = [];

		if (result) {
			for (let i = 0; i < result.rows.length; i++) {
				posts.push({
					username: result.rows[i].username,
					message: result.rows[i].message,
					title: result.rows[i].title,
					submissionDate: result.rows[i].postdate
				});
			}
		}

		client.release();
		logging.logDbStats('/getposts finish', pool);
		res.send(posts);
	});

	function getWhosGoingSql(activityId) {
		return `SELECT meetspace.user.email, meetspace.user.username, meetspace.whosgoing.status
			FROM meetspace.whosgoing JOIN meetspace.user ON meetspace.whosgoing.userId = meetspace.user.id
			WHERE meetspace.whosgoing.activityId = ${activityId}`;
	}

	app.post('/whosgoing', jsonParser, async function(req, res) {
		const activityId = req.body.activityId;

		let whosgoingsql = getWhosGoingSql(activityId);

		logging.logDbStats('/whosgoing start', pool);
		// const client = await pool.connect();
		// const result = await client.query(whosgoingsql);

		const result = await sqlCache.query(pool, whosgoingsql, [], 60);

		const whosgoing = [];

		for (let i = 0; i < result.rows.length; i++) {
			const username = result.rows[i].username;
			const status = result.rows[i].status;

			let email = '';
			if (status == 0) {
				email = common.xor(result.rows[i].email, activityId);
			} else {
				email = '';
			}

			whosgoing.push({ username: username, status: status, e: email });
		}

		//client.release();
		logging.logDbStats('/whosgoing finish', pool);
		res.send(whosgoing);
	});

	app.post('/postmessage', jsonParser, async function(req, res) {
		const activityId = req.body.activityId;
		const message = req.body.message;
		const email = req.cookies['email'];
		const sessionId = req.cookies['sessionId'];

		const sql = "SELECT meetspace.post_message($1, $2, $3, $4);";

		logging.logDbStats('/postmessage start', pool);
		const client = await pool.connect();
		const result = await client.query(sql, [ email, sessionId, activityId, message]);

		client.release();
		logging.logDbStats('/postmessage finish', pool);
		res.send({ success: true});
	});

	app.post('/announcemessage', jsonParser, async function(req, res) {
		const activityId = req.body.activityId;
		const message = req.body.message;

		const country = req.body.country;
		const region = req.body.region;
		const city = req.body.city;
		const game = req.body.game;

		const email = req.cookies['email'];
		const sessionId = req.cookies['sessionId'];
		const username = req.cookies['username'];

		let sql = "select * FROM meetspace.get_emails_for_activity('" + email + "', '" + sessionId + "', " + activityId + ");";

		logging.logDbStats('/announcemessage start', pool);
		let client = await pool.connect();
		let result = await client.query(sql);

		for (let i = 0; i < result.rows.length; i++) {
			const toEmail = result.rows[i].ret_email;
			const activityTitle = result.rows[i].ret_activitytitle;

			console.log('sending email');
			notifications.sendPostEmail(toEmail, username, activityTitle, getUrl(country, region, city, game), '', message);
		}

		sql = "SELECT meetspace.post_message($1, $2, $3, $4);";
		result = await client.query(sql, [email, sessionId, activityId, message]);

		client.release();
		logging.logDbStats('/announcemessage finish', pool);
		res.send({ success: true});
	});

	app.post('/attend', jsonParser, async function(req, res) {
		const activityId = req.body.activityId;
		const email = req.cookies['email'];
		const sessionId = req.cookies['sessionId'];

		let whosgoingsql = getWhosGoingSql(activityId);
		sqlCache.clearSql(whosgoingsql, []);

		const sql = "SELECT meetspace.attend_activity('" + email + "', '" + sessionId + "', " + activityId + ");";

		logging.logDbStats('/attend start', pool);
		const client = await pool.connect();
		const result = await client.query(sql);

		client.release();
		logging.logDbStats('/attend finish', pool);
		res.send({ success: true});
	});

	app.post('/unattend', jsonParser, async function(req, res) {
		const activityId = req.body.activityId;
		const email = req.cookies['email'];
		const sessionId = req.cookies['sessionId'];

		let whosgoingsql = getWhosGoingSql(activityId);
		sqlCache.clearSql(whosgoingsql, []);

		const sql = "SELECT meetspace.unattend_activity('" + email + "', '" + sessionId + "', " + activityId + ");";

		logging.logDbStats('/unattend start', pool);
		const client = await pool.connect();
		const result = await client.query(sql);

		client.release();
		logging.logDbStats('/unattend finish', pool);
		res.send({ success: true});
	});

	app.post('/invite', jsonParser, async function(req, res) {
		const activityId = req.body.activityId;
		const email = req.cookies['email'];
		const toEmail = req.body.toEmail;
		const username = req.cookies['username'];
		const sessionId = req.cookies['sessionId'];
		const country = req.body.country;
		const region = req.body.region;
		const city = req.body.city;
		const game = req.body.game;

		const sql = "select * FROM meetspace.check_credentials('" + email + "', '" + sessionId + "', " + activityId + ");";

		logging.logDbStats('/invite start', pool);
		let client = await pool.connect();
		let result = await client.query(sql);

		if (result && result.rows && result.rows.length == 1) {
			const isValid = result.rows[0].ret_valid;
			const activityTitle = result.rows[0].ret_title;

			if (isValid) {
				notifications.sendInviteEmail(toEmail, username, getUrl(country, region, city, game), activityTitle);
			}
		}

		client.release();
		logging.logDbStats('/invite finish', pool);
		res.send({ success: true});
	});

	app.post('/join', jsonParser, async function(req, res) {
		const activityId = req.body.activityId;
		const email = req.cookies['email'];
		const sessionId = req.cookies['sessionId'];

		const sql = "SELECT meetspace.join_activity('" + email + "', '" + sessionId + "', " + activityId + ");";

		logging.logDbStats('/join start', pool);
		const client = await pool.connect();
		const result = await client.query(sql);

		client.release();
		logging.logDbStats('/join finish', pool);
		res.send({ success: true});
	});

	app.post('/leave', jsonParser, async function(req, res) {
		const activityId = req.body.activityId;
		const email = req.cookies['email'];
		const sessionId = req.cookies['sessionId'];

		const sql = "SELECT meetspace.unjoin_activity('" + email + "', '" + sessionId + "', " + activityId + ");";

		logging.logDbStats('/leave start', pool);
		const client = await pool.connect();
		const result = await client.query(sql);

		client.release();
		logging.logDbStats('/leave finish', pool);
		res.send({ success: true});
	});

	app.post('/removefromactivity', jsonParser, async function(req, res) {
		const activityId = req.body.activityId;
		const remove_email = common.xor(req.body.e, activityId);
		const sessionId = req.cookies['sessionId'];
		
		const sql = "select * FROM meetspace.remove_from_activity('" + remove_email + "', '" + sessionId + "', " + activityId + ");";

		logging.logDbStats('/removefromactivity start', pool);
		const client = await pool.connect();
		const result = await client.query(sql);

		client.release();
		logging.logDbStats('/removefromactivity finish', pool);
		res.send({ success: true});
	});

	app.post('/postimage', jsonParser, async function(req, res) {
		const activityId = req.body.activityId;
		let image = req.body.image;
		const filename = req.body.filename;

		image = image.substr(image.indexOf(',')); 
		const bin = new Buffer(image, 'base64');

		fs.writeFile(__dirname + '/postimages/' + filename, bin);

		res.send({ success: true, filename: '/postimages/' + filename });
	});
}

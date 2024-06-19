var dateFormat = require('dateformat');
const { connectionString } = require('pg/lib/defaults');
const url = require('url')
const params = url.parse(process.env.DATABASE_URL);
const auth = params.auth.split(':');

const webpage_url = '/';
module.exports.webpage_url = webpage_url;

function fakeMethod() {
	// this is just a fake commit you can delete this methods
}

function guid() {
  return s4() + s4() + '-' + s4() + '-' + s4() + '-' +
    s4() + '-' + s4() + s4() + s4();
}

function s4() {
  return Math.floor((1 + Math.random()) * 0x10000)
    .toString(16)
    .substring(1);
}

function postgresConfig() {
	var config = {
		connectionString: process.env.DATABASE_URL,
		sslmode: prefer
	};

	return config;
}
module.exports.postgresConfig = postgresConfig;

function postgresConfig2() {
  var config = {
    user: auth[0],
    password: auth[1],
    host: params.hostname,
    port: params.port,
    database: params.pathname.split('/')[1],
    ssl: true	  
  };
  
  return config;
}
module.exports.postgresConfig2 = postgresConfig2;

function replaceAll(str, searchValue, replaceWith) {
	if (searchValue == replaceWith) {
		return str;
	}
	
	while(str.indexOf(searchValue) >= 0) {
		str = str.replace(searchValue, replaceWith);
	}
	
	return str;
}
module.exports.replaceAll = replaceAll;

function xor(str, xor) {
  var chars = str.split('');

  for (var i = 0; i < chars.length; i++) {
    var c = chars[i].charCodeAt(0);

    chars[i] = String.fromCharCode(c ^ (xor+i));
  }

  return chars.join('');
}
module.exports.xor = xor;

function getTime(time) {
	var datetime = new Date();

	var timeSplit = time.split(":");

	datetime.setHours(timeSplit[0]);
	datetime.setMinutes(timeSplit[1]);

	var strTime = dateFormat(datetime, "h:MM tt");

	return strTime;
}
module.exports.getTime = getTime;

function getDay(day) {
	if (day == 0) {
		return "Sunday";
	} else if (day == 1) {
		return "Monday";
	} else if (day == 2) {
		return "Tuesday";
	} else if (day == 3) {
		return "Wednesday";
	} else if (day == 4) {
		return "Thursday";
	} else if (day == 5) {
		return "Friday";
	} else {
		return "Saturday";
	}
}
module.exports.getDay = getDay;
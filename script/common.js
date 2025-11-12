var dateFormat = require('dateformat');

const webpage_url = '/';
module.exports.webpage_url = webpage_url;

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
		application_name: 'Meet Space',
		connectionString: process.env.DATABASE_URL,
		ssl: {
			rejectUnauthorized: false
		},
		max: 20
	};

	return config;
}
module.exports.postgresConfig = postgresConfig;


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
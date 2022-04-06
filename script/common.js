const url = require('url')
const params = url.parse(process.env.DATABASE_URL);
const auth = params.auth.split(':');

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
    user: auth[0],
    password: auth[1],
    host: params.hostname,
    port: params.port,
    database: params.pathname.split('/')[1],
    ssl: true	  
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
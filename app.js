var express = require('express');
var app = express();
var favicon = require('serve-favicon');
var cookieParser = require('cookie-parser')
var port = process.env.PORT || 80

console.log('port number is: ' + port);

app.use(favicon(__dirname + '/favicon.ico'));

app.use(cookieParser())
app.use('/images', express.static('images'));
app.use('/script', express.static('script'));
app.use('/webpage', express.static('webpage'));

require('./main.js')(app);

app.listen(port, function () {
  console.log('Reading to meat people!');
});

require('./register.js')(app);
require('./useractivate.js')(app);

require('./login.js')(app);
require('./logout.js')(app);

require('./updateprofile.js')(app);

require('./activity.js')(app);

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

app.get('/', function (req, res) {
  res.send('<h1>Meet Space!</h1><br> \
  A place to meet people in the real world');
});

app.listen(port, function () {
  console.log('Reading to meat people!');
});

require('./register.js')(app);
require('./useractivate.js')(app);

require('./login.js')(app);
require('./logout.js')(app);


require('./activity.js')(app);


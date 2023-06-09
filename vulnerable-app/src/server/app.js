/*jshint node:true*/
'use strict';

var express = require('express');
var app = express();
app.disable('x-powered-by');
var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');
var favicon = require('serve-favicon');
var logger = require('morgan');
var port = process.env.PORT || 8001;
var four0four = require('./utils/404')();
var environment = process.env.NODE_ENV;
var lusca = require('lusca');
var session = require('express-session');

app.use(session({
    secret: 'abc'
}));

app.use(lusca.csrf({
    angular: true
}));

app.use(lusca.xframe('SAMEORIGIN'));

app.use(lusca.csp({
    policy: {
        'default-src': '\'self\'',
        'style-src': '\'self\'',
        'img-src': '\'self\' data:',
        'frame-ancestors': '\'self\''
    }
}));

app.use(favicon(__dirname + '/favicon.ico'));
app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());
app.use(cookieParser());
app.use(logger('dev'));

var headerCheck = require('./utils/header-check');
app.use(headerCheck([
    'https://localhost:8001'
]));

app.use('/api', require('./routes'));

console.log('About to crank up node');
console.log('PORT=' + port);
console.log('NODE_ENV=' + environment);

switch (environment){
    case 'build':
        console.log('** BUILD **');
        app.use(express.static('./build/'));
        // Any invalid calls for templateUrls are under app/* and should return 404
        app.use('/app/*', function(req, res, next) {
            four0four.send404(req, res);
        });
        // Any deep link calls should return index.html
        app.use('/*', express.static('./build/index.html'));
        break;
    default:
        console.log('** DEV **');
        app.use(express.static('./src/client/'));
        app.use(express.static('./'));
        app.use(express.static('./tmp'));
        // Any invalid calls for templateUrls are under app/* and should return 404
        app.use('/app/*', function(req, res, next) {
            four0four.send404(req, res);
        });
        // Any deep link calls should return index.html
        app.use('/*', express.static('./src/client/index.html'));
        break;
}

var https = require('https');
var fs = require('fs');

var options = {
    key: fs.readFileSync('./vulnapp-key.pem'),
    cert: fs.readFileSync('./vulnapp-cert.pem')
};

https.createServer(options, app).listen(port, function () {
    console.log('Express server listening on port ' + port);
    console.log('env = ' + app.get('env') +
        '\n__dirname = ' + __dirname +
        '\nprocess.cwd = ' + process.cwd());
});

// app.listen(port, function() {
//     console.log('Express server listening on port ' + port);
//     console.log('env = ' + app.get('env') +
//         '\n__dirname = ' + __dirname  +
//         '\nprocess.cwd = ' + process.cwd());
// });
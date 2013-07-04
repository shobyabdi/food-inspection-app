var express = require('express')
  , http = require('http');

var app = express();
var server = http.createServer(app);
var io = require('socket.io').listen(server);

var soda = require('soda-js');

var fs = require('fs');
var url = require('url');

var consumer = new soda.Consumer('data.cityofchicago.org');

var yelp = require("yelp").createClient({
  consumer_key: "IdcFfQH9ddkFPg0icUpEFA", 
  consumer_secret: "nl0-Sfu6ow5vtOMZEXz30jYc7JU",
  token: "wLhcZwbswtkIst1sbb-99bowU3OQiKwO",
  token_secret: "a-SByyu35qj6vgcMDIld-h26y50"
});

/***********************************
 * socket.io configuration         *
 ***********************************/

io.configure(function () { 
  io.set('transports', ['xhr-polling']); 
  io.set('polling duration', 10); 
  io.set('log level', 1);
});

io.sockets.on('connection', function (socket) {
  console.log('client connected to socket.io');
});

/***********************************
 * express configuration           *
 ***********************************/

app.configure(function(){
  app.set('views', __dirname + '/views');
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(app.router);
  app.use(express.static(__dirname + '/public'));
  app.use(express.cookieParser()); 
  app.use(express.session({ secret: 'mongodb testing baby' })); 
});

app.configure('development', function(){
  app.use(express.errorHandler({ dumpExceptions: true, showStack: true })); 
});

app.configure('production', function(){
  app.use(express.errorHandler()); 
});

/***********************************
 * express routes                  *
 ***********************************/

app.get('/akaname/:akaname', function(request, response) {
	console.log(request.params.akaname);
	consumer.query()
	  .withDataset('4ijn-s7e5')
	  .where({ dba_name: request.params.akaname })
	  .order('results')
	  .getRows()
	    .on('success', function(rows) { 
	    	rows.forEach( function(restaurant) {
			    io.sockets.emit('city', JSON.stringify(restaurant));
			});
	    }).on('error', function(error) { console.error(error); });  
	yelp.search({term: request.params.akaname, location: "Chicago"}, function(error, data) {
	  data.businesses.forEach( function(restaurant) {
		 io.sockets.emit('yelp', restaurant);
	  });
	}); 
	response.end();   
});

app.get('/', function(req, res) {
    fs.readFile(__dirname + '/views/index.html', 'utf8', function(err, text){
        res.send(text);
        res.end();
    });
});

/***********************************
 * app initialization              *
 ***********************************/

server.listen(5000);

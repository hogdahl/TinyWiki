
// content of index.js
var http = require('http');
var Settings = require('./settings').Settings;
var WsHandler = require('./wshandler').WsHandler;
var WikiHandler = require('./wikihandler').WikiHandler;
var config = require('./package').config;

var pageHandlers = {};
var settings = new Settings();
settings.port=3000;
settings.user='';
settings.pass='Puss';
settings.title='TinyWiki';
settings.notopic = '404'; // http errcode on no topic in wiki
settings.userOverride();
if(config){
	// override settings with package.json config
	// Object.assign seems not always to be around 
	var keys = Object.keys(config),key;
	for(var i=0,l= keys.length;i<l;i++){
		key = keys[i];
		settings[key] = config[key];
	}
}
console.log('Settings:\n' + settings);

var WebSocketServer = require('websocket').server;
var url = require('url');
var PageHandler = require('./pagehandler').PageHandler;
pageHandlers.wikiHandler = new WikiHandler();

var requestHandler = function (request, response){
	try{
		var ph = new PageHandler(settings, pageHandlers,request,response);
	}catch(e){}
};

var server = http.createServer(requestHandler);


var wss = new WebSocketServer( {httpServer:server} );
var wsHandlers = {};

wss.on('request', function(request) {
	  var connection = request.accept(null, request.origin);
	  wsHandlers[connection] = new WsHandler(connection,settings,pageHandlers);
	  
	  connection.on('close', function(connection) {
		  var handler = wsHandlers[connection];
		  delete wsHandlers[connection];
		  
		  console.log('closed');
	  });

	});

server.listen(settings.port, function (err){  
  if (err) {
    return console.log('something bad happened', err);
  }

  console.log('server is listening on port:' + settings.port);
});


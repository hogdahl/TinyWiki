var util = require('util');
var fs = require('fs');
var wikiPath = require('./wikipath').wikiPath;



module.exports.WsHandler = function(ws, settings, pageHandlers){
	var handlers  = {},
	wikiHandler = pageHandlers.wikiHandler;
	
	var auth = false; // may not edit
	
	function sendMsg(msg){
		ws.send(JSON.stringify(msg));
	}

	handlers.exists = function(msg){
		fs.exists(wikiPath(msg.id),function(exists){
			msg.data = exists;
			sendMsg(msg);
		});
	};

	handlers.checktopics = function(msg){
		var checkTopics = msg.checkTopics, topics = [], id;
		for(var i = 0, l = checkTopics.length;i<l;i++){
			id = checkTopics[i];
			if(wikiHandler.topics[id]){
				topics.push(topic);
			}
		}
		msg.data = topics;
		sendMsg(msg);
	}

	handlers.topics = function(msg){
		msg.data = wikiHandler.topics;
		sendMsg(msg);
	}

	
	handlers.read = function(msg){
		fs.readFile(wikiPath(msg.id),function(err,data){
			if(err){
				msg.err = true;
			}else{
				msg.data = wikiHandler.setAClasses(data.toString());
			}
			sendMsg(msg);
		});
	};
	
	handlers.write = function(msg){
		if(auth){
			fs.writeFile(wikiPath(msg.id), msg.data, function(err){
				msg.err = err;
				delete msg.data;
				sendMsg(msg);
				wikiHandler.addFile(msg.id);
			});
		}else{
			console.log('Unauthorized write prevented');
		}
	};
	
	handlers.login = function(msg){
		if(msg.auth && msg.auth === settings.authkey){
			auth = true;
		}else{
			if(msg.user === settings.user && msg.pass === settings.pass){
				auth = true;
			}
		}
		if(auth && ! settings.authkey){
			settings.authkey = Math.random().toString().replace('0.','');
		}
		msg.auth = settings.authkey;
		sendMsg(msg);
	};

	handlers.logout = function(msg){
		settings.authkey = null;
		msg.auth = auth = false;
		sendMsg(msg);
	};

	
	
	handlers.helo = function(msg){
		console.log('handlers helo:' + msg.data);
	};

	
	  ws.on('message', function(message) {
	    if (message.type === 'utf8') {
	      console.log('ws in:' + util.inspect(message));
	      // is this json
	      try{
	    	  var json = JSON.parse(message.utf8Data),handler;
	    	  if((handler = handlers[json.handler])){
	    		 handler(json,ws);
	    	  }else{
		    	  console.log('WsHandler unknown handler:' + json.handler );
	    	  }
	      }catch(e){
	    	  console.log('WsHandler unknown message:' + message.utf8Data );
	      }
	      
	    }
	  });
};
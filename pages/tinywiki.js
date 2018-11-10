/*global location,window,document,WebSocket,console,sessionStorage,TinyEdit */


var wsocket = null;
var pageHeader = null;
var tinyEdit = null;
var href;
var auth = false;
var tinyBody = false;
var tinyUrl = null;
var loginDiv = null;


function Href(){
	var href = location.href, harr = href.split('?');
	this.args = {};
	this.url = harr[0];
	if(harr.length > 1){
		var argsarr = harr[1].split('&'),i,l,argarr,arr;
		for(i=0,l= argsarr.length;i<l;i++){
			argarr = argsarr[i];
			arr = argarr.split('=');
			if(arr.length > 1){
				this.args[arr[0]] = arr[1];
			}else{
				this.args[arr[0]] = null;
			}
		}
	}
}


function createTinyBody(){
	if(! tinyBody){
		tinyBody = document.getElementById('tinyBody');
		if(! tinyBody){
			tinyBody = document.createElement('div');
			tinyBody.id = 'tinyBody';
			document.body.appendChild(tinyBody);
		}
	}
	return tinyBody;
}

function createAbout(){
	var div = document.createElement('div'), a = document.createElement('a');
	div.appendChild(document.createTextNode('Page is povered by '));
	a.appendChild(document.createTextNode('TinyWiki'));
	a.href = 'http://www.hogdahls.se/TinyWiki';
	div.appendChild(a);
	div.appendChild(document.createElement('br'));

	div.appendChild(document.createTextNode('A program by '));
	a = document.createElement('a');
	a.appendChild(document.createTextNode('Högdahl i Kalix AB'));
	a.href = 'http://www.hogdahls.se';
	div.appendChild(a);
	return div;
}

function tryLogin(){
	if(! wsocket){
		wsocket = new WSocket(href);
	}
	if(! loginDiv){
		var user = document.createElement('input');
		user.id = 'user';
		user.size =10;
		var pass = document.createElement('input');
		pass.id = 'pass';
		pass.size = 10;
		pass.type = 'password';
		var login = document.createElement('input');
		login.value = 'login';
		login.type = 'button';
		login.onclick = function(){
			var msg = '{ "handler":"login","user":"' + user.value +'","pass":"' + pass.value +'"}';
			wsocket.send(msg);
		};
		pass.onkeyup = function (e){
			if(e.keyCode === 13){
				login.onclick();
			}
		};
		var loginTable = document.createElement('table'),row,cell;	

		loginDiv = document.createElement('div');
		loginDiv.style.border = "thick solid #0000FF";
		loginDiv.style.textAlign = 'center';
		loginDiv.appendChild(loginTable);
		loginDiv.style.width = '15em';
		row = loginTable.insertRow(-1);
		cell = row.insertCell(-1);
		cell.appendChild(document.createTextNode('user:'));
		cell = row.insertCell(-1);
		cell.appendChild(user);
		row = loginTable.insertRow(-1);
		cell = row.insertCell(-1);
		cell.appendChild(document.createTextNode('password:'));
		cell = row.insertCell(-1);
		cell.appendChild(pass);
		row = loginTable.insertRow(-1);
		cell = row.insertCell(-1);
		cell = row.insertCell(-1);
		cell.appendChild(login);
		loginDiv.appendChild(createAbout());
		document.body.appendChild(loginDiv);
	}
}

function PageHeader(){
	var ph = this,
	header = document.createElement('div'),
	login = document.createElement('input');
	this.url = document.createElement('input');
	this.topicsCtrl = document.createElement('div');
	this.topics = document.createElement('div');
	
	login.value = 'login';
	login.type = 'button';
	login.onclick = function(){
		tryLogin();
	};
	login.style.cssFloat = 'right';
	login.id = 'loginbutt';
	this.url.style.cssFloat = 'right';
	this.url.id = 'tinyurl';
	this.url.title = 'url to this page';
	this.url.type='hidden';
	this.url.style.width = '30em';
	this.topics.style.display = 'none';
	this.topics.style.position = 'absolute';
	this.topics.style.top = '20px';
	this.topics.style.left = '50%';
	
	function expandTopics(event){
		ph.topicsCtrl.removeChild(ph.topicsCtrl.firstChild);
		ph.topicsCtrl.appendChild(document.createTextNode('▲'));
		ph.topics.style.display = 'inline-block';
		ph.topics.style.top = (event.clientY + 20) + 'px';
		ph.topics.style.left = (event.clientX - 10) + 'px';
		ph.topics.style.minWidth = '30em';
		ph.topicsCtrl.onclick=shrinkTopics;
	}
	function shrinkTopics(event){
		ph.topicsCtrl.removeChild(ph.topicsCtrl.firstChild);
		ph.topicsCtrl.appendChild(document.createTextNode('▼'));
		ph.topics.style.display = 'none';
		ph.topicsCtrl.onclick=expandTopics;
	}
	this.topicsCtrl.appendChild(document.createTextNode('▼'));
	this.topicsCtrl.style.cursor = 'pointer';
	this.topicsCtrl.style.display = 'none';
	this.topicsCtrl.onclick=expandTopics;
	this.topicsCtrl.title = 'Display topics';
	
	header.appendChild(login);
	header.appendChild(this.url);
	document.body.appendChild(this.topics);
	header.appendChild(this.topicsCtrl);
	header.style.position = 'absolute';
	header.style.top = '2px';
	header.style.left = '50%';
	header.style.width = '45%';
	
	document.body.appendChild(header);
	this.setAuth = function(set){
		if(set){
			login.style.backgroundColor= 'LIME';
			pageHeader.url.type='text';
			if(loginDiv){
				document.body.removeChild(loginDiv);
				loginDiv = null;
			}
			login.onclick = function(){
				// logout, we dont really logout, just client end
				var smsg = {};
				smsg.handler = 'logout';
				wsocket.sendMsg(smsg);
				sessionStorage.removeItem('authkey');
				useLocalLinks(false);
				pageHeader.url.type='hidden';

				login.onclick = function(){
					tryLogin();
				};
				login.style.backgroundColor= 'initial';
			};
		}else{
			login.style.backgroundColor= 'RED';
		}
	};
}

function removeAll(hay,straw){
	var p = 0, l = straw.length;
	while((p = hay.indexOf(straw,p)) !== -1){
		hay = hay.substring(0,p) + hay.substring(p + l);
	}
	return hay;
}

function WSocket(href){
	var id = 'id' in href.args ? href.args.id : 'main';
	var ws = this, url = href.url,
	auth = false;
	url = url.replace('http://','ws://');
	url = url.replace('https://','wss://');
	var socket = new WebSocket(url);

	this.autologin = function(){
		if(! auth){
			// try autologin
			var authkey = sessionStorage.getItem('authkey');
			if(authkey){
				var smsg = {};
				smsg.handler = 'login';
				smsg.auth = authkey;
				ws.sendMsg(smsg);
			}
		}
	}
	
	
	var handlers = {};
	handlers.read = function(msg){
		createTinyBody();
		pageHeader.url.value=href.url + '?id=' + msg.id;
		if(msg.hasOwnProperty('data')){
			console.log('msg.data');
			tinyBody.innerHTML = msg.data;
			useLocalLinks(true);
		}else{
			if('err' in msg){
				console.log('handlers.read err:' + msg.err);
				if(msg.id === 'main'){
					if(! tinyEdit){
					tinyBody.innerHTML = '<div id="notopic"><h3>Topic:"' + msg.id + '" does not exist yet</h3> you must be logged to create it or else just checkout the editor.<br></div>';
					tinyEdit = new TinyEdit(msg.id,null);
					tinyEdit.setAuth(auth);
					}
				}else{
					tinyBody.innerHTML = '<div id="notopic"><h3>Topic:"' + msg.id + '" does not exist yet</h3> you must be logged in to create it.<br></div>';
					if(tinyEdit){
						tinyEdit.setData(msg.id,null);
					}
				}
			}else{
				ws.autologin();
			}
		}

		
	};
	
	handlers.write = function(msg){
		if(tinyEdit){
			tinyEdit.setPublishStatus(msg);
		}
	};
	
	handlers.topics = function(msg){
		var topics = msg.data,topic,keys=Object.keys(topics),
		div = pageHeader.topics ,a;
		div.style.background = 'WHITE';
		div.style.padding = '10px';
		div.style.border = '1px solid LIGHTGRAY';
		while(div.firstChild){
			div.removeChild(div.firstChild);
		}
		pageHeader.topicsCtrl.style.display = 'inline-block';
		for(var i = 0, l = keys.length;i<l;i++){
			topic = topics[keys[i]];
			if(i > 0){
				div.appendChild(document.createElement('br'));
			}
			a = document.createElement('a');
			a.href = href.url + '?id=' + topic.id;
			a.style.minWidth = '28em';
			a.appendChild(document.createTextNode(topic.mtime.replace(/T.*/,' ') + topic.id + ' : ' + topic.header));
			div.appendChild(a);
		}
	}
	
	handlers.login = function(msg){
		if('auth' in msg){
			auth = msg.auth;
			if(auth){
				sessionStorage.setItem('authkey',auth);
			}
			useLocalLinks(true);
			console.log('login Ok');
			pageHeader.setAuth(msg.auth);
			pageHeader.url.type='text';
			try{
			if(! tinyEdit){
				tinyEdit = new TinyEdit(id,null);
			}
			}catch(e){
				console.log(e);
			}
			tinyEdit.setAuth(auth);
			tinyEdit.onPublish = function(topic,html){
				var smsg = {};
				smsg.id = topic;
				smsg.handler = 'write';
				html = removeAll(html, ' class="NONE"');
				html = removeAll(html, ' class="EXIST"');
				//console.log(html);
				smsg.data = html;
				ws.sendMsg(smsg);
			};
			var topicsMsg = {};
			topicsMsg.handler = 'topics';
			ws.sendMsg(topicsMsg);
		}
	};
	
	
	socket.onopen = function(){
		if(! document.getElementById('tinyBody')){
			socket.send('{"handler":"read","id":"' + id + '"}');
		}else{
			ws.autologin();
		}
	};
	socket.onmessage = function(amsg){
		console.log(amsg);
		try{
			var msg = JSON.parse(amsg.data),handler;
			try{
			if(( handler = handlers[msg.handler])){
				handler(msg);
			}
			}catch(e){
				console.log('failed to handle:' + msg);
				console.log(e);
			}
		}catch(e){
			console.log('Failed to parse:' + amsg.data);
		}
	};
	socket.onclose = function(){
		console.log('websocket closed');
		wsocket = null;
	};
	

	this.send = function(text){
		socket.send(text);
	};
	this.sendMsg = function(msg){
		socket.send(JSON.stringify(msg));
	};
	this.connected = function(){
		return socket.readyState == socket.OPEN;
	}
}

function addCss(){
	var mstyle = document.createElement('style');
	document.head.appendChild(mstyle);
	mstyle.sheet.insertRule('pre{ background-color:#D3D3D3; width:90%; margin-left:2%; }',0);
	mstyle.sheet.insertRule('a:link.NONE { color:RED; text-decoration: none; }',0);
	mstyle.sheet.insertRule('a:visited.NONE { color:RED; text-decoration: none; }',0);
	mstyle.sheet.insertRule('a:link.EXIST { color:GREEN; text-decoration: none; }',0);
	mstyle.sheet.insertRule('a:visited.EXIST { color:#551A8B; text-decoration: none; }',0);
}

function localLink(event){
	var target = event.target, href = target.href,id,idref = 'id=',idpos;
	if(href != null && wsocket != null && wsocket.connected()){
		console.log(href);
		idpos = href.indexOf(idref);
		if(idpos != -1){
			id = href.substring(idpos+idref.length);
			wsocket.send('{"handler":"read","id":"' + id + '"}');
		return false;
		}
	}
	return true;
	
	
	
}

function useLocalLinks(use){
	var as = document.getElementsByTagName('a'),a,
	myid = href.url + '?id=';
	for(var i = 0, l = as.length; i<l ;i++){
		a = as[i];
		if(a.href && (a.href.startsWith('/?id=') || a.href.startsWith(myid) )){
			if(use){
				a.onclick = localLink;
			}else{
				a.onclick = null;
			}
		}
	}
}

href = new Href();
//check autologin
var authkey = sessionStorage.getItem('authkey');
if(authkey || ! document.getElementById('tinyBody')){
	wsocket = new WSocket(href);
	useLocalLinks(true);
}

pageHeader = new PageHeader();
addCss();



console.log(location.href);
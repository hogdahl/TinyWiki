var fs = require('fs');
var util = require('util');


function getJs(script){
	var path = process.cwd() + '/pages' + script,
	fstat = fs.lstatSync(path);
	if(fstat){
		return '<script src="' + script + '?' + fstat.mtime.getTime().toString(16) + '" ></script>\n' ; 
	}
	return '';
}

/**
 * onload = function(responseCode,data)
 */
function processPage(settings, pageHandlers, url, onload){
	var pg = this;
	pg.err = false;
	this.data = null;
	if(url.path.indexOf('..') !== -1){
		onload(403,null);
		return;
	}
	if(url.path === '/'){
		url.path = '/index.html';
		console.log('new Url.path:' + url.path);
	}
	var realPath = process.cwd() + '/pages' + url.path;
	if(fs.existsSync(realPath)){
		this.responseCode = 200;
		fs.readFile(realPath, function(err,data){
			if(err){
				onload(403,null);
			}else{
				// data is the page
				if(url.mimeType.indexOf('html') === -1){
					onload(200,data);
					return;
				}
				data = data.toString();
				console.log('insert {}');
				data = data.replace('${title}','<title>' + settings.title + '</title>');
				data = data.replace('${tinyedit}',getJs('/tinyedit.js'));
				data = data.replace('${tinywiki}',getJs('/tinywiki.js'));
				if(data.indexOf('${tinyBody}') !== -1){
					var filename, addNoTopic;
					
					if(url.args && 'id' in url.args) {
						filename = url.args.id;
						addNoTopic = true;
					}else{
						filename = 'main';
						addNoTopic = false;
					}
					data = data.replace('${tinyBody}',pageHandlers.wikiHandler.readAndProcess(filename, addNoTopic));
				}
				
				onload(200,data);
			}
		});
	}else{
		console.log('dont exists realPath:' + realPath);
		onload(403,null);
	}
}


function Args(argStr){
	var argArr = argStr.split('&'),i,l,tArr;
	for(i= 0, l = argArr.length ; i < l ; i++){
		tArr = argArr[i].split('=');
		if(tArr.length > 1){
			this[tArr[0]] = tArr[1];
		}else{
			this[tArr[0]] = null;
		}
	}
}

function getMimeType(path){
	var types = {'ico':'image/x-icon',
			'png':'image/png',
			'gif':'image/gif',
			'css':'text/css',
			'text':'text/plain',
			'js':'application/javascript',
			'html':'text/html'},
			type,p;
	p = path.lastIndexOf('.');
	if(p !== -1){
		type = path.substr(p+1).toLowerCase();
		return types[type];
	}
	return types.html;
}


function Url(url){
	var p = url.indexOf('?');
	if(p !== -1){
		this.args = new Args(url.substr(p+1));
		this.path = url.substr(0,p);
	}else{
		this.args = null;
		this.path = url;
	}
	

	this.mimeType = getMimeType(this.path);
}


function PageHandler(settings, pageHandlers, request, response){
	var url = new Url(request.url);
	//console.log(util.inspect(url));
	processPage(settings, pageHandlers, url, function(responseCode,data){
		console.log(request.url + ':' + url.path + ':'  + responseCode);
		response.writeHead(responseCode, {'Content-Type': url.mimeType });
		if(data){
			response.end(data);
		}else{
			response.end('');
		}
	});
}




module.exports.PageHandler = PageHandler;



 
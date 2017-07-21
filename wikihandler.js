var fs = require('fs');
var wikiPath = require('./wikipath').wikiPath;
var wikiDir = require('./wikipath').wikiDir;

module.exports.WikiHandler = function(){
	var wh = this;
	this.files = [];
	
	this.addFile = function(filename){
		if(! wh.files.indexOf(filename)){
			wh.files.push(filename);
		}
	};
	
	fs.readdir(wikiDir(), function (err, files){
		wh.files = files;
	});
	
	function  setAClass(htmlPart){
		if(htmlPart.charAt(0) !== '"'){
			return htmlPart;
		}
		var ecent = htmlPart.indexOf('"',2),
		exist,
		ref,idp,ep,id;
		if(ecent !== -1){
			ref = htmlPart.substring(1,ecent);
			if(ref.indexOf('://') !== -1){
				return htmlPart; // not internal
			}
			if(ref.indexOf('.') !== -1){
				return htmlPart; // not wiki , something with extension
			}
			idp = ref.indexOf('id=');
			if(idp !== -1){
				id = ref.substr(idp+3);
				if((ep = id.indexOf('&')) !== -1){
					id = id.substr(0,ep);
				}
				
				console.log(wh.files);
				exist = (wh.files.indexOf(id) !== -1);
			}else{
				exist = false;
			}
			console.log('id:' + id + ' index:' + wh.files.indexOf(id) + ' ' + exist);
		}
		
		if( exist ){
			return htmlPart.replace('>',' class="EXIST">');
		}else{
			return htmlPart.replace('>',' class="NONE">');
		}
		return htmlPart;
	}
	
	
	wh.setAClasses = function(html){
		var hrefArr = html.split(' href='),i,l, newHtml = "",tagstr,diff = '', inATag = false,ltp,gtp, div = '';
		for(i=0,l=hrefArr.length;i<l;i++){
			tagstr = hrefArr[i];
			newHtml += div; // eventually replace href=
			if(inATag){
				newHtml += setAClass(tagstr);
			}else{
				newHtml += tagstr;
			}
			// is this an <a tag
			ltp = tagstr.lastIndexOf('<');
			gtp = tagstr.lastIndexOf('>');
			
			if(ltp !== -1 && ltp > gtp && (tagstr.charAt(ltp+1) === 'A' || tagstr.charAt(ltp+1) === 'a')){
				inATag = true;
			}else{
				inATag = false;
			}
			div = ' href=';
		}
		return newHtml;
	};

	/** add both the classes on links and wiki tinyBody div
	 * 
	 */
	wh.addWiki = function(html){
		return '<div id="tinyBody">\n' + wh.setAClasses(html) + '</div>'; 
	};
	
	wh.readAndProcess = function(filename, addNoTopic){
		var html = null;
		try{
			html = fs.readFileSync(wikiPath(filename));
		}catch(e){
			console.log(e);
		}
		if(! html){
			if(addNoTopic){
				html = '<div id="notopic"><h3>Topic:"' + filename + '" does not exist yet</h3> you must be logged in to create it.<br></div>';
			}else{
				return "";
			}
		}
		return wh.addWiki(html.toString());
	};
	
};
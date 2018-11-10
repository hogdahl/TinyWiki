var fs = require('fs');
var wikiPath = require('./wikipath').wikiPath;

module.exports.WikiTopic = function (id){
	var wt = this;
	this.topic = {};
	this.topic.id = id;
	this.topic.header = null;
	this.topic.mtime = null;
	var path = wikiPath(id),
	fd = null;
	function getHeader(text){
		var htstart = text.indexOf('<h'),htend,hend, head ,l;
		if(htstart != -1){
			htend = text.indexOf('>',htstart);
			if(htend != -1){
				hend = text.indexOf('</h',htend);
				if(hend != -1){
					head = text.substring(htend + 1, hend);
					for(var l = 0; head.length != l ; l = head.length){
						head = head.replace(/<.*>/,'');
					}
					return head;
				}
			}
		}
		return null;
	}
	/** cb ( err, topic ) */
	this.load = function(cb){
		fs.open(path,'r', function(err,fd){

			if(err){
				cb(err);
			}else{
				var closeCnt = 2,err0 = false;
				function closeCheck(errx){
					if(errx){
						err0 = errx;
					}
					if(--closeCnt <= 0){
						if(! errx){
							cb(false,wt);
						}
					}
					fs.close(fd,function(errc){});
				}
				fs.readFile(path,'utf8', function(err1,data){
					if(err1){
						cb(err1,wt);
					}else{
						wt.topic.header = getHeader(data);
					}
					closeCheck(err1);					
				});
				fs.fstat(fd,function(err2,stat){
					if(err2){
						cb(err2,wt);
					}else{
						wt.topic.mtime = stat.mtime;
					}
					closeCheck(err2);					
				});
				
			}
		});
	}
	
};

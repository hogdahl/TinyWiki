var fs = require('fs');

module.exports.WikiPath = function(id){
	this.path = process.cwd() + '/wikipages/' + id;
};
module.exports.wikiPath = function(id){
	return process.cwd() + '/wikipages/' + id;
};
module.exports.wikiDir = function(id){
	return process.cwd() + '/wikipages/';
};

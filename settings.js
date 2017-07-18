module.exports.Settings = function(){
	var settings = this;
	this.userOverride = function(){
		var argv = process.argv, i , l , arg;
		for( i = 2, l = argv.length ; i < l ; i++){
			arg = argv[i].split('=');
			if(arg.length===2){
				settings[arg[0]] = arg[1];
			}
		}
	};
	this.toString = function(){
		var keys = Object.keys(settings),i,l,key,value,str = '';
		for(i=0,l=keys.length;i<l;i++){
			key = keys[i];
			value = settings[key];
			//console.log('key:' + key + ' value:' + value + ' type' + typeof value);
			if(typeof value === 'string' || typeof value === 'number' ){
				str += key + '=' + value + '\n';
			}
		}
		return str;
	};
};


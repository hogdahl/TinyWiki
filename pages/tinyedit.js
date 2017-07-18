/*global location,window,document,WebSocket,console */

var tinyNoTopicDiv = '<div id="notopic">';

function TinyEdit(topic, div){
	var te = this, editDiv = document.createElement('div'),button, text, publishButton;
	if(!div){
		div = document.getElementById('tinyBody');
	}
	if(!div){
		div = document.createElement('div');
		div.id = 'tinyBody';
		document.body.appendChild(div);
	}
	
	function localSrc(text){
		var addr = location.href.split('?')[0],
		slashes = addr.indexOf('//'),
		lastp = addr.indexOf('/',slashes + 2),
		file = lastp !== -1 ? addr.substr(lastp) : '';
		return file + '?id=' + text.replace(/\W/g,'_');
	}

	function selectionInTag(){
		if (text.selectionStart && text.selectionStart === text.selectionEnd ) {
			var start = text.selectionStart, str = text.value, nextTS = str.indexOf('<',start), nextTE = str.indexOf('>',start);
			if(nextTE !== -1){
				if(nextTS === -1 || nextTE < nextTS){
					return true;
				}
			}
		}
		return false;
	}

	function insertText(atext){
		if (document.selection) {
			text.focus();
			var sel = document.selection.createRange();
			sel.text = atext;
		}
		//mozilla++
		else if (text.selectionStart || text.selectionStart === 0) {
			var start = text.value.substring(0, text.selectionStart);
			var end = text.value.substring(text.selectionEnd);
			text.value = start + atext + end ;
		} else {
			text.value += atext;
		}
		div.innerHTML = text.value;
	}
	
	
	function tagLabel(tag){
		var str,start,end,p;
		if(tag.charAt(1) === '/'){
			str = tag.substring(2,tag.length - 1);
		}else{
			str = tag.substring(1,tag.length - 1);
		}
		if((p = str.indexOf(' ')) !== -1){
			return str.substring(0,p);
		}
		return str;
	}
	
	// oldTagP should point to <
	function replaceTag(str,ntag, oldTagP){
		var epos = str.indexOf('>', oldTagP);
		if(epos !== -1){
			var str1 = str.substr(0,oldTagP);
			var str2 = str.substr(epos+1);
			return str.substr(0,oldTagP) + ntag + str.substr(epos+1);
		}
		return str;
	}
	
	
	
	
	function replaceTags(tag,etag){
		// This is expected to occur when we detected we are in a tag
		var start = text.selectionStart, str = text.value, lastTS = str.lastIndexOf('<',start), nextTE = str.indexOf('>',start),
		startTagP = -1,endTagP = -1,stag,label;
		if(nextTE !== -1 && lastTS !==-1){
			var oldTag = str.substring(lastTS,nextTE + 1);
			if(str.charAt(lastTS + 1) === '/'){
				// this is </endTag
				endTagP = lastTS;
				label = tagLabel(oldTag);
				stag = '<' + label;
				if(label === tagLabel(tag)){
					tag = etag = '';
				}
				startTagP = str.lastIndexOf(stag,endTagP);
				if(startTagP !== -1){
					str = replaceTag(str,etag,endTagP);
					str = replaceTag(str,tag,startTagP);
					text.value = str;
					div.innerHTML = text.value;
				}
				console.log('oldEndTag:' + oldTag );
			}else{
				// this is <tag
				console.log('oldEndTag:' + oldTag );
				startTagP = lastTS;
				label = tagLabel(oldTag);
				stag = '</' + label;
				if(label === tagLabel(tag)){
					tag = etag = '';
				}
				endTagP = str.indexOf(stag,startTagP);
				if(endTagP !== -1){
					str = replaceTag(str,etag,endTagP);
					str = replaceTag(str,tag,startTagP);
					text.value = str;
					div.innerHTML = text.value;
				}
			}
			
			console.log('oldTag:' + oldTag );
			console.log('tagLabel{' + tagLabel(oldTag) + '}');
		}
	}
	
	function modifySelected(tag){
		var etag = tag.replace('<','</');
		var selstart = false,selend = false;
		if(selectionInTag()){
			replaceTags(tag,etag);
			return;
		}
		if (document.selection) {
			text.focus();
			var sel = document.selection.createRange();
			sel.text = tag + sel.text + etag;
		}
		//mozilla++
		else if (text.selectionStart || text.selectionStart === 0) {
			selstart = text.selectionStart;
			selend = text.selectionEnd;
			var start = text.value.substring(0, text.selectionStart);
			var end = text.value.substring(text.selectionEnd);
			var atext = text.value.substring(text.selectionStart,text.selectionEnd);
			text.value = start + tag + atext + etag + end ;
		} else {
			text.value += tag + etag;
		}
		div.innerHTML = text.value;
		if(selstart !== false){
			text.focus();
			text.setSelectionRange(selstart + tag.length,selend + tag.length);
		}
	}
	
	function modifySelectedA(){
		var tag = '<a href="">', etag = '</a>';
		if(selectionInTag()){
			replaceTags(tag,etag);
			return;
		}
		if (document.selection) {
			text.focus();
			var sel = document.selection.createRange();
			sel.text = tag + sel.text + etag;
		}
		//mozilla++
		else if (text.selectionStart || text.selectionStart === 0) {
			var start = text.value.substring(0, text.selectionStart);
			var end = text.value.substring(text.selectionEnd);
			var atext = text.value.substring(text.selectionStart,text.selectionEnd);
			if(atext.length > 0){
				tag = '<a href="' +  localSrc(atext) + '">';
			}
			text.value = start + tag + atext + etag + end ;
		} else {
			text.value += tag + etag;
		}
		div.innerHTML = text.value;
	}

	function insertBeforeSelected(str){
		var selstart = false,selend = false;
		if (document.selection) {
			text.focus();
			var sel = document.selection.createRange();
			sel.text = str + sel.text;
		}
		//mozilla++
		else if (text.selectionStart || text.selectionStart === 0) {
			selstart = text.selectionStart;
			selend = text.selectionEnd;
			var start = text.value.substring(0, text.selectionStart);
			var end = text.value.substring(text.selectionEnd);
			var atext = text.value.substring(text.selectionStart,text.selectionEnd);
			text.value = start + str + atext + end ;
		} else {
			text.value += str;
		}
		div.innerHTML = text.value;
		if(selstart !== false){
			text.focus();
			text.setSelectionRange(selstart ,selend + str.length);
		}
	}
	function insertAfterSelected(str){
		var selstart = false,selend = false;
		if (document.selection) {
			text.focus();
			var sel = document.selection.createRange();
			sel.text = sel.text+str;
		}
		//mozilla++
		else if (text.selectionStart || text.selectionStart === 0) {
			selstart = text.selectionStart;
			selend = text.selectionEnd;
			var start = text.value.substring(0, text.selectionStart);
			var end = text.value.substring(text.selectionEnd);
			var atext = text.value.substring(text.selectionStart,text.selectionEnd);
			text.value = start +  atext + str + end ;
		} else {
			text.value += str;
		}
		div.innerHTML = text.value;
		if(selstart !== false){
			text.focus();
			text.setSelectionRange(selstart ,selend + str.length);
		}
	}

	
	editDiv.style.border = "solid #0000FF 1px";
	editDiv.style.padding = '0.5%';
	button = document.createElement('button');
	button.appendChild(document.createTextNode('<h1>'));
	button.title = 'insert XL Head';
	button.onclick = function(){modifySelected('<h1>');};
	editDiv.appendChild(button);
	button = document.createElement('button');
	button.appendChild(document.createTextNode('<h2>'));
	button.title = 'insert L Head';
	button.onclick = function(){modifySelected('<h2>');};
	editDiv.appendChild(button);
	button = document.createElement('button');
	button.appendChild(document.createTextNode('<h3>'));
	button.title = 'insert M Head';
	button.onclick = function(){modifySelected('<h3>');};
	editDiv.appendChild(button);
	button = document.createElement('button');
	button.appendChild(document.createTextNode('<h4>'));
	button.title = 'insert S Head';
	button.onclick = function(){modifySelected('<h4>');};
	editDiv.appendChild(button);
	button = document.createElement('button');
	button.appendChild(document.createTextNode('<h5>'));
	button.title = 'insert XS Head';
	button.onclick = function(){modifySelected('<h5>');};
	editDiv.appendChild(button);

	button = document.createElement('button');
	button.type = button;
	button.appendChild(document.createTextNode('<i>'));
	button.title = 'italic';
	button.onclick = function(){modifySelected('<i>');};
	editDiv.appendChild(button);
	button = document.createElement('button');
	button.type = button;
	button.appendChild(document.createTextNode('<b>'));
	button.title = 'bold';
	button.onclick = function(){modifySelected('<b>');};
	editDiv.appendChild(button);
	button = document.createElement('button');
	button.type = button;
	button.appendChild(document.createTextNode('<i>'));
	button.title = 'italic';
	button.onclick = function(){modifySelected('<i>');};
	editDiv.appendChild(button);
	button = document.createElement('button');
	button.type = button;
	button.appendChild(document.createTextNode('<u>'));
	button.title = 'underline';
	button.onclick = function(){modifySelected('<u>');};
	editDiv.appendChild(button);
	button = document.createElement('button');
	button.type = button;
	button.appendChild(document.createTextNode('<strike>'));
	button.title = 'striketrough';
	button.onclick = function(){modifySelected('<strike>');};
	editDiv.appendChild(button);
	button = document.createElement('button');
	button.type = button;
	button.appendChild(document.createTextNode('<pre>'));
	button.title = 'RAW text field';
	button.onclick = function(){modifySelected('<pre>');};
	editDiv.appendChild(button);
	button = document.createElement('button');
	button.type = button;
	button.appendChild(document.createTextNode('<br>'));
	button.title = 'break line, also [shift][enter]';
	button.onclick = function(){modifySelected('<br>');};
	editDiv.appendChild(button);
	
	button = document.createElement('button');
	button.type = button;
	button.appendChild(document.createTextNode('<a>'));
	button.title = 'hyperlink, put url in "" ,put visible text between ><';
	button.onclick = function(){modifySelectedA();};
	editDiv.appendChild(button);

	button = document.createElement('button');
	button.type = button;
	button.appendChild(document.createTextNode('<'));
	button.title = 'include lt';
	button.onclick = function(){insertBeforeSelected('&lt;');};
	editDiv.appendChild(button);
	button = document.createElement('button');
	button.type = button;
	button.appendChild(document.createTextNode('>'));
	button.title = 'include lt';
	button.onclick = function(){insertAfterSelected('&gt;');};
	editDiv.appendChild(button);

	

	publishButton = document.createElement('button');
	publishButton.type = button;
	publishButton.style.float = 'right';
	publishButton.appendChild(document.createTextNode('Publish'));
	publishButton.title = 'Publish this page';
	publishButton.onclick = function(){
		div.innerHTML = text.value; // cause the button is for the edit field
		te.onPublish(topic, div.innerHTML);
	};
	editDiv.appendChild(publishButton);

	button = document.createElement('button');
	button.type = button;
	button.style.float = 'right';
	button.appendChild(document.createTextNode('Preview'));
	button.title = 'Update preview, also dblclick';
	button.onclick = function(){
		div.innerHTML = text.value;
	};
	editDiv.appendChild(button);

	button = document.createElement('button');
	button.type = button;
	button.style.float = 'right';
	button.appendChild(document.createTextNode('Cancel'));
	button.title = 'Cancel all fresh edits on this page';
	editDiv.appendChild(button);

	button = document.createElement('button');
	button.type = button;
	button.style.float = 'right';
	button.appendChild(document.createTextNode('^'));
	button.title = 'Move editor above preview';
	button.onclick = function(e){
		var butt = e.target;
		if(butt.innerText === '^'){
			var adiv = div, ediv = editDiv;
			butt.removeChild(butt.firstChild);
			button.appendChild(document.createTextNode('v'));
			button.title = 'Move editor beneth preview';
			editDiv.parentNode.insertBefore(editDiv,div);
		}else{
			butt.removeChild(butt.firstChild);
			button.appendChild(document.createTextNode('^'));
			button.title = 'Move editor above preview';
			editDiv.parentNode.insertBefore(div,editDiv);
		}
	};
	editDiv.appendChild(button);
	
	
	
	text = document.createElement('textarea');
	text.style.width = '99%'; 
	text.style.height = '400px';
	if(div.innerHTML.indexOf(tinyNoTopicDiv) === -1){
		text.value = div.innerHTML;
	}
	editDiv.appendChild(text);

	var shiftKey = 0, ctrlKey = 0;
	text.onkeydown = function (e){
		if(e.keyCode === 13 && shiftKey === 16){
			insertText('<br>');
			//e.preventDefault();
		}
		if(e.keyCode === 16){
			shiftKey = e.keyCode;
		}else{
			if(e.keyCode === 17){
				ctrlKey = e.keyCode;
			}
		}
		console.log('key:'+ e.keyCode);
	};
	text.onkeyup = function (e){
		if(e.keyCode === 16){
			shiftKey = 0;
		}else{
			if(e.keyCode === 17){
				ctrlKey = 0;
			}
		}
		console.log('key up:'+ e.keyCode);
	};
	
	text.ondblclick = function(){
		div.innerHTML = text.value;
	};

	text.onclick = function(){
		div.innerHTML = text.value;
	};

	
	document.body.appendChild(editDiv);
	
	this.setHint = function(ahint){
		div.innerHTML = tinyNoTopicDiv + ahint + '</div>';
	};

	this.setAuth = function (auth){
		if(auth){
			publishButton.disabled = false;
		}else{
			publishButton.disabled = true;
		}
	};
	
	// status is an obj, if obj.err not present it's ok
	this.setPublishStatus = function(status){
		if(status.err){
			publishButton.style.backgroundColor= 'ORANGE';
		}else{
			publishButton.style.backgroundColor= 'LIME';
		}
	};
	this.setData = function(atopic,html){
		topic = topic;
		div.innerHTML = html;
		text.value = html;
	};

	/* FOR USER TO DEFINE */
	this.onPublish = function(topic,html){
		console.log('user should define onPublish function(html)');
	};
}



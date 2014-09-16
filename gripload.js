var gripload = (function() {

	var defaultOptions = {
		multi: true,
		target: 'upload.php',
		onComplete: function(fileData) {
			alert('upload completed');
		},
		onProgress: function(fileData, percentage) {
			console.log('completed', percentage);
		}
	}

	var tools = {
		// return merged object. obj2 is injected into obj1
		mergeObjects: function(obj1, obj2) {
			for (var attr in obj2) {
				obj1[attr] = obj2[attr];
			}

			return obj1;
		},

		ajax: function(d,e,a,g,h){var b;if("undefined"!==typeof XMLHttpRequest)b=new XMLHttpRequest;else for(var c=["MSXML2.XmlHttp.5.0","MSXML2.XmlHttp.4.0","MSXML2.XmlHttp.3.0","MSXML2.XmlHttp.2.0","Microsoft.XmlHttp"],f=0,l=c.length;f<l;f++)try{b=new ActiveXObject(c[f]);break}catch(m){}c=[];if(a&&a instanceof Object&&0<Object.keys(a).length)for(var k in a)c.push(k+"="+encodeURIComponent(a[k]));c=c.join("&");d=d.toUpperCase();"POST"==d&&a&&0<Object.keys(a).length&&b.setRequestHeader("Content-type","application/x-www-form-urlencoded");"GET"==d&&a&&0<Object.keys(a).length&&(a=e.indexOf("?"),e+=(0<a?"&":"?")+c);b.open(d,e,!0);b.onreadystatechange=function(){4==b.readyState&&(200<=b.status&&299>=b.status?"function"==typeof g&&g(b.responseText):"function"==typeof h&&h(b.responseText))};b.send(c)}
	};

	var uploadBinaryData = function(binaryData) {
		// stopped here. !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
		// split into chuncks and upload one by one
	}

	// read files as binary data
	var readAndUploadFiles = function(evt) {
		var theInput = evt.target;
		if (!theInput || theInput.tagName !== 'INPUT') {
			return false;
		}

		// check that files were selected
		var files = theInput.files;
		if (!files || !files.length) return; 

		// get the user options of the input
		var storedInputData = fileInputs.get(theInput);

		for (var i = 0; file = files[i++];) {
			var reader  = new FileReader();
			reader.onloadend = function() {
				console.log('size', reader.result.length);
				uploadBinaryData(reader.result);
			};
			reader.readAsBinaryString(file);
		}
	};

	// list of inputs type file
	var fileInputs = (function() {
		var storedInputs = [];

		return {
			// add the input to the list and assign 'change' event
			addAndAssign: function(fInput, options) {
				fInput.addEventListener('change', readAndUploadFiles);
				storedInputs.push({
					'input': fInput, 
					'options': options
				});
			},

			// get the stored input record, by the input element
			get: function(fileInput) {
				// find the input in stored inputs
				var storedInputData = null;
				for (var i=0, totalRecords = storedInputs.length; i < totalRecords; i++) {
					if (storedInputs[i].input === fileInput) {
						return storedInputs[i];
					}
				}

				return null;
			},

			// check if the input is already inside
			exists: function(fInput) {
				var found = false;
				storedInputs.every(function(fInput) {
					if (storedInputs.input === fInput) {
						found = true;
						return false;
					}
				});

				return found;
			}
		};
	})();

	var mainFn = function (fileInput, options) {

		// merge with default
		options = tools.mergeObjects(defaultOptions, options);
		
		// register the file input
		if (!fileInputs.exists(fileInput)) {
			fileInputs.addAndAssign(fileInput, options);
		}

	};

	return mainFn;
})();


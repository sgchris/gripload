var gripload = (function() {

	var tools = {
		// return merged object. obj2 is injected into obj1
		mergeObjects: function(obj1, obj2) {
			for (var attr in obj2) {
				obj1[attr] = obj2[attr];
			}

			return obj1;
		},

		// method, url, params, successFn, failureFn
		ajax: function(d,e,b,h,k){var a;if("undefined"!==typeof XMLHttpRequest)a=new XMLHttpRequest;else for(var c=["MSXML2.XmlHttp.5.0","MSXML2.XmlHttp.4.0","MSXML2.XmlHttp.3.0","MSXML2.XmlHttp.2.0","Microsoft.XmlHttp"],g=0,l=c.length;g<l;g++)try{a=new ActiveXObject(c[g]);break}catch(m){}c=[];if(b&&b instanceof Object&&0<Object.keys(b).length)for(var f in b)c.push(f+"="+encodeURIComponent(b[f]));c=c.join("&");"GET"==d&&b&&0<Object.keys(b).length&&(f=e.indexOf("?"),e+=(0<f?"&":"?")+c);a.open(d,e,!0);d=d.toUpperCase();"POST"==d&&b&&0<Object.keys(b).length&&a.setRequestHeader("Content-type","application/x-www-form-urlencoded");a.onreadystatechange=function(){4==a.readyState&&(200<=a.status&&299>=a.status?"function"==typeof h&&h(a.responseText):"function"==typeof k&&k(a.responseText))};a.send(c)}
	};

	var defaultOptions = {
		multi: true,
		target: 'upload.php',
		chunkSize: 10000, // bytes
		onComplete: function(fileData) {
			alert('upload completed');
		},
		onFailure: function() {
			alert('upload failed');
		},
		onProgress: function(fileData, percentage) {
			console.log('progress', percentage);
		}
	}
	
	var uploadBinaryData = function(binaryData, options) {
		// split into chunks and upload one by one
		var size = binaryData.length;
		var totalChunksToUpload = Math.ceil(size / options.chunkSize);
		var currentChunk = 0;
		var uploadToken = null;

		// upload one chunk
		var uploadChunk = function(chunkNumber, chunkContent, callbackFn, failureCallbackFn) {
			tools.ajax('post', options.target, {
				fileName: options.fileName,
				chunkNumber: chunkNumber,
				chunkContent: chunkContent,
				uploadToken: uploadToken,
				size: size,
				last: (totalChunksToUpload == 1),
				chunkSize: options.chunkSize
			}, function(res) {
				try { 
					res = JSON.parse(res); 
				} catch (e) { 
					if (typeof(failureCallbackFn) == 'function') { 
						failureCallbackFn() 
						return;
					}
				}

				if (res && res.result == 'ok' && res.token) {
					// upload local upload token
					uploadToken = res.token;

					if (typeof(callbackFn) == 'function') { 
						callbackFn(res.token);
						return;
					}
				} else {
					if (typeof(failureCallbackFn) == 'function') { 
						failureCallbackFn();
						return;
					}
				}

			}, failureCallbackFn);
		}

		// upload all the chunks, one by one
		var uploadChunks = function(callbackFn, failureCallbackFn) {
			chunkContent = binaryData.substr(currentChunk * options.chunkSize, options.chunkSize);
			uploadChunk(currentChunk++, chunkContent, function() {
				if (--totalChunksToUpload == 0) {
					// upload finished. call the callback
					if (typeof(callbackFn) == 'function') {
						callbackFn();
					}
				} else {
					// upload the next chunk
					uploadChunks(callbackFn, failureCallbackFn);
				}
			}, function() {
				if (typeof(failureCallbackFn) == 'function') {
					failureCallbackFn();
				}
			});
		};

		// perform he upload
		uploadChunks(function() {
			console.log('uploaded successfully!');
		}, function() {
			console.log('failed to upload');
		});
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
			storedInputData.options.fileName = file.name;
			var reader  = new FileReader();
			reader.onloadend = function() {
				uploadBinaryData(reader.result, storedInputData.options, function() {
					storedInputData.onComplete();
				});
			};
			//reader.readAsBinaryString(file);
			reader.readAsDataURL(file);
		}
	};

	// list of inputs type file
	var fileInputs = (function() {
		var storedInputs = [];

		return {
			// add the input to the list and assign 'change' event
			addAndAssign: function(fInput, options) {
				storedInputs.push({
					'input': fInput, 
					'options': options
				});
				fInput.addEventListener('change', readAndUploadFiles);
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


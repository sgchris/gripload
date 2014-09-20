/**
 * check multiple files upload
 */
var gripload = (function() {

	var tools = {
		// return merged object. obj2 is injected into obj1
		mergeObjects: function(obj1, obj2) {
			var mergedObj = {};
			for (var attr in obj1) {
				mergedObj[attr] = obj1[attr];
			}

			for (var attr in obj2) {
				mergedObj[attr] = obj2[attr];
			}
			
			return mergedObj;
		},

		// method, url, params, successFn, failureFn
		ajax: function(d,e,b,h,k){var a;if("undefined"!==typeof XMLHttpRequest)a=new XMLHttpRequest;else for(var c=["MSXML2.XmlHttp.5.0","MSXML2.XmlHttp.4.0","MSXML2.XmlHttp.3.0","MSXML2.XmlHttp.2.0","Microsoft.XmlHttp"],g=0,l=c.length;g<l;g++)try{a=new ActiveXObject(c[g]);break}catch(m){}c=[];if(b&&b instanceof Object&&0<Object.keys(b).length)for(var f in b)c.push(f+"="+encodeURIComponent(b[f]));c=c.join("&");"GET"==d&&b&&0<Object.keys(b).length&&(f=e.indexOf("?"),e+=(0<f?"&":"?")+c);a.open(d,e,!0);d=d.toUpperCase();"POST"==d&&b&&0<Object.keys(b).length&&a.setRequestHeader("Content-type","application/x-www-form-urlencoded");a.onreadystatechange=function(){4==a.readyState&&(200<=a.status&&299>=a.status?"function"==typeof h&&h(a.responseText):"function"==typeof k&&k(a.responseText))};a.send(c)}
	};

	var defaultOptions = {
		target: 'upload.php',
		chunkSize: 100000, // bytes
		onComplete: function(fileData) {
		},
		onFailure: function() {
			console.warn('upload failed')
		},
		onProgress: function(fileData, percentage) {
		}
	}
	
	var uploadBinaryData = function(fileName, binaryData, options, callbackFn, failureCallbackFn) {
		// split into chunks and upload one by one
		var size = binaryData.length;
		var totalChunksToUpload = Math.ceil(size / options.chunkSize);
		var currentChunk = 0;
		var uploadToken = null;

		// upload one chunk
		var uploadChunk = function(chunkNumber, chunkContent, uploadChunkCallbackFn, uploadChunkFailureCallbackFn) {
			tools.ajax('post', options.target, {
				fileName: fileName,
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
					if (typeof(uploadChunkFailureCallbackFn) == 'function') { 
						uploadChunkFailureCallbackFn() 
						return;
					}
				}

				if (res && res.result == 'ok' && res.token) {
					// upload local upload token
					uploadToken = res.token;

					if (typeof(uploadChunkCallbackFn) == 'function') { 
						uploadChunkCallbackFn(res.token);
						return;
					}
				} else {
					if (typeof(uploadChunkFailureCallbackFn) == 'function') { 
						uploadChunkFailureCallbackFn();
						return;
					}
				}

			}, uploadChunkFailureCallbackFn);
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
		uploadChunks(callbackFn, failureCallbackFn);
	};
	
	/**
	 * Manage FileReaders with their options (fileName, options)
	 */
	var fileReaders = (function() {
		
		var readers = [];
		
		var self = {
			add: function(readerObj) {
				if (!self.exists(readerObj.reader)) {
					readers.push(readerObj);
				}
			},
			
			get: function(theFileReader) {
				var foundReaderObj = null;
				readers.forEach(function(readerObj) {
					if (readerObj.reader === theFileReader) {
						foundReaderObj = readerObj;
						return false;
					}
				});
				return foundReaderObj;
			},
			
			exists: function(theFileReader) {
				return (self.get(theFileReader) !== null);
			}
		}
		
	})();

	// read files as binary data
	var readAndUploadFiles = function(theInput) {
		// check that files were selected
		var files = theInput.files;
		if (!files || !files.length) return;

		// get the user options of the input
		var storedInputData = fileInputs.get(theInput);
		
		var totalFilesToUpload = files.length;
		var uploadedFileNames = [];
		
		var readers = {};
		for (var i = 0; file = files[i++];) {
			readers[i] = readers[i] || {};
			readers[i].fileName = file['name'];
			readers[i].reader  = new FileReader();
			readers[i].reader.onloadend = function(event) {
				var theReader = event.target;
				var theFileName = null;
				for (var readerIdx in readers) {
					if (readers[readerIdx].reader === theReader) {
						theFileName = readers[readerIdx].fileName; 
						break;
					}
				}
				if (!theFileName) return;
				uploadedFileNames.push(theFileName);
				uploadBinaryData(theFileName, theReader.result, storedInputData.options, function() {
					// success. if this is the last file, call the callback
					if (--totalFilesToUpload == 0 && typeof(storedInputData.options.onComplete) == 'function') {
						storedInputData.options.onComplete(uploadedFileNames);
					}
				}, function() {
					// failure
					if (typeof(storedInputData.options.onFailure) == 'function') {
						storedInputData.options.onFailure(storedInputData.options.fileName);
					}
				});
			};
			readers[i].reader.readAsDataURL(file);
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
				fInput.addEventListener('change', function(event) {
					readAndUploadFiles(event.target);
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
		
		if (!fileInput || !fileInput.tagName == 'INPUT') {
			console.error('supplied bad file input to `gripload`');
			return false;
		}

		// merge with default
		options = tools.mergeObjects(defaultOptions, options);
		
		// register the file input
		if (!fileInputs.exists(fileInput)) {
			fileInputs.addAndAssign(fileInput, options);
		}

	};

	return mainFn;
})();


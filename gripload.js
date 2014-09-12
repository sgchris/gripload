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
				obj1[attr] = obj[attr];
			}

			return obj1;
		}
	};

	var mainFn = function (fileInput, options) {
		var files = fileInput.files;
		if (!files || !files.length) return; 

		for (var i = 0, filesCount = files.length, file = files[i]; i < filesCount; i++) {
			var reader  = new FileReader();
			reader.onloadend = function() {
				console.log('size', reader.result.length);
				console.log('reader.result', reader.result);
			};
			reader.readAsBinaryString(file);
		}
	};

	return mainFn;
})();


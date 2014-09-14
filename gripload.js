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
		}
	};

	var uploadFiles = function(evt) {
		var theInput = evt.target;
		if (!theInput || theInput.tagName !== 'INPUT') {
			return false;
		}
		/*
		var files = fileInput.files;
		if (!files || !files.length) return; 

		for (var i = 0; file = files[i++];) {
			var reader  = new FileReader();
			reader.onloadend = function() {
				console.log('size', reader.result.length);
				console.log('reader.result', reader.result);
			};
			reader.readAsBinaryString(file);
		}
		*/
	};

	var fileInputs = (function() {
		var storedInputs = [];

		return {
			// add the input to the list and assign 'change' event
			addAndAssign: function(fInput, options) {
				fInput.addEventListener('change', uploadFiles);
				storedInputs.push({
					'input': fInput, 
					'options': options
				});
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


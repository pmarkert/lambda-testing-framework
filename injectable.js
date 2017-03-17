var real_require = require;
var path = require("path");

module.exports = function(requirer_path, mocks_path) {
	var mocks_path = path.join(requirer_path, mocks_path);
	return {
		require: function require(module_name, instance) {
			if(global.TEST_MODE) {
				return real_require(path.join(mocks_path, module_name));
			}
			else {
				return instance || real_require(adjust_module_path(module_name));
			}
		}
	}

	function adjust_module_path(module_name) {
		if(!module_name.startsWith(".")) {
			return module_name;
		}
		return path.join(requirer_path, module_name);
	}
}

var real_require = require;
var path = require("path");

module.exports = function(base_path, relative_path) {
	if(relative_path) base_path = path.join(base_path, relative_path);
	return {
		require: function require(module_name, instance) {
			if(global.TEST_MODE) {
				return real_require(path.join(base_path, module_name));
			}
			else {
				return instance || real_require(module_name);
			}
		}
	}
}

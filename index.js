const mock_context = require('aws-lambda-mock-context');
const async = require("async");
const chai = require("chai").should();
const path = require("path");
const fs = require("fs");
global.TEST_MODE = true;

module.exports = function(method_under_test, path_to_tests, done) {
	async.each(fs.readdirSync(path_to_tests), function(filename) {
		if(filename.endsWith(".json") && !filename.endsWith(".response.json")) {
			it(filename, function (testcase_done) {
				const file_content = JSON.parse(fs.readFileSync(path.join(path_to_tests, filename)));
				const context = mock_context();
				method_under_test(file_content, context);
				context.Promise.then(response => {
					try {
						const response_filename = path.join(path_to_tests, filename.substring(0,filename.lastIndexOf(".")) + ".response.json");
						if(!fs.existsSync( response_filename)) {
							if(process.env.SAVE_RESPONSES) {
								fs.writeFileSync(response_filename, JSON.stringify(response, null, 2));
								console.log(`Response for ${response_filename} saved.`);
							} else {
								console.log(`Response for ${response_filename} does not exist:`);
								console.log(JSON.stringify(response, null, 2));
							}
							return testcase_done(`Response file ${response_filename} does not exist yet.`);
						}
						const expected_response = JSON.parse(fs.readFileSync(response_filename));
						response.should.deep.equal(expected_response);			
						return testcase_done();
					}
					catch(err) {
						return testcase_done(err);
					}
				})
				.catch(testcase_done);
			});
		}
	}, done);
}

const mock_context = require('aws-lambda-mock-context');
const Promise = require("bluebird");
const path = require("path");
const fs = require("fs");
const chai = require("chai").should();
global.TEST_MODE = process.env.TEST_MODE=="true" || process.env.TEST_MODE==null;

module.exports = function(method_under_test, path_to_tests, expect_failure, pre_execute, validation_hook) {
	var filenames = fs.readdirSync(path_to_tests);
	return Promise.all(filenames.map(filename => {
		if(filename.endsWith(".request.json")) {
			return it(path.basename(filename, ".request.json"), () => {
				const testcase_filename = path.join(path_to_tests, filename);
				var file_content = JSON.parse(fs.readFileSync(path.join(path_to_tests, filename)));
				const context = mock_context();
				var promise;
				if(pre_execute) {
					var updated_content= pre_execute(file_content);
					if(updated_content!=null) {
						file_content = updated_content;
					}
				}
				method_under_test(file_content, context, context.done);
				return context.Promise.then(response => {
					if(expect_failure) {
						throw new Error("Test case should have failed, but instead succeeded - " + JSON.stringify(response, null, 2)); 
					}
					if(validation_hook) {
						return validation_hook(null, response, request);
					}
					else {
						return matches_expected_response(response, testcase_filename);
					}
				}, err => {
					if(!expect_failure) {
						throw err;
					}
					if(validation_hook) {
						return validation_hook(err, null, request);
					}
					else {
						return matches_expected_response(err.message, testcase_filename);
					}
				});
			});
		}
	}));
}

module.exports.injectable = require("./injectable");

function matches_expected_response(response, testcase_filename) {
	var expected_response;
	var response_filename = testcase_filename.replace(/\.request\.json$/,".response.pattern");
	if(!fs.existsSync(response_filename)) {
		response_filename = testcase_filename.replace(/\.request\.json$/,".response.json")
		if(!fs.existsSync(response_filename)) {
			if(process.env.SAVE_RESPONSES) {
				fs.writeFileSync(response_filename, JSON.stringify(response, null, 2));
				console.log(`Response for ${response_filename} saved.`);
			} else {
				console.log(`Response for ${response_filename} does not exist:`);
				console.log(JSON.stringify(response));
			}
			throw new Error(`Response file ${response_filename} does not exist yet.`);
		}
		else {
			expected_response = JSON.parse(fs.readFileSync(response_filename));
			response.should.deep.equals(expected_response);
		}
	}
	else {
		response = response.stack ? response.toString() : JSON.stringify(response, null, 2);
		expected_response = fs.readFileSync(response_filename, 'utf-8').trim();
		if(!response.match(expected_response)) {
			throw new Error("Response did not match expected pattern - " + response);
		}
	}
}

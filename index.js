const mock_context = require('aws-lambda-mock-context');
const Promise = require("bluebird");
const path = require("path");
const fs = require("fs");
const chai = require("chai").should();
global.TEST_MODE = true;

module.exports = function(method_under_test, path_to_tests, expect_failure, post_validate, pre_execute) {
	var filenames = fs.readdirSync(path_to_tests);
	return Promise.all(filenames.map(filename => {
		if(filename.endsWith(".request.json")) {
			return it(path.basename(filename, ".request.json"), () => {
				const testcase_filename = path.join(path_to_tests, filename);
				const file_content = JSON.parse(fs.readFileSync(path.join(path_to_tests, filename)));
				const context = mock_context();
				var promise;
				if(pre_execute) {
					pre_execute(file_content);
				}
				method_under_test(file_content, context, context.done);
				return context.Promise.then(response => {
					if(expect_failure) {
						throw new Error("Test case should have failed, but instead succeeded - " + JSON.stringify(response, null, 2)); 
					}
					return matches_expected_response(response, testcase_filename, post_validate);
				}, err => {
					if(!expect_failure) {
						throw err;
					}
					return matches_expected_response(err.message, testcase_filename, post_validate);
				});
			});
		}
	}));
}

function matches_expected_response(response, testcase_filename, post_validate) {
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
			if(post_validate) {
				return post_validate(testcase_filename);
			}
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

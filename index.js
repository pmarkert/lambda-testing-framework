const mock_context = require('aws-lambda-mock-context');
const Promise = require("bluebird");
const path = require("path");
const fs = require("fs");
const chai = require("chai").should();

module.exports = function(method_under_test, path_to_tests, expect_failure, pre_execute, validate) {
	var filenames = fs.readdirSync(path_to_tests);
	return Promise.all(filenames.map(filename => {
		if(filename.endsWith(".request.json")) {
			return it(path.basename(filename, ".request.json"), () => {
				const testcase_filename = path.join(path_to_tests, filename);
				var request = JSON.parse(fs.readFileSync(path.join(path_to_tests, filename)));
				const context = mock_context();
				var promise;
				if(pre_execute) {
					var updated_content= pre_execute(request);
					if(updated_content!=null) {
						request = updated_content;
					}
				}
				method_under_test(request, context, context.done);
				return context.Promise.then(response => {
					if(expect_failure) {
						throw new Error("Test case should have failed, but instead succeeded - " + JSON.stringify(response, null, 2)); 
					}
					if(validate) {
						return validate(null, response, request, testcase_filename);
					}
					else {
						return matches_expected_response(response, testcase_filename);
					}
				}, err => {
					if(!expect_failure) {
						throw err;
					}
					if(validate) {
						return validate(err, null, request, testcase_filename);
					}
					else {
						return matches_expected_response(err.message, testcase_filename);
					}
				});
			});
		}
	}));
}

module.exports.matches_expected_response = matches_expected_response;

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

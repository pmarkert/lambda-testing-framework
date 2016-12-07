const mock_context = require('aws-lambda-mock-context');
const async = require("async");
const path = require("path");
const fs = require("fs");
const chai = require("chai").should();
global.TEST_MODE = true;

module.exports = function(method_under_test, path_to_tests, done, expect_failure) {
	async.each(fs.readdirSync(path_to_tests), function(filename) {
		if(filename.endsWith(".request.json")) {
			it(filename, function (testcase_done) {
				const testcase_filename = path.join(path_to_tests, filename);
				const file_content = JSON.parse(fs.readFileSync(path.join(path_to_tests, filename)));
				const context = mock_context();
				method_under_test(file_content, context);
				context.Promise.then(response => {
					if(expect_failure) {
						return testcase_done("Test case should have failed, but instead succeeded - " + JSON.stringify(response, null, 2)); 
					}
					matches_expected_response(response, testcase_filename, testcase_done);
				})
				.catch(err => {
					if(!expect_failure) {
						return testcase_done(err);
					}
					matches_expected_response(err.message, testcase_filename, testcase_done);
				});
			});
		}
	}, done);
}

function matches_expected_response(response, testcase_filename, testcase_done) {
	try {
		var expected_response;
		var response_filename = testcase_filename.replace(/\.request\.json$/,".response.pattern");
		if(!fs.existsSync(response_filename)) {
			response_filename = testcase_filename.replace(/\.request\.json$/,".response.json")
			if(!fs.existsSync(response_filename)) {
				if(process.env.SAVE_RESPONSES) {
					fs.writeFileSync(response_filename, response);
					console.log(`Response for ${response_filename} saved.`);
				} else {
					console.log(`Response for ${response_filename} does not exist:`);
					console.log(JSON.stringify(response));
				}
				return testcase_done(`Response file ${response_filename} does not exist yet.`);
			}
			else {
				expected_response = JSON.parse(fs.readFileSync(response_filename));
				response.should.deep.equals(expected_response);
				testcase_done();
			}
		}
		else {
			response = response.stack ? response.toString() : JSON.stringify(response, null, 2);
			expected_response = fs.readFileSync(response_filename, 'utf-8').trim();
			if(response.match(expected_response)) {
				return testcase_done();
			}
			else {
				return testcase_done("Response did not match expected pattern - " + response);
			}
			
		}
	} catch(err) {
		testcase_done(err);
	}
}

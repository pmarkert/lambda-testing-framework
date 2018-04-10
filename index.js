const _ = require("lodash");
const mock_context = require('aws-lambda-mock-context');
const Promise = require("bluebird");
const path = require("path");
const fs = require("fs");
const chai = require("chai").should();

const REQUEST_EXTENSION = ".request.json";
const RESPONSE_EXTENSION_JSON = ".response.json";
const RESPONSE_EXTENSION_PATTERN = ".response.pattern";

module.exports = function(method_under_test, options) {
	if(_.isString(options)) {
		options = { path: options };
	}
	return _.chain(fs.readdirSync(options.path))
		.filter(isTestCase)
		.map(extractTestCaseName)
		.map(_.partial(processTestCase, method_under_test, options))
		.value();
}

function isTestCase(filename) {
	return filename.endsWith(REQUEST_EXTENSION);
}

function extractTestCaseName(filename) {
	return filename.substr(0, filename.length - REQUEST_EXTENSION.length);
}

function loadRequest(test_case, options) {
	return JSON.parse(fs.readFileSync(path.join(options.path, test_case + REQUEST_EXTENSION)));
}

function processTestCase(method_under_test, options, test_case) {
	return it(test_case, function() {
		const request = loadRequest(test_case, options);

		// Pre-processing
		var promise = Promise.resolve(request);
		if(options.before) {
			promise = Promise.resolve(options.before(request, test_case, options))
				.then(result => request);
		}

		// Execute the test
		const context = mock_context();
		return promise.then(request => {
			method_under_test(request, context, context.done);
			return context.Promise;
		}).then(
			response => processResults(null, response, request, options, test_case)
		,	error => processResults(error, null, request, options, test_case)
		);
	});
}

function processResults(error, response, request, options, test_case) {
	if(options.after) {
		return Promise.resolve(options.after(error, response, request, test_case, options, validateResponse));
	}
	return validateResponse(null, response, request, test_case, options);
}

function validateResponse(error, response, request, test_case, options) {
	if(error && !options.errorExpected) {
		throw error;
	}
	else if(!error && options.errorExpected) {
		throw new Error("Test case should have thrown an error, but instead succeeded - " + JSON.stringify(response, null, 2)); 
	}
	return matchesExpectedResponse(error, response, test_case, options);
}

function matchesExpectedResponse(error, response, test_case, options) {
	var json_response_filename = path.join(options.path, test_case + RESPONSE_EXTENSION_JSON);
	var pattern_response_filename = path.join(options.path, test_case + RESPONSE_EXTENSION_PATTERN);
	if(fs.existsSync(pattern_response_filename)) {
		return matches_pattern(error, response, pattern_response_filename, options);
	}
	else if(fs.existsSync(json_response_filename) || process.env.SAVE_RESPONSES) {
		return matches_json(error, response, json_response_filename, options);
	}
	else {
		var printable_response = _.isError(error) ? error.toString() : JSON.stringify(error | response, null, 2);
		console.error("No response_file exists for test case. Response was " + printable_response);
		throw new Error(`Test case response file ${json_response_filename} or ${pattern_response_filename} does not exist yet.`);
	}
}

function matches_json(error, response, json_response_filename, options) {
	if(!fs.existsSync(json_response_filename)) {
		fs.writeFileSync(json_response_filename, JSON.stringify(response, null, 2));
		console.log(`Response for ${json_response_filename} saved.`);
	}
	else {
		var expected = JSON.parse(fs.readFileSync(json_response_filename));
		if(!_.isNull(error)) {
			if(expected.message) {
				return error.message.should.deep.equals(expected.message);
			}
			else {
				// TODO - Add other json validation properties for errors
				throw new Error("No validatable properties found in the json response file to validate error");
			}
		}
		else {
			return response.should.deep.equals(expected);
		}
	}
}

function matches_pattern(error, response, pattern_response_filename, options) {
	var expected = fs.readFileSync(pattern_response_filename, 'utf-8').trim();
	var actual = _.isError(error) ? error.toString() : JSON.stringify(error || response, null, 2);
	return actual.should.match(new RegExp(expected));
}

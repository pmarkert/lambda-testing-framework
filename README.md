# lambda-testing-framework

Unit testing framework for testing requests/responses for Amazon Lambda functions and Alexa skills

The Lambda Testing Framework is a nice way to perform unit testing for AWS Lambda functions and Amazon Alexa skills. 

This framework uses a data-driven approach. You create sample *.json files to represent the requests that should be sumitted to the skill.handler under test. The tester loads the request file, invokes the skill handler, and then compares the response to the contents of a matching *.response.json file.

Lambda Testing Framework depends upon mocha.

To use the Lambda Testing Framework follow these steps:

1. Install Lambda Testing Framework as a devDependency.
    `npm install -D mocha alexa-skill-tester`
2. Create a test directory with a bootstrap module in it (test/index.js perhaps)
    ```javascript
    var ltf = require("lambda-testing-framework");
    var path = require("path");
    var module_under_test = require("../index");

    describe("Event tests", () => ltf(module_under_test.handler, path.resolve(__dirname, "./events"));
    ```
3. Create a "test/events" directory sub-directory.
4. Place requests .json files in the ./tests/events folder.
5. Setup your package.json with

    ```json
    "scripts": {
      "test": "mocha"
    }
    ```

    and run it with `npm test`

At this point, you should see an error telling you that the response file does not exist. You can either create the response file manually and save it as *.response.json or you can instruct alexa-skill-tester to auto-save the responses for you.

```
$ SAVE_RESPONSES=true npm test
```

You will still get warnings the first time, however, the process will save the response into the right location so that when you run the tests again, they should all pass.

The lambda-testing-framework will set a global variable `global.TEST_MODE=true` when it runs your tests so that your application can choose to mock out other dependencies as necessary.

## API
module.exports = function(method_under_test, path_to_tests, expect_failure, pre_execute_hook, validation_hook) 
module.exports.matches_expected_response = function(response, request_filepath)

* method_under_test - lambda handler function(event, context, callback). It will be called and passed the json contents of your and a mock lambda context object.
* path_to_tests - path to the directory in which to look for *.request.json files to be tested
* expect_failure - boolean flag to indicate that the result should expect an exception to be thrown.
* pre_execute_hook - function(request) can analyze the request object and perform setup tasks. Can also modify and return the request before it is passed to the handler.
* validation_hook - function(err, response, request, request_filepath) - Validation hook to be called (instead of the default checks).

### Notes
If the validation_hook is provided, then the default behavior (to check and match the response against a corresponding .response.json or a .response.pattern file) will be bypassed. If you want to maintain the normal check in addition to your own validation, call the matches_expected_response method passing in the response and request_filepath values.

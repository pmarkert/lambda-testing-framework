# lambda-testing-framework

Unit testing framework for testing requests/responses for Amazon Lambda functions including Alexa skills

The Lambda Testing Framework is a nice way to perform unit testing for AWS Lambda functions and Amazon Alexa skills. 

This framework uses a data-driven approach. You create test-cases in a folder with `*.request.json` files to represent the requests that should be sumitted to the lambda function under test. The testing framework loads the request data, invokes the handler, and then compares the response to the contents of a matching `*.response.json` file.

Lambda Testing Framework depends upon mocha.

To get started with the Lambda Testing Framework follow these steps:

1. Install lambda-testing-framework as a devDependency.
    `npm install -D mocha lambda-testing-framework`
2. Create a `test` directory with a bootstrap module in it (let's call it `index.js`)
    ```javascript
    const path = require("path");
    const ltf = require("lambda-testing-framework");

    const method_under_test = require("../index").handler; // Reference to the handler function for your lambda

    describe("Event tests", () => ltf(method_under_test, path.resolve(__dirname, "events")));
    ```
3. Create a `test/events` sub-directory.
4. Place `*.requests.json` files in the ./tests/events folder.
5. Setup your package.json to run tests with:

    ```json
    "scripts": {
      "test": "mocha"
    }
    ```

    and then run it with `npm test` or `npm test debug`.

At this point, you will see an error indicating that the response file does not exist yet. You can create the response file manually and save it as `*.response.json` or you can instruct lambda-testing-framework to automatically save a snapshot of the response for you by using the results of any calls as the baseline..

```
$ SAVE_RESPONSES=true npm test
```

You will still get warnings when generating the saved responses, however, the process will save the response into the right location so that when you run the tests again, they should all pass.

## API
```javascript
// Executes all test cases in the 'path_to_tests' directory
module.exports = function(method_under_test, options) 
module.exports.matches_expected_response = function(response, request_filepath)
```

* method_under_test - The lambda handler function(event, context, callback) you are testing.
* path_to_tests - path to the directory containing the test cases
* expect_failure - boolean flag to indicate that test case should expect an error to be thrown.
* pre_execute_hook - function(request, test_case_name) can be used to analyze/modify the request object before processing the test case and perform any additional test case setup tasks.
* validation_hook - function(err, response, request, test_case_name) - Validation hook to be called (instead of the default checks).

### Notes
If the validation_hook is provided, then the default behavior (to check and match the response against a corresponding .response.json or a .response.pattern file) will be bypassed. If you want to maintain the normal check in addition to your own validation, call the matches_expected_response method passing in the response and request_filepath values.

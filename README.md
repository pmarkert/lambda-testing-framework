# lambda-testing-framework
Unit testing framework for testing requests/responses for Amazon Lambda functions (including Amazon Alexa skills)

Lambda Testing Framework depends upon [https://mochajs.org/](mocha).

## Summary
The lambda-testing-framework is an easy way to perform unit testing for AWS Lambda functions and Amazon Alexa skills by automatically generating mocha test-cases with response validation from a directory of static .json files. 

lambda-testing-framework framework uses a data-driven static files approach. You create test-cases in a directory with `*.request.json` files to represent the event data that should be sumitted to the lambda function under test. The testing framework loads the event/request data, invokes your handler, and then compares the handler's response to the contents of a matching `*.response.json` file.

## Getting Started

1. Install lambda-testing-framework as a devDependency.
    `npm install -D lambda-testing-framework`
2. Create a `test` directory with the test-driver in it (let's call it `index.js`)
    ```javascript
    const path = require("path");
    const method_under_test = require("../index").handler; // the handler function you are testing

    const test = require("lambda-testing-framework");
    describe("Event tests", () => test(method_under_test, { path: path.resolve(__dirname, "events") }));
    ```
3. Create a `test/events` sub-directory.
4. Place some `*.requests.json` files in the ./tests/events folder.
5. Place matching `*.response.json` files in the same folder.
6. Setup your package.json to run the tests with:
    ```json
    "scripts": {
      "test": "mocha"
    }
    ```

    and then run them with `npm test` or `npm test debug`.

## Requests and Responses
It can be tedious to build the input .request.json files by hand, especially if your function handles API Gateway requests. I find it convenient to copy/paste request events from CloudWatch logs.

As an alternative to building the .response.json files by hand, you can allow lambda-testing-framework to save missing response files automatically to create a baseline. To do this, add `saveMissingResponses: true` to the options object. HINT: I typically have my test/index.js check for the existence of some environment variable to toggle this property.

    ```javascript
    // ...
    options.saveMissingResponses = process.env.SAVE_RESPONSES==="true";
    // ...
    ```
Then run it with
    ```
    $ SAVE_RESPONSES=true npm test
    ```

## API
```javascript
// Executes all *.request.json test cases in the options.path directory
module.exports = function(method_under_test, options) 
```

* method_under_test - The lambda handler function(event, context, callback) you are testing.
* options.path - path to the directory containing the test cases
* options.errorExpected - boolean flag to indicate that test case should expect an error to be thrown (in the future, this value may allow for specific errors to be matched)
* before - function(request, test_case_name, options) : hook that is called before the test is executed
* after - function(error, response, request, test_case_name, options, validate) - hook that is called after the test is executed, but before validation

### The `options.before` Hook
The `options.before` hook allows you to provide a custom function that can be used to perform setup tasks or to modify the request object before it is submited for testing. The function must either return the request object or a promise that resolves to the request object. The returned request object will be used for the test, so you can apply custom transformations to the request before processing.

### The `options.after` Hook
The `options.after` hook can be used to perform custom validation on the error/response, or to modify the error/response before passing on to the normal validation routine. The `options.after` function may return a promise. The function should throw an error if the response/error fails your custom validation. The built-in validation routine is provided as the last parameter if you decide to invoke it to perform the normal validation. The built-in validation function takes the same parameters as the `options.after` hook and returns a promise.

### Example use of `options.after` w/validation chaining
```javascript
function after_hook(error, response, request, test_case_name, options, validate) {
	// Do some custom validation on the response or error objects and
	// throw new Error("If the validation fails.");

        // or you can modify the response/error objects to clear out non-deterministic values (such as datestamps, or unique-ids)
	// before passing on to the default validation routine which compare the results to a static response.

	// Call the built-in validation if you want to keep the built-in response checking.
	return validate(error, response, request, test_case_name, options);
}
```

## Response Validation
### `*.response.json`
Matches the Lambda response against the provided .json object.

### `*.response.pattern`
Matches the JSON serialized value of the Lambda response against the provided regex pattern. The file content is read in as the pattern and default options are used.

### `*.response.js`
A module that exports a javascript function that will be invoked with the same interface/requirements as the `options.after` hook (minus the final `validate` parameter).

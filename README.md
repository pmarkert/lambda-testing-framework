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
describe("Event tests", () => {
	return ltf(

    describe("Event tests", () => ltf(module_under_test.handler, path.resolve(__dirname, "./events"));
    ````
3. Create a "test/events" directory sub-directory.
4. Place requests .json files in the ./tests/events folder.
5. From the top-level directory of the project execute mocha
    ```
    $ node_modules/.bin/mocha
    ```

At this point, you should see errors telling you that no response files were available. You can either create the response file manually and save it as *.response.json or you can instruct alexa-skill-tester to auto-save the responses for you.

```
$ SAVE_RESPONSES=true node_modules/.bin/mocha
```

You will still get warnings the first time, however, the process will save the response into the right location so that when you run the tests again, they should all pass.

The lambda-testing-framework will set a global variable `global.TEST_MODE=true` when it runs your tests so that your application can choose to mock out other dependencies as necessary.

## Tips
I like to setup a sub-directory for each state supported by the Alexa skill I'm testing so that I can separate the events into those sub-directories.

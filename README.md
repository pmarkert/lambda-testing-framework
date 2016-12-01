# alexa-skill-tester
Unit testing framework for testing requests/responses for Amazon Alexa skills

The Alexa Skill Tester is a nice way to perform unit testing for Amazon Alexa skills that run in AWS lambda. 

This framework uses a data-driven approach. You create sample *.json files to represent the requests that should be sumitted to the skill.handler under test. The tester loads the request file, invokes the skill handler, and then compares the response to the contents of a matching *.response.json file.

To use the skill-tester follow these steps:
1. Install mocha (a popular unit-testing framework) and alexa-skill-tester as devDependencies.
    `npm install -D mocha alexa-skill-tester`
2. Create a ./test directory with a bootstrap module in it
    ```javascript
    var ast = require("alexa-skill-tester");
    var path = require("path");
    var module_under_test = require("../index");

    describe("Event tests", function(done) {
        ast(module_under_test.handler, path.resolve(__dirname, "./events"), done);
    });
    ````
3. Create a "./events" directory underneath the test directory.
4. Place requests .json files in the ./tests/events folder.
5. From the top-level directory of the project execute mocha
    ```
    $ node_modules/.bin/mocha
    ```

At this point, you should see errors telling you that no response files were available. You can either create the response file manually and save it as *.response.json or you can instruct alexa-skill-tester to auto-save the responses for you.

```
$ SAVE_RESPONSES=true node_modules/.bin/mocha
```

You will still get warnings the first time, however, the process wil save the response into the right location so that when you run the tests again, they should all pass.

The alexa-skill-tester will sets a global variable `global.TEST_MODE=true` when it runs your tests so that your application can choose to mock out other dependencies as necessary.

## Tips
I like to setup a sub-directory for each state supported by the Alexa skill I'm testing so that I can separate the events into those sub-directories.

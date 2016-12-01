const context = require('aws-lambda-mock-context');
const async = require("async");
const chai = require("chai").should();
const path = require("path");
const fs = require("fs");
global.TEST_MODE = true;

module.exports = function(method_under_test) {
	describe("Event processing:", function(done) {
		async.each(fs.readdirSync("./test/events"), function (dirname, dir_cb) {
			if(fs.lstatSync(path.join("./test/events", dirname)).isDirectory()) {
				describe("State:" + dirname, function() {
					async.each(fs.readdirSync(path.resolve(__dirname, path.join("events", dirname))), function(filename) {
						if(!filename.endsWith(".response.json")) {
							it("Case:" + filename, function (event_done) {
								const file_content = require("./" + path.join("events", dirname, filename));
								const ctx = context();
								method_under_test(file_content, ctx);
								ctx.Promise.then(response => {
									try {
										const response_filename = path.join("events", dirname, filename.substring(0,filename.length - 5) + ".response.json");
										if(!fs.existsSync(path.resolve(__dirname, response_filename))) {
											if(process.env.SAVE_RESPONSES) {
												fs.writeFileSync(path.resolve(__dirname, response_filename), JSON.stringify(response, null, 2));
												console.log(`Response for ${response_filename} saved.`);
											} else {
												console.log(`Response for ${response_filename} does not exist:`);
												console.log(JSON.stringify(response, null, 2));
											}
											return event_done(`Response file ${response_filename} does not exist yet.`);
										}
										const expected_response = require("./" + response_filename);
										response.should.deep.equal(expected_response);			
										return event_done();
									}
									catch(err) {
										return event_done(err);
									}
								})
								.catch(event_done);
							});
						}
					}, dir_cb);
				});
			}
			else { dir_cb(); }
		}, done);
	});
}

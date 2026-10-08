import assert from "node:assert/strict";
import { mayServePhoto } from "./fieldservice_workflow.js";

assert.equal(mayServePhoto({ dispatchStatus: "en_route", followUp: "Call before arrival" }), true);
assert.equal(mayServePhoto({ dispatchStatus: "completed", followUp: "Archive photo" }), false);
assert.equal(mayServePhoto({ dispatchStatus: "assigned", followUp: "   " }), false);
console.log("field-service photo access decisions pass");

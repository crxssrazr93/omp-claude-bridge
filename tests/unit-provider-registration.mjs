import test from "node:test";
import assert from "node:assert/strict";

import { shouldRegisterProvider } from "../src/provider-registration.ts";

const own = () => {};

test("first activation registers", () => {
	assert.equal(shouldRegisterProvider(undefined, own), true);
	assert.equal(shouldRegisterProvider(null, own), true);
});

test("the same instance activating again re-registers", () => {
	// Host rebuilt its session/registry: skipping here leaves claude-bridge models
	// without a streamSimple and every later request dies in mapOptionsForApi.
	assert.equal(shouldRegisterProvider(own, own), true);
});

test("a different module instance (subagent) does not register", () => {
	const parentStream = () => {};
	assert.equal(shouldRegisterProvider(parentStream, own), false);
});

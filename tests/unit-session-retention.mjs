import test from "node:test";
import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { getSessionPath } from "cc-session-io";

import { retainSessionAfterError } from "../src/session-retention.ts";

const session = { sessionId: "5b5c577a-0000-4000-8000-000000000000", cursor: 42 };

function withWorkspace(fn) {
	const root = mkdtempSync(join(tmpdir(), "retention-"));
	const cwd = join(root, "project");
	const claudeDir = join(root, "claude");
	mkdirSync(cwd, { recursive: true });
	mkdirSync(claudeDir, { recursive: true });
	try {
		return fn({ cwd, claudeDir, transcript: getSessionPath(session.sessionId, cwd, claudeDir) });
	} finally {
		rmSync(root, { recursive: true, force: true });
	}
}

test("keeps the session when the transcript still exists", () => {
	withWorkspace(({ cwd, claudeDir, transcript }) => {
		mkdirSync(join(transcript, ".."), { recursive: true });
		writeFileSync(transcript, '{"sessionId":"x"}\n');
		assert.equal(retainSessionAfterError(session, false, cwd, claudeDir), session);
	});
});

test("drops the session when the transcript is gone", () => {
	withWorkspace(({ cwd, claudeDir }) => {
		assert.equal(retainSessionAfterError(session, false, cwd, claudeDir), null);
	});
});

test("abort still forces a rebuild and rotation, even with an intact transcript", () => {
	withWorkspace(({ cwd, claudeDir, transcript }) => {
		mkdirSync(join(transcript, ".."), { recursive: true });
		writeFileSync(transcript, '{"sessionId":"x"}\n');
		const retained = retainSessionAfterError(session, true, cwd, claudeDir);
		assert.equal(retained.sessionId, session.sessionId);
		assert.equal(retained.needsRebuild, true);
		assert.equal(retained.forceRotate, true);
	});
});

test("no session state stays null", () => {
	assert.equal(retainSessionAfterError(null, false, "/tmp", undefined), null);
	assert.equal(retainSessionAfterError(null, true, "/tmp", undefined), null);
});

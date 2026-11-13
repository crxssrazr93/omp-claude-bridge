// Shared-session retention policy for failed provider turns.
//
// Extracted from index.ts so tests can import it without activating the
// extension (same pattern as session-verify.ts).
//
// A provider error (transient edge 403 from the CDN in front of the API,
// stream failure, tool-loop abort) says nothing about the on-disk CC
// transcript. When that transcript still exists it holds the full conversation
// — including thinking blocks and tool detail that pi-side history does not
// carry — and it is the prompt-cache anchor for the next request. Dropping the
// mapping on error forces the next turn through the REBUILD path, which
// rewrites history into a brand-new session and loses all of that.

import { existsSync } from "fs";
import { getSessionPath } from "cc-session-io";

export interface RetainableSession {
	sessionId: string;
	cursor: number;
	cwd?: string;
	needsRebuild?: boolean;
	forceRotate?: boolean;
}

export function retainSessionAfterError<T extends RetainableSession>(
	state: T | null,
	wasAborted: boolean,
	cwd: string,
	claudeDir?: string,
): T | null {
	if (!state) return null;
	// An abort may leave an orphaned writer behind on that session file, so the
	// next turn has to rebuild — rotate to a fresh id to avoid racing it.
	if (wasAborted) return { ...state, needsRebuild: true, forceRotate: true };
	let transcript: string;
	try {
		transcript = getSessionPath(state.sessionId, state.cwd ?? cwd, claudeDir);
	} catch {
		return null;
	}
	// Resume is only safe while the transcript the CLI would load still exists.
	return existsSync(transcript) ? state : null;
}

// Guard for re-registering the provider when the extension module activates more
// than once in a single omp process.
//
// Two activations exist and they need opposite answers:
//
//  1. The SAME module instance activating again (host reloads extensions, or
//     builds a fresh session/registry). It must re-register: the host's new
//     registry knows nothing about claude-bridge, and skipping leaves the models
//     present (they come from the catalog) with no streamSimple, so every later
//     request takes pi-ai's generic path and dies in mapOptionsForApi.
//
//  2. A DIFFERENT module instance (omp loads this module again when spawning a
//     subagent). It must NOT register: the shared registry would be repointed at
//     the subagent's empty-state streamSimple and the parent would lose tool
//     result delivery.
//
// The stored value is the streamSimple function itself, so identity tells the two
// cases apart.

export function shouldRegisterProvider(stored: unknown, own: unknown): boolean {
	return stored === undefined || stored === null || stored === own;
}

#!/usr/bin/env node
/**
 * Comprehensive validation tests for GoTN schemas
 */
import { validateNode, validateEdge, validateGraph, validateMeta, validateJournalEntry, safeParseNode, formatValidationError, } from "../packages/core/dist/schemas.js";
// Test utilities
let testCount = 0;
let passedTests = 0;
function test(name, fn) {
    testCount++;
    try {
        const result = fn();
        if (result instanceof Promise) {
            return result.then(() => {
                console.log(`✅ ${name}`);
                passedTests++;
            }).catch((error) => {
                console.log(`❌ ${name}: ${error.message}`);
            });
        }
        else {
            console.log(`✅ ${name}`);
            passedTests++;
        }
    }
    catch (error) {
        console.log(`❌ ${name}: ${error.message}`);
    }
}
function expect(value) {
    return {
        toBe: (expected) => {
            if (value !== expected) {
                throw new Error(`Expected ${expected}, got ${value}`);
            }
        },
        toThrow: (expectedMessage) => {
            let threw = false;
            let actualError;
            try {
                if (typeof value === 'function') {
                    value();
                }
            }
            catch (error) {
                threw = true;
                actualError = error;
            }
            if (!threw) {
                throw new Error('Expected function to throw');
            }
            if (expectedMessage && !actualError.message.includes(expectedMessage)) {
                throw new Error(`Expected error message to contain "${expectedMessage}", got "${actualError.message}"`);
            }
        },
        toContain: (expected) => {
            if (!value.includes(expected)) {
                throw new Error(`Expected "${value}" to contain "${expected}"`);
            }
        }
    };
}
async function runValidationTests() {
    console.log("🧪 Running GoTN Validation Tests...\n");
    // Valid test data
    const validNode = {
        id: "test-node-1",
        kind: "micro_prompt",
        summary: "Test node for validation",
        prompt_text: "This is a test prompt",
        children: [],
        requires: ["input-data"],
        produces: ["output-data"],
        tags: ["test", "validation"],
        success_criteria: ["node completes successfully"],
        guards: ["check input exists"],
        artifacts: {
            files: ["test.txt"],
            outputs: [],
            dependencies: []
        },
        status: "ready",
        provenance: {
            created_by: "test-suite",
            source: "validation-test"
        },
        version: 1,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
    };
    const validEdge = {
        src: "node-1",
        dst: "node-2",
        type: "hard_requires",
        score: 0.95,
        evidence: "dependency analysis",
        provenance: {
            created_by: "test-suite",
            source: "validation-test"
        },
        version: 1,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
    };
    // Node validation tests
    test("Valid node passes validation", () => {
        const result = validateNode(validNode);
        expect(result.id).toBe("test-node-1");
        expect(result.status).toBe("ready");
    });
    test("Node with missing ID fails", () => {
        const invalidNode = { ...validNode };
        delete invalidNode.id;
        expect(() => validateNode(invalidNode)).toThrow("ID cannot be empty");
    });
    test("Node with empty summary fails", () => {
        const invalidNode = { ...validNode, summary: "" };
        expect(() => validateNode(invalidNode)).toThrow("Summary cannot be empty");
    });
    test("Node with invalid status fails", () => {
        const invalidNode = { ...validNode, status: "invalid-status" };
        expect(() => validateNode(invalidNode)).toThrow("Status must be one of");
    });
    test("Node with empty prompt_text fails", () => {
        const invalidNode = { ...validNode, prompt_text: "" };
        expect(() => validateNode(invalidNode)).toThrow("Prompt text cannot be empty");
    });
    test("Node with missing provenance fails", () => {
        const invalidNode = { ...validNode };
        delete invalidNode.provenance;
        expect(() => validateNode(invalidNode)).toThrow();
    });
    test("Node with invalid version fails", () => {
        const invalidNode = { ...validNode, version: -1 };
        expect(() => validateNode(invalidNode)).toThrow("Version must be a positive integer");
    });
    // Edge validation tests
    test("Valid edge passes validation", () => {
        const result = validateEdge(validEdge);
        expect(result.src).toBe("node-1");
        expect(result.dst).toBe("node-2");
        expect(result.type).toBe("hard_requires");
    });
    test("Edge with same source and destination fails", () => {
        const invalidEdge = { ...validEdge, src: "node-1", dst: "node-1" };
        expect(() => validateEdge(invalidEdge)).toThrow("Edge source and destination cannot be the same");
    });
    test("Edge with invalid type fails", () => {
        const invalidEdge = { ...validEdge, type: "invalid-type" };
        expect(() => validateEdge(invalidEdge)).toThrow("Edge type must be one of");
    });
    test("Edge with score out of range fails", () => {
        const invalidEdge = { ...validEdge, score: 1.5 };
        expect(() => validateEdge(invalidEdge)).toThrow();
    });
    test("Edge with negative score fails", () => {
        const invalidEdge = { ...validEdge, score: -0.1 };
        expect(() => validateEdge(invalidEdge)).toThrow();
    });
    test("Edge with empty source ID fails", () => {
        const invalidEdge = { ...validEdge, src: "" };
        expect(() => validateEdge(invalidEdge)).toThrow("ID cannot be empty");
    });
    // Graph validation tests
    test("Valid graph with nodes and edges passes", () => {
        const validGraph = {
            nodes: [validNode],
            edges: [validEdge],
            version: 1,
            updated: new Date().toISOString()
        };
        const result = validateGraph(validGraph);
        expect(result.nodes.length).toBe(1);
        expect(result.edges.length).toBe(1);
    });
    test("Empty graph passes validation", () => {
        const emptyGraph = {
            nodes: [],
            edges: [],
            version: 1,
            updated: new Date().toISOString()
        };
        const result = validateGraph(emptyGraph);
        expect(result.nodes.length).toBe(0);
        expect(result.edges.length).toBe(0);
    });
    test("Graph with invalid node fails", () => {
        const invalidGraph = {
            nodes: [{ ...validNode, id: "" }], // Invalid node
            edges: [],
            version: 1,
            updated: new Date().toISOString()
        };
        expect(() => validateGraph(invalidGraph)).toThrow("ID cannot be empty");
    });
    // Meta validation tests
    test("Valid meta passes validation", () => {
        const validMeta = {
            version: "0.1.0",
            created: new Date().toISOString(),
            updated: new Date().toISOString(),
            workspace_path: "/test/workspace"
        };
        const result = validateMeta(validMeta);
        expect(result.version).toBe("0.1.0");
    });
    test("Meta with empty workspace_path fails", () => {
        const invalidMeta = {
            version: "0.1.0",
            created: new Date().toISOString(),
            updated: new Date().toISOString(),
            workspace_path: ""
        };
        expect(() => validateMeta(invalidMeta)).toThrow("Workspace path cannot be empty");
    });
    // Journal entry validation tests
    test("Valid journal entry passes validation", () => {
        const validEntry = {
            timestamp: new Date().toISOString(),
            event: "test_event",
            data: { test: "data" },
            id: "test-id-123"
        };
        const result = validateJournalEntry(validEntry);
        expect(result.event).toBe("test_event");
    });
    test("Journal entry with empty event fails", () => {
        const invalidEntry = {
            timestamp: new Date().toISOString(),
            event: "",
            data: {},
            id: "test-id-123"
        };
        expect(() => validateJournalEntry(invalidEntry)).toThrow("Event cannot be empty");
    });
    // Safe parsing tests
    test("Safe parse returns success for valid data", () => {
        const result = safeParseNode(validNode);
        expect(result.success).toBe(true);
        if (result.success) {
            expect(result.data.id).toBe("test-node-1");
        }
    });
    test("Safe parse returns error for invalid data", () => {
        const result = safeParseNode({ id: "" });
        expect(result.success).toBe(false);
        if (!result.success) {
            expect(result.error.issues.length > 0).toBe(true);
        }
    });
    // Error formatting tests
    test("Error formatting provides clear messages", () => {
        try {
            validateNode({ id: "", summary: "", prompt_text: "" });
        }
        catch (error) {
            const formatted = formatValidationError(error);
            expect(formatted).toContain("Validation failed:");
            expect(formatted).toContain("ID cannot be empty");
            expect(formatted).toContain("Summary cannot be empty");
        }
    });
    // Default value tests
    test("Node with minimal data gets defaults", () => {
        const minimalNode = {
            id: "minimal-node",
            kind: "test",
            summary: "Minimal test node",
            prompt_text: "Test prompt",
            provenance: {
                created_by: "test",
                source: "test"
            }
        };
        const result = validateNode(minimalNode);
        expect(result.children.length).toBe(0);
        expect(result.requires.length).toBe(0);
        expect(result.produces.length).toBe(0);
        expect(result.tags.length).toBe(0);
        expect(result.status).toBe("ready");
        expect(result.version).toBe(1);
    });
    // Summary
    console.log(`\n📊 Test Results: ${passedTests}/${testCount} tests passed`);
    if (passedTests === testCount) {
        console.log("🎉 All validation tests passed!");
        return true;
    }
    else {
        console.log("❌ Some validation tests failed");
        return false;
    }
}
runValidationTests().then((success) => {
    process.exit(success ? 0 : 1);
}).catch((error) => {
    console.error("❌ Test runner failed:", error);
    process.exit(1);
});

/**
 * Cloud Breakdown Engine - Real OpenAI-powered atomic decomposition
 * No filesystem dependencies, pure cloud storage
 */
import OpenAI from "openai";
export class CloudBreakdownEngine {
    openai;
    constructor() {
        this.openai = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY,
        });
        console.log("🌥️  CloudBreakdownEngine initialized with OpenAI");
    }
    async breakdown(request) {
        const { project_id, prompt, mode = "tree", max_nodes = 16 } = request;
        console.log(`🔄 Breaking down prompt for project ${project_id}: "${prompt.substring(0, 100)}..."`);
        try {
            // Use OpenAI to create REAL atomic breakdown
            const breakdown = await this.createLLMBreakdown(prompt, max_nodes);
            const nodes = this.convertToNodes(breakdown);
            const edges = this.createEdgesFromNodes(nodes);
            console.log(`🧠 OpenAI created ${nodes.length} atomic tasks`);
            return {
                nodes,
                edges,
                root_id: nodes[0]?.id || "root",
            };
        }
        catch (error) {
            console.error("❌ OpenAI breakdown failed:", error);
            // Fallback to simple breakdown
            const nodes = this.createSimpleBreakdown(prompt, mode, max_nodes);
            const edges = this.createEdgesFromNodes(nodes);
            return {
                nodes,
                edges,
                root_id: nodes[0]?.id || "root",
            };
        }
    }
    async createLLMBreakdown(prompt, maxNodes) {
        const systemPrompt = `You are an expert software architect. Break down complex development tasks into ATOMIC micro-prompts.

RULES:
1. Each task must be ATOMIC (1-3 hours of work max)
2. Tasks must be ACTIONABLE (specific implementation steps)
3. Include technical details (libraries, APIs, file names)
4. Create proper dependencies between tasks
5. Focus on SCALABILITY (millions of users)

OUTPUT FORMAT (JSON):
{
  "root_task": {
    "id": "main_project",
    "summary": "Brief description",
    "prompt_text": "Detailed implementation instructions",
    "children": ["task1", "task2", ...]
  },
  "tasks": [
    {
      "id": "task1",
      "summary": "Atomic task description",
      "prompt_text": "Specific implementation steps with tech stack",
      "parent": "main_project",
      "requires": ["dependency_ids"],
      "produces": ["output_artifacts"],
      "exec_target": "specific/file/path",
      "tags": ["frontend", "api", etc],
      "success_criteria": ["Measurable completion criteria"],
      "tech_stack": ["React", "TypeScript", etc]
    }
  ]
}`;
        const response = await this.openai.chat.completions.create({
            model: "gpt-4",
            messages: [
                { role: "system", content: systemPrompt },
                {
                    role: "user",
                    content: `Break this into ${maxNodes} atomic micro-prompts:\n\n"${prompt}"`
                }
            ],
            temperature: 0.3,
            max_tokens: 4000,
        });
        const content = response.choices[0]?.message?.content;
        if (!content) {
            throw new Error("No response from OpenAI");
        }
        try {
            return JSON.parse(content);
        }
        catch (parseError) {
            console.error("Failed to parse OpenAI response:", content);
            throw new Error("Invalid JSON response from OpenAI");
        }
    }
    convertToNodes(breakdown) {
        const timestamp = new Date().toISOString();
        const nodes = [];
        // Add root task
        if (breakdown.root_task) {
            nodes.push({
                id: breakdown.root_task.id,
                kind: "micro_prompt",
                summary: breakdown.root_task.summary,
                prompt_text: breakdown.root_task.prompt_text,
                children: breakdown.root_task.children || [],
                requires: [],
                produces: ["project_defined"],
                exec_target: ".",
                tags: ["root", "main"],
                success_criteria: ["Project structure defined"],
                guards: [],
                artifacts: {
                    files: [],
                    outputs: [],
                    dependencies: [],
                },
                status: "ready",
                provenance: {
                    created_by: "openai_breakdown_engine",
                    source: "llm_generated",
                },
                version: 1,
                created_at: timestamp,
                updated_at: timestamp,
            });
        }
        // Add all tasks
        if (breakdown.tasks && Array.isArray(breakdown.tasks)) {
            for (const task of breakdown.tasks) {
                nodes.push({
                    id: task.id,
                    kind: "micro_prompt",
                    summary: task.summary,
                    prompt_text: task.prompt_text,
                    parent: task.parent,
                    children: [],
                    requires: task.requires || [],
                    produces: task.produces || [`${task.id}_done`],
                    exec_target: task.exec_target || ".",
                    tags: task.tags || ["task"],
                    success_criteria: task.success_criteria || ["Task completed"],
                    guards: [],
                    artifacts: {
                        files: [],
                        outputs: [],
                        dependencies: task.tech_stack || [],
                    },
                    status: "ready",
                    provenance: {
                        created_by: "openai_breakdown_engine",
                        source: "llm_generated",
                    },
                    version: 1,
                    created_at: timestamp,
                    updated_at: timestamp,
                });
            }
        }
        return nodes;
    }
    createSimpleBreakdown(prompt, mode, maxNodes) {
        const timestamp = new Date().toISOString();
        // Create root node
        const rootNode = {
            id: "root_task",
            kind: "micro_prompt",
            summary: `Main task: ${prompt.substring(0, 50)}...`,
            prompt_text: prompt,
            children: [],
            requires: [],
            produces: ["task_defined"],
            exec_target: ".",
            tags: ["root", "main"],
            success_criteria: ["Task requirements understood"],
            guards: [],
            artifacts: {
                files: [],
                outputs: [],
                dependencies: [],
            },
            status: "ready",
            provenance: {
                created_by: "cloud_breakdown_engine",
                source: "user_prompt",
            },
            version: 1,
            created_at: timestamp,
            updated_at: timestamp,
        };
        const nodes = [rootNode];
        // Create some basic subtasks
        if (mode === "tree" && maxNodes > 1) {
            const subtasks = this.generateSubtasks(prompt, Math.min(maxNodes - 1, 4));
            subtasks.forEach((subtask, index) => {
                const subtaskNode = {
                    id: `subtask_${index + 1}`,
                    kind: "micro_prompt",
                    summary: subtask.summary,
                    prompt_text: subtask.prompt,
                    parent: "root_task",
                    children: [],
                    requires: ["task_defined"],
                    produces: [`subtask_${index + 1}_done`],
                    exec_target: subtask.target,
                    tags: ["subtask"],
                    success_criteria: [subtask.success],
                    guards: [],
                    artifacts: {
                        files: [],
                        outputs: [],
                        dependencies: [],
                    },
                    status: "ready",
                    provenance: {
                        created_by: "cloud_breakdown_engine",
                        source: "generated_subtask",
                    },
                    version: 1,
                    created_at: timestamp,
                    updated_at: timestamp,
                };
                nodes.push(subtaskNode);
                rootNode.children.push(subtaskNode.id);
            });
        }
        console.log(`📝 Created ${nodes.length} nodes for breakdown`);
        return nodes;
    }
    generateSubtasks(prompt, count) {
        const promptLower = prompt.toLowerCase();
        const subtasks = [];
        // Simple heuristics for common tasks
        if (promptLower.includes("web") || promptLower.includes("app")) {
            subtasks.push({
                summary: "Set up project structure",
                prompt: "Initialize project with proper folder structure",
                target: "./",
                success: "Project structure created",
            }, {
                summary: "Create frontend components",
                prompt: "Build user interface components",
                target: "frontend/",
                success: "UI components working",
            }, {
                summary: "Implement backend logic",
                prompt: "Create server-side functionality",
                target: "backend/",
                success: "Backend services running",
            }, {
                summary: "Connect and deploy",
                prompt: "Integrate components and deploy",
                target: "./",
                success: "Application deployed",
            });
        }
        else if (promptLower.includes("data") ||
            promptLower.includes("analysis")) {
            subtasks.push({
                summary: "Data collection",
                prompt: "Gather and prepare data sources",
                target: "data/",
                success: "Data collected",
            }, {
                summary: "Data processing",
                prompt: "Clean and transform data",
                target: "processing/",
                success: "Data processed",
            }, {
                summary: "Analysis & insights",
                prompt: "Analyze data and generate insights",
                target: "analysis/",
                success: "Analysis complete",
            }, {
                summary: "Visualization & reporting",
                prompt: "Create visualizations and reports",
                target: "reports/",
                success: "Reports generated",
            });
        }
        else {
            // Generic breakdown
            subtasks.push({
                summary: "Planning & setup",
                prompt: "Plan the approach and set up environment",
                target: "./",
                success: "Setup complete",
            }, {
                summary: "Core implementation",
                prompt: "Implement main functionality",
                target: "src/",
                success: "Core features working",
            }, {
                summary: "Testing & validation",
                prompt: "Test and validate the implementation",
                target: "tests/",
                success: "Tests passing",
            }, {
                summary: "Documentation & deployment",
                prompt: "Document and deploy the solution",
                target: "./",
                success: "Solution deployed",
            });
        }
        return subtasks.slice(0, count);
    }
    createEdgesFromNodes(nodes) {
        const edges = [];
        const timestamp = new Date().toISOString();
        // Create parent-child edges
        nodes.forEach((node) => {
            if (node.parent) {
                edges.push({
                    src: node.parent,
                    dst: node.id,
                    type: "derived_from",
                    evidence: "Parent-child decomposition relationship",
                    provenance: {
                        created_by: "cloud_breakdown_engine",
                        source: "hierarchy",
                    },
                    version: 1,
                    created_at: timestamp,
                    updated_at: timestamp,
                });
            }
        });
        // Create dependency edges based on requires/produces
        nodes.forEach((consumer) => {
            consumer.requires.forEach((requirement) => {
                nodes.forEach((producer) => {
                    if (producer.produces.includes(requirement) &&
                        producer.id !== consumer.id) {
                        edges.push({
                            src: producer.id,
                            dst: consumer.id,
                            type: "hard_requires",
                            evidence: `${consumer.id} requires '${requirement}' which ${producer.id} produces`,
                            provenance: {
                                created_by: "cloud_breakdown_engine",
                                source: "dependency_analysis",
                            },
                            version: 1,
                            created_at: timestamp,
                            updated_at: timestamp,
                        });
                    }
                });
            });
        });
        console.log(`🔗 Created ${edges.length} edges for breakdown`);
        return edges;
    }
}
// Global instance
let cloudBreakdownEngine = null;
export function getCloudBreakdownEngine() {
    if (!cloudBreakdownEngine) {
        cloudBreakdownEngine = new CloudBreakdownEngine();
    }
    return cloudBreakdownEngine;
}

/**
 * BreakdownEngine - Automatic prompt decomposition into micro prompts
 *
 * Converts large user prompts into a progressive tree of atomic micro prompts
 * with proper dependencies, validation, and linking.
 */

import { Node, NodeSchema, Edge } from "./schemas.js";
import { getNodeStore } from "./nodeStore.js";
import { getEdgeEngine } from "./edgeEngine.js";
import { addEdge } from "./fsStore.js";

export interface BreakdownRequest {
  project_id: string;
  prompt: string;
  mode: "tree" | "flat";
  max_nodes: number;
}

export interface BreakdownResult {
  created_node_ids: string[];
  created_edge_count: number;
  root_id: string;
  total_nodes: number;
}

export interface LLMBreakdownNode {
  id: string;
  summary: string;
  prompt_text: string;
  parent?: string;
  children: string[];
  requires: string[];
  produces: string[];
  exec_target: string;
  success_criteria: string[];
  guards: string[];
  tags: string[];
}

export interface LLMBreakdownResponse {
  root_id: string;
  nodes: LLMBreakdownNode[];
}

export class BreakdownEngine {
  private initialized = false;

  constructor() {}

  private async ensureInitialized() {
    if (this.initialized) return;
    // Future: Initialize LLM client here
    this.initialized = true;
  }

  /**
   * Generate breakdown using LLM (mock implementation for now)
   */
  private async generateBreakdown(
    prompt: string,
    mode: "tree" | "flat",
    maxNodes: number
  ): Promise<LLMBreakdownResponse> {
    await this.ensureInitialized();

    // For now, return fixture data based on prompt content
    // In real implementation, this would call an LLM API
    if (
      prompt.toLowerCase().includes("iot") ||
      prompt.toLowerCase().includes("kafka") ||
      prompt.toLowerCase().includes("streaming")
    ) {
      return this.getIoTPipelineFixture();
    } else if (
      prompt.toLowerCase().includes("landing") ||
      prompt.toLowerCase().includes("page") ||
      prompt.toLowerCase().includes("website")
    ) {
      return this.getLandingPageFixture();
    } else {
      // Generic breakdown for other prompts
      return this.getGenericBreakdown(prompt, mode, maxNodes);
    }
  }

  /**
   * IoT Pipeline fixture for testing
   */
  private getIoTPipelineFixture(): LLMBreakdownResponse {
    return {
      root_id: "iot_pipeline_root",
      nodes: [
        {
          id: "iot_pipeline_root",
          summary: "Complete IoT streaming data pipeline",
          prompt_text:
            "Build end-to-end IoT data pipeline from sensors to warehouse",
          children: [
            "setup_kafka_broker",
            "setup_spark_consumer",
            "data_transformation",
            "write_to_snowflake",
          ],
          requires: [],
          produces: ["iot_pipeline_complete"],
          exec_target: "infrastructure/",
          success_criteria: [
            "Data flows from sensors to warehouse",
            "Pipeline handles 10k events/sec",
          ],
          guards: ["Check infrastructure capacity"],
          tags: ["iot", "pipeline", "streaming"],
        },
        {
          id: "setup_kafka_broker",
          summary: "Set up Kafka message broker for IoT events",
          prompt_text:
            "Deploy and configure Apache Kafka broker with proper topics for IoT sensor data ingestion",
          parent: "iot_pipeline_root",
          children: [],
          requires: ["docker_runtime"],
          produces: ["kafka_cluster_ready", "sensor_topics_created"],
          exec_target: "infrastructure/kafka/docker-compose.yml",
          success_criteria: [
            "Kafka broker accepts connections",
            "Topics created successfully",
          ],
          guards: ["Check port 9092 availability", "Verify Docker is running"],
          tags: ["kafka", "messaging", "broker", "iot"],
        },
        {
          id: "setup_spark_consumer",
          summary: "Create Spark streaming consumer for Kafka",
          prompt_text:
            "Implement Spark Structured Streaming application to consume IoT events from Kafka topics",
          parent: "iot_pipeline_root",
          children: [],
          requires: ["kafka_cluster_ready", "spark_cluster"],
          produces: ["spark_stream_ready", "event_processing"],
          exec_target: "src/streaming/spark_consumer.py",
          success_criteria: [
            "Consumer processes messages",
            "No message loss",
            "Handles backpressure",
          ],
          guards: ["Verify Kafka is running", "Check Spark cluster health"],
          tags: ["spark", "streaming", "consumer", "iot"],
        },
        {
          id: "data_transformation",
          summary: "Transform and clean IoT sensor data",
          prompt_text:
            "Apply data transformations, filtering, and enrichment to raw IoT sensor events",
          parent: "iot_pipeline_root",
          children: [],
          requires: ["spark_stream_ready"],
          produces: ["clean_events", "enriched_data"],
          exec_target: "src/transformations/iot_transforms.py",
          success_criteria: [
            "Data quality checks pass",
            "Schema validation successful",
          ],
          guards: ["Verify data format", "Check transformation rules"],
          tags: ["transformation", "data-quality", "iot"],
        },
        {
          id: "write_to_snowflake",
          summary: "Write processed IoT data to Snowflake warehouse",
          prompt_text:
            "Create data sink that writes cleaned and transformed IoT data to Snowflake tables with proper schema",
          parent: "iot_pipeline_root",
          children: [],
          requires: ["clean_events", "snowflake_credentials"],
          produces: ["warehouse_loaded", "data_persisted"],
          exec_target: "src/sinks/snowflake_writer.py",
          success_criteria: [
            "Data appears in Snowflake",
            "Schema matches expectations",
            "No data loss",
          ],
          guards: ["Check Snowflake credentials", "Verify table schema"],
          tags: ["snowflake", "data-warehouse", "sink", "iot"],
        },
        {
          id: "setup_monitoring",
          summary: "Set up monitoring and alerting for IoT pipeline",
          prompt_text:
            "Deploy monitoring stack with metrics, logs, and alerts for the IoT data pipeline",
          parent: "iot_pipeline_root",
          children: [],
          requires: [],
          produces: ["monitoring_stack", "alerts_configured"],
          exec_target: "infrastructure/monitoring/",
          success_criteria: [
            "Metrics visible in dashboard",
            "Alerts fire correctly",
          ],
          guards: ["Check monitoring endpoints"],
          tags: ["monitoring", "observability", "iot"],
        },
        {
          id: "data_validation",
          summary: "Validate IoT data quality and completeness",
          prompt_text:
            "Implement data validation checks and quality monitoring for IoT sensor data",
          parent: "iot_pipeline_root",
          children: [],
          requires: ["warehouse_loaded"],
          produces: ["data_quality_reports", "validation_metrics"],
          exec_target: "src/validation/data_quality.py",
          success_criteria: ["Quality checks pass", "Reports generated"],
          guards: ["Verify data completeness"],
          tags: ["data-quality", "validation", "iot"],
        },
        {
          id: "api_endpoints",
          summary: "Create API endpoints for IoT data access",
          prompt_text:
            "Build REST API endpoints to query and retrieve IoT data from the warehouse",
          parent: "iot_pipeline_root",
          children: [],
          requires: ["warehouse_loaded"],
          produces: ["api_service", "data_access_layer"],
          exec_target: "src/api/iot_api.py",
          success_criteria: ["API responds correctly", "Data queries work"],
          guards: ["Check API authentication"],
          tags: ["api", "rest", "iot", "access"],
        },
        {
          id: "dashboard_creation",
          summary: "Create IoT data visualization dashboard",
          prompt_text:
            "Build interactive dashboard to visualize IoT sensor data and pipeline metrics",
          parent: "iot_pipeline_root",
          children: [],
          requires: ["api_service", "monitoring_stack"],
          produces: ["iot_dashboard", "visualizations"],
          exec_target: "frontend/dashboard/",
          success_criteria: [
            "Dashboard loads correctly",
            "Charts display data",
          ],
          guards: ["Check data availability"],
          tags: ["dashboard", "visualization", "iot", "frontend"],
        },
      ],
    };
  }

  /**
   * Landing Page fixture for testing
   */
  private getLandingPageFixture(): LLMBreakdownResponse {
    return {
      root_id: "landing_page_root",
      nodes: [
        {
          id: "landing_page_root",
          summary: "Complete landing page website",
          prompt_text: "Build modern responsive landing page with all sections",
          children: [
            "setup_project",
            "create_header",
            "hero_section",
            "features_section",
            "footer_section",
          ],
          requires: [],
          produces: ["landing_page_complete"],
          exec_target: "src/",
          success_criteria: [
            "Page loads correctly",
            "Mobile responsive",
            "SEO optimized",
          ],
          guards: ["Check browser compatibility"],
          tags: ["website", "landing", "frontend"],
        },
        {
          id: "setup_project",
          summary: "Set up project structure and dependencies",
          prompt_text:
            "Initialize project with build tools, dependencies, and folder structure",
          parent: "landing_page_root",
          children: [],
          requires: [],
          produces: ["project_setup", "build_tools"],
          exec_target: "package.json",
          success_criteria: ["Dependencies installed", "Build scripts work"],
          guards: ["Check Node.js version"],
          tags: ["setup", "dependencies", "project"],
        },
        {
          id: "create_header",
          summary: "Create navigation header component",
          prompt_text:
            "Build responsive navigation header with logo and menu items",
          parent: "landing_page_root",
          children: [],
          requires: ["project_setup"],
          produces: ["header_component", "navigation"],
          exec_target: "src/components/Header.jsx",
          success_criteria: ["Header displays correctly", "Navigation works"],
          guards: ["Check responsive behavior"],
          tags: ["header", "navigation", "component"],
        },
        {
          id: "hero_section",
          summary: "Create hero section with call-to-action",
          prompt_text:
            "Build compelling hero section with headline, description, and CTA button",
          parent: "landing_page_root",
          children: [],
          requires: ["project_setup"],
          produces: ["hero_component", "cta_button"],
          exec_target: "src/components/Hero.jsx",
          success_criteria: ["Hero displays correctly", "CTA button works"],
          guards: ["Check content alignment"],
          tags: ["hero", "cta", "component"],
        },
        {
          id: "features_section",
          summary: "Create features showcase section",
          prompt_text:
            "Build features section highlighting key product benefits with icons",
          parent: "landing_page_root",
          children: [],
          requires: ["project_setup"],
          produces: ["features_component", "feature_cards"],
          exec_target: "src/components/Features.jsx",
          success_criteria: ["Features display correctly", "Icons load"],
          guards: ["Check content accuracy"],
          tags: ["features", "benefits", "component"],
        },
        {
          id: "footer_section",
          summary: "Create footer with links and contact info",
          prompt_text:
            "Build footer section with links, social media, and contact information",
          parent: "landing_page_root",
          children: [],
          requires: ["project_setup"],
          produces: ["footer_component", "contact_links"],
          exec_target: "src/components/Footer.jsx",
          success_criteria: ["Footer displays correctly", "Links work"],
          guards: ["Check link validity"],
          tags: ["footer", "links", "component"],
        },
      ],
    };
  }

  /**
   * Generic breakdown for other prompts
   */
  private getGenericBreakdown(
    prompt: string,
    mode: "tree" | "flat",
    maxNodes: number
  ): LLMBreakdownResponse {
    const rootId = "generic_task_root";

    return {
      root_id: rootId,
      nodes: [
        {
          id: rootId,
          summary: "Complete the requested task",
          prompt_text: prompt,
          children: [
            "analyze_requirements",
            "implement_solution",
            "test_solution",
          ],
          requires: [],
          produces: ["task_complete"],
          exec_target: "src/",
          success_criteria: ["Task completed successfully"],
          guards: ["Verify requirements"],
          tags: ["generic", "task"],
        },
        {
          id: "analyze_requirements",
          summary: "Analyze task requirements",
          prompt_text: "Break down and analyze the requirements for the task",
          parent: rootId,
          children: [],
          requires: [],
          produces: ["requirements_analyzed"],
          exec_target: "docs/requirements.md",
          success_criteria: ["Requirements documented"],
          guards: [],
          tags: ["analysis", "requirements"],
        },
        {
          id: "implement_solution",
          summary: "Implement the solution",
          prompt_text:
            "Implement the core solution based on analyzed requirements",
          parent: rootId,
          children: [],
          requires: ["requirements_analyzed"],
          produces: ["solution_implemented"],
          exec_target: "src/main.js",
          success_criteria: ["Solution works correctly"],
          guards: ["Check implementation quality"],
          tags: ["implementation", "solution"],
        },
        {
          id: "test_solution",
          summary: "Test the implemented solution",
          prompt_text:
            "Create and run tests to verify the solution works correctly",
          parent: rootId,
          children: [],
          requires: ["solution_implemented"],
          produces: ["tests_passing"],
          exec_target: "tests/",
          success_criteria: ["All tests pass"],
          guards: ["Verify test coverage"],
          tags: ["testing", "verification"],
        },
      ],
    };
  }

  /**
   * Convert LLM breakdown nodes to GoTN Node format
   */
  private convertToGoTNNodes(
    llmNodes: LLMBreakdownNode[],
    projectId: string
  ): Node[] {
    const currentTime = new Date().toISOString();

    return llmNodes.map((llmNode) => {
      const node: Node = {
        id: llmNode.id,
        kind: "micro_prompt",
        summary: llmNode.summary,
        prompt_text: llmNode.prompt_text,
        parent: llmNode.parent,
        children: llmNode.children,
        requires: llmNode.requires,
        produces: llmNode.produces,
        exec_target: llmNode.exec_target,
        tags: llmNode.tags,
        success_criteria: llmNode.success_criteria,
        guards: llmNode.guards,
        artifacts: {
          files: [],
          outputs: [],
          dependencies: [],
        },
        status: "ready",
        provenance: {
          created_by: "breakdown_engine",
          source: "llm_decomposition",
          created_at: currentTime,
        },
        version: 1,
        created_at: currentTime,
        updated_at: currentTime,
      };

      return node;
    });
  }

  /**
   * Create parent-child edges for the breakdown tree
   */
  private async createParentChildEdges(nodes: Node[]): Promise<Edge[]> {
    const edges: Edge[] = [];
    const currentTime = new Date().toISOString();

    for (const node of nodes) {
      if (node.parent) {
        const edge: Edge = {
          src: node.parent,
          dst: node.id,
          type: "derived_from",
          evidence: `${node.id} is derived from parent ${node.parent} during breakdown`,
          provenance: {
            created_by: "breakdown_engine",
            source: "parent_child_inference",
            created_at: currentTime,
          },
          version: 1,
          created_at: currentTime,
          updated_at: currentTime,
        };

        edges.push(edge);
      }
    }

    return edges;
  }

  /**
   * Main breakdown function
   */
  async breakdown(request: BreakdownRequest): Promise<BreakdownResult> {
    const { project_id, prompt, mode, max_nodes } = request;

    console.log(
      `Breaking down prompt for project ${project_id}: "${prompt.substring(
        0,
        100
      )}..."`
    );

    try {
      // 1. Generate breakdown using LLM
      const llmResponse = await this.generateBreakdown(prompt, mode, max_nodes);

      // 2. Convert to GoTN nodes and validate with Zod
      const gotnNodes = this.convertToGoTNNodes(llmResponse.nodes, project_id);

      // Validate each node with Zod
      const validatedNodes: Node[] = [];
      for (const node of gotnNodes) {
        try {
          const validatedNode = NodeSchema.parse(node);
          validatedNodes.push(validatedNode);
        } catch (error: any) {
          console.warn(`Skipping invalid node ${node.id}:`, error.message);
        }
      }

      console.log(`Validated ${validatedNodes.length} nodes from breakdown`);

      // 3. Store nodes with NodeStore
      const nodeStore = getNodeStore(project_id);
      const createdNodeIds: string[] = [];

      for (const node of validatedNodes) {
        try {
          await nodeStore.storeNode(node);
          createdNodeIds.push(node.id);
          console.log(`Stored node: ${node.id}`);
        } catch (error: any) {
          console.warn(`Failed to store node ${node.id}:`, error.message);
        }
      }

      // 4. Create parent-child edges (derived_from type)
      const parentChildEdges = await this.createParentChildEdges(
        validatedNodes
      );

      let edgeCount = 0;
      for (const edge of parentChildEdges) {
        try {
          await addEdge(".", edge);
          edgeCount++;
          console.log(`Created parent-child edge: ${edge.src} -> ${edge.dst}`);
        } catch (error: any) {
          console.warn(`Failed to create parent-child edge:`, error.message);
        }
      }

      // 5. Run EdgeEngine on new nodes for hard/soft edges
      console.log("Running EdgeEngine on breakdown nodes...");
      const edgeEngine = getEdgeEngine();
      const edgeResult = await edgeEngine.inferEdges(createdNodeIds);

      edgeCount += edgeResult.totalEdgesCreated;

      console.log(
        `Breakdown complete: ${createdNodeIds.length} nodes, ${edgeCount} edges total`
      );

      return {
        created_node_ids: createdNodeIds,
        created_edge_count: edgeCount,
        root_id: llmResponse.root_id,
        total_nodes: createdNodeIds.length,
      };
    } catch (error: any) {
      console.error("Breakdown failed:", error.message);
      throw error;
    }
  }
}

/**
 * Default BreakdownEngine instance
 */
let defaultBreakdownEngine: BreakdownEngine | null = null;

export function getBreakdownEngine(): BreakdownEngine {
  if (!defaultBreakdownEngine) {
    defaultBreakdownEngine = new BreakdownEngine();
  }
  return defaultBreakdownEngine;
}

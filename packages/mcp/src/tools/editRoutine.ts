import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { ReploClient } from "../upstream/reploClient.js";
import { jsonContent, toolError } from "./helpers.js";
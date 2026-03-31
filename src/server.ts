import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { config } from "./config.js";
import { createCheckfrontClient } from "./checkfront/client.js";
import { registerBookingTools } from "./tools/bookings.js";

export const server = new McpServer({
  name: "checkfront",
  version: "0.1.0",
});

const client = createCheckfrontClient(config);

registerBookingTools(server, client);

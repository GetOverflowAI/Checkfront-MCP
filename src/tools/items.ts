import { appendFileSync } from "node:fs";
import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { CheckfrontClient } from "../checkfront/client.js";
import type { ItemResponse } from "../checkfront/types.js";

function log(msg: string) {
  appendFileSync("/tmp/checkfront-mcp.log", `${new Date().toISOString()} ${msg}\n`);
}

export function registerItemTools(
  server: McpServer,
  client: CheckfrontClient
): void {
  server.registerTool(
    "get_item",
    {
      description:
        "Retrieve details for a single Checkfront item. Pass booking dates to get a rated response with pricing, availability, and a slip for booking.",
      inputSchema: {
        item_id: z.string().describe("The unique item_id of the item to query"),
        start_date: z
          .string()
          .optional()
          .describe("(rated) Booking start date"),
        end_date: z
          .string()
          .optional()
          .describe("(rated) Booking end date"),
        date: z
          .string()
          .optional()
          .describe("(rated) Alias of start_date for same-day bookings"),
        start_time: z
          .string()
          .optional()
          .describe("(rated) Start time, used for hourly bookings"),
        end_time: z
          .string()
          .optional()
          .describe("(rated) End time, used for hourly bookings"),
        discount_code: z
          .string()
          .optional()
          .describe("(rated) Discount code to apply to the price"),
        rules: z
          .enum(["soft", "off"])
          .optional()
          .describe(
            "(rated) 'soft' prevents date-based rule errors; 'off' disables rule checking"
          ),
        param: z
          .record(z.string(), z.union([z.string(), z.number()]))
          .optional()
          .describe(
            "(rated) Booking parameters keyed by parameter ID (e.g. { adults: 2, children: 1 })"
          ),
      },
    },
    async ({ item_id, start_date, end_date, date, start_time, end_time, discount_code, rules, param }) => {
      log(`get_item args: ${JSON.stringify({ item_id, start_date, end_date, date, start_time, end_time, discount_code, rules, param })}`);
      const qs = new URLSearchParams();
      if (start_date) qs.set("start_date", start_date);
      if (end_date) qs.set("end_date", end_date);
      if (date) qs.set("date", date);
      if (start_time) qs.set("start_time", start_time);
      if (end_time) qs.set("end_time", end_time);
      if (discount_code) qs.set("discount_code", discount_code);
      if (rules) qs.set("rules", rules);
      if (param) {
        for (const [key, value] of Object.entries(param)) {
          qs.set(`param[${key}]`, String(value));
        }
      }
      const path = qs.size ? `item/${item_id}?${qs}` : `item/${item_id}`;
      const data = await client.get<ItemResponse>(path);
      return {
        content: [{ type: "text", text: JSON.stringify(data.item, null, 2) }],
      };
    }
  );

  server.registerTool(
    "get_item_calendar",
    {
      description:
        "Retrieve availability calendar for a single Checkfront item. Returns a map of dates (YYYYMMDD) to available inventory counts.",
      inputSchema: {
        item_id: z.string().describe("The unique item_id of the item to query"),
        start_date: z.string().optional().describe("Availability range start date"),
        end_date: z.string().optional().describe("Availability range end date"),
      },
    },
    async ({ item_id, start_date, end_date }) => {
      log(`get_item_calendar args: ${JSON.stringify({ item_id, start_date, end_date })}`);
      const qs = new URLSearchParams();
      if (start_date) qs.set("start_date", start_date);
      if (end_date) qs.set("end_date", end_date);
      const path = qs.size ? `item/${item_id}/cal?${qs}` : `item/${item_id}/cal`;
      const data = await client.get<Record<string, unknown>>(path);
      const cal = data["item/cal"] ?? data;
      return {
        content: [{ type: "text", text: JSON.stringify(cal, null, 2) }],
      };
    }
  );

  server.registerTool(
    "get_items_calendar",
    {
      description:
        "Retrieve availability calendar for a set of Checkfront items. Returns a map of dates (YYYYMMDD) to available inventory counts.",
      inputSchema: {
        item_id: z
          .union([z.string(), z.array(z.string())])
          .optional()
          .describe("A single item_id or array of item IDs to query"),
        category_id: z
          .number()
          .int()
          .optional()
          .describe("Filter to items in this category"),
        start_date: z.string().optional().describe("Availability range start date"),
        end_date: z.string().optional().describe("Availability range end date"),
      },
    },
    async ({ item_id, category_id, start_date, end_date }) => {
      log(`get_items_calendar args: ${JSON.stringify({ item_id, category_id, start_date, end_date })}`);
      const qs = new URLSearchParams();
      if (item_id !== undefined) {
        if (Array.isArray(item_id)) {
          for (const id of item_id) {
            qs.append("item_id[]", id);
          }
        } else {
          qs.set("item_id", item_id);
        }
      }
      if (category_id !== undefined) qs.set("category_id", String(category_id));
      if (start_date) qs.set("start_date", start_date);
      if (end_date) qs.set("end_date", end_date);
      const path = qs.size ? `item/cal?${qs}` : "item/cal";
      const data = await client.get<Record<string, unknown>>(path);
      const cal = data["item/cal"] ?? data;
      return {
        content: [{ type: "text", text: JSON.stringify(cal, null, 2) }],
      };
    }
  );
}

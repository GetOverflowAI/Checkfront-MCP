import { appendFileSync } from "node:fs";
import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { CheckfrontClient } from "../checkfront/client.js";

function log(msg: string) {
  appendFileSync("/tmp/checkfront-mcp.log", `${new Date().toISOString()} ${msg}\n`);
}
import type { BookingListResponse, BookingResponse } from "../checkfront/types.js";

export function registerBookingTools(
  server: McpServer,
  client: CheckfrontClient
): void {
  server.registerTool(
    "list_bookings",
    {
      description: "List bookings from Checkfront with optional filters",
      inputSchema: {
        status_id: z.string().optional().describe("Filter by booking status"),
        customer_id: z.string().optional().describe("Filter by customer ID"),
        customer_email: z.string().optional().describe("Filter by customer email"),
        start_date: z
          .string()
          .optional()
          .describe("Filter by booking start date. Accepts date strings or unix timestamps. Prefix with '<' or '>' to match before or after."),
        end_date: z
          .string()
          .optional()
          .describe("Filter by booking end date. Accepts date strings or unix timestamps. Prefix with '<' or '>' to match before or after."),
        created_date: z
          .string()
          .optional()
          .describe("Filter by booking creation date. Accepts date strings or unix timestamps. Prefix with '<' or '>' to match before or after."),
        last_modified: z
          .string()
          .optional()
          .describe("Filter by last modified date. Accepts date strings or unix timestamps. Prefix with '<' or '>' to match before or after."),
        limit: z.number().int().positive().optional().describe("Number of bookings to return per page (default: 100)"),
        page: z.number().int().positive().optional().describe("Page of results to return"),
      },
    },
    async ({ status_id, customer_id, customer_email, start_date, end_date, created_date, last_modified, limit, page }) => {
      log(`list_bookings args: ${JSON.stringify({ status_id, customer_id, customer_email, start_date, end_date, created_date, last_modified, limit, page })}`);
      const qs = new URLSearchParams();
      if (status_id) qs.set("status_id", status_id);
      if (customer_id) qs.set("customer_id", customer_id);
      if (customer_email) qs.set("customer_email", customer_email);
      if (start_date) qs.set("start_date", start_date);
      if (end_date) qs.set("end_date", end_date);
      if (created_date) qs.set("created_date", created_date);
      if (last_modified) qs.set("last_modified", last_modified);
      if (limit) qs.set("limit", String(limit));
      if (page) qs.set("page", String(page));
      const path = qs.size ? `booking?${qs}` : "booking";

      const data = await client.get<BookingListResponse>(path);
      const bookings = data["booking/index"] ?? {};

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              {
                total_records: data.request?.records ?? bookings.length,
                page: data.request?.page ?? 1,
                pages: data.request?.pages ?? 1,
                bookings,
              },
              null,
              2
            ),
          },
        ],
      };
    }
  );

  server.registerTool(
    "get_booking",
    {
      description: "Retrieve a single booking by its ID",
      inputSchema: {
        booking_id: z.string().describe("The Checkfront booking ID"),
      },
    },
    async ({ booking_id }) => {
      const data = await client.get<BookingResponse>(`booking/${booking_id}`);
      return {
        content: [{ type: "text", text: JSON.stringify(data.booking, null, 2) }],
      };
    }
  );


}

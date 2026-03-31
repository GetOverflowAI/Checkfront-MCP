import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { CheckfrontClient } from "../checkfront/client.js";
import type {
  BookingListResponse,
  BookingResponse,
} from "../checkfront/types.js";

export function registerBookingTools(
  server: McpServer,
  client: CheckfrontClient
): void {
  server.tool(
    "list_bookings",
    "List bookings from Checkfront with optional filters",
    {
      status: z
        .enum(["PENDING", "CONFIRMED", "CANCELLED", "REFUNDED", "FAILED"])
        .optional()
        .describe("Filter by booking status"),
      start_date: z
        .string()
        .optional()
        .describe("Filter bookings starting on or after this date (YYYYMMDD)"),
      end_date: z
        .string()
        .optional()
        .describe("Filter bookings ending on or before this date (YYYYMMDD)"),
      page: z
        .number()
        .int()
        .positive()
        .optional()
        .describe("Page number for pagination (default: 1)"),
    },
    async ({ status, start_date, end_date, page }) => {
      const params: Record<string, string> = {};
      if (status) params["status"] = status;
      if (start_date) params["start_date"] = start_date;
      if (end_date) params["end_date"] = end_date;
      if (page) params["page"] = String(page);

      const data = await client.get<BookingListResponse>("booking", params);
      const bookings = Object.values(data.booking ?? {});

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

  server.tool(
    "get_booking",
    "Retrieve a single booking by its ID",
    {
      booking_id: z.string().describe("The Checkfront booking ID"),
    },
    async ({ booking_id }) => {
      const data = await client.get<BookingResponse>(`booking/${booking_id}`);
      return {
        content: [{ type: "text", text: JSON.stringify(data.booking, null, 2) }],
      };
    }
  );

  server.tool(
    "create_booking",
    "Create a new booking in Checkfront",
    {
      item_id: z.string().describe("The item/package ID to book"),
      start_date: z.string().describe("Start date (YYYYMMDD)"),
      end_date: z.string().describe("End date (YYYYMMDD)"),
      qty: z.number().int().positive().describe("Number of units to book"),
      customer_name: z.string().describe("Full name of the customer"),
      customer_email: z.string().email().describe("Customer email address"),
      customer_phone: z.string().optional().describe("Customer phone number"),
      note: z.string().optional().describe("Internal note for the booking"),
    },
    async ({
      item_id,
      start_date,
      end_date,
      qty,
      customer_name,
      customer_email,
      customer_phone,
      note,
    }) => {
      const body: Record<string, unknown> = {
        item_id,
        start_date,
        end_date,
        qty,
        customer: {
          name: customer_name,
          email: customer_email,
          ...(customer_phone ? { phone: customer_phone } : {}),
        },
        ...(note ? { note } : {}),
      };

      const data = await client.post<BookingResponse>("booking", body);
      return {
        content: [{ type: "text", text: JSON.stringify(data.booking, null, 2) }],
      };
    }
  );

  server.tool(
    "update_booking",
    "Update an existing booking in Checkfront",
    {
      booking_id: z.string().describe("The Checkfront booking ID to update"),
      status: z
        .enum(["PENDING", "CONFIRMED", "CANCELLED"])
        .optional()
        .describe("New status for the booking"),
      note: z.string().optional().describe("Updated internal note"),
    },
    async ({ booking_id, status, note }) => {
      const body: Record<string, unknown> = {};
      if (status) body["status"] = status;
      if (note) body["note"] = note;

      const data = await client.put<BookingResponse>(`booking/${booking_id}`, body);
      return {
        content: [{ type: "text", text: JSON.stringify(data.booking, null, 2) }],
      };
    }
  );
}

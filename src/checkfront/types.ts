export interface BookingGuest {
  name: string;
  email: string;
  phone?: string;
}

export interface BookingItem {
  item_id: string;
  name: string;
  qty: number;
  start_date: string;
  end_date: string;
}

export interface Booking {
  booking_id: number;
  code: string;
  customer_id: string;
  status: BookingStatus;
  status_id: number;
  date: string;
  start_date: string;
  end_date: string;
  total: number;
  currency: string;
  customer: BookingGuest;
  items?: BookingItem[];
  note?: string;
}

export type BookingStatus =
  | "PENDING"
  | "CONFIRMED"
  | "CANCELLED"
  | "REFUNDED"
  | "FAILED";

export interface BookingListResponse {
  request: {
    records: number;
    pages: number;
    page: number;
  };
  "booking/index": Record<string, Booking>;
}

export interface BookingResponse {
  booking: Booking;
}

export interface Item {
  item_id: string;
  name: string;
  [key: string]: unknown;
}

export interface ItemResponse {
  item: Item;
}

// Calendar: date string (YYYYMMDD) -> availability count (or 1 for public API)
export interface ItemCalendarResponse {
  "item/cal": Record<string, number>;
}

export interface CheckfrontError {
  error: {
    code: number;
    message: string;
  };
}

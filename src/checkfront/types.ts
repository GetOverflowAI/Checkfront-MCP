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
  booking_id: string;
  code: string;
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
  booking: Record<string, Booking>;
}

export interface BookingResponse {
  booking: Booking;
}

export interface CheckfrontError {
  error: {
    code: number;
    message: string;
  };
}

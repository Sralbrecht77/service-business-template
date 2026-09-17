export type BookingStatus =
  | "pending"
  | "confirmed"
  | "completed"
  | "cancelled";

export type Database = {
  public: {
    Tables: {
      admin_users: {
        Row: {
          user_id: string;
          created_at: string;
        };
        Insert: {
          user_id: string;
          created_at?: string;
        };
        Update: {
          user_id?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "admin_users_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: true;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      bookings: {
        Row: {
          id: string;
          created_at: string;
          status: BookingStatus;
          customer_name: string;
          customer_email: string;
          customer_phone: string;
          requested_date: string;
          requested_time: string;
          pickup_address: string;
          destination_address: string;
          crew_size: number;
          estimated_hours: number;
          round_trip_miles: number;
          hourly_rate: number;
          estimated_labor_cost: number;
          travel_fee: number | null;
          estimated_base_total: number | null;
          has_piano: boolean;
          has_gun_safe: boolean;
          has_heavy_item: boolean;
          has_excessive_stairs: boolean;
          has_long_carry: boolean;
          move_notes: string | null;
        };
        Insert: {
          id?: string;
          created_at?: string;
          status?: BookingStatus;
          customer_name: string;
          customer_email: string;
          customer_phone: string;
          requested_date: string;
          requested_time: string;
          pickup_address: string;
          destination_address: string;
          crew_size: number;
          estimated_hours: number;
          round_trip_miles: number;
          hourly_rate: number;
          estimated_labor_cost: number;
          travel_fee: number | null;
          estimated_base_total: number | null;
          has_piano?: boolean;
          has_gun_safe?: boolean;
          has_heavy_item?: boolean;
          has_excessive_stairs?: boolean;
          has_long_carry?: boolean;
          move_notes?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["bookings"]["Insert"]>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};

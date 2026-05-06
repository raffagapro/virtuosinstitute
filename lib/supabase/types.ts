export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

// Temporary baseline until generated DB types are introduced.
export interface Database {
  public: {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    Tables: Record<string, any>;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    Views: Record<string, any>;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    Functions: Record<string, any>;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    Enums: Record<string, any>;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    CompositeTypes: Record<string, any>;
  };
}

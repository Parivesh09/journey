export type LinqRequest = {
  to: string[];
  message: {
    preferred_service: "SMS" | "WHATSAPP";
    parts: Array<{ type: "text"; value: string }>;
  };
};

export type LinqResponse = {
  success: boolean;
  id?: string;
  status?: string;
  message?: string;
  error?: {
    code?: string;
    message?: string;
  };
};

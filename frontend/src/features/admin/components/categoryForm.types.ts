export type CategoryFormState = {
  name: string;
  format: "INDIVIDUAL" | "DUO_FIXED" | "DUO_RANDOM";
  entryFee: string;
  maxSlots: string;
  registrationDeadline: string;
  reservationTtlMinutes: string;
  refundFullBeforeDays: string;
  refundPartialBeforeDays: string;
  refundPartialPercent: string;
  cancellationDeadlineHours: string;
};

export const EMPTY_CATEGORY_FORM: CategoryFormState = {
  name: "",
  format: "INDIVIDUAL",
  entryFee: "",
  maxSlots: "",
  registrationDeadline: "",
  reservationTtlMinutes: "20",
  refundFullBeforeDays: "",
  refundPartialBeforeDays: "",
  refundPartialPercent: "",
  cancellationDeadlineHours: "48",
};

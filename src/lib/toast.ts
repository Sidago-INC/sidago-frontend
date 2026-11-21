import { toast } from "react-toastify";

type ToastError = {
  response?: {
    data?: {
      message?: string | string[];
      error?: {
        message?: string | string[];
        code?: string;
      };
    };
  };
  message?: string | string[] | unknown;
  error?: {
    message?: string | string[];
    code?: string;
  };
};

function normalizeErrorMessage(value: unknown): string | null {
  if (value == null) {
    return null;
  }

  if (typeof value === "string") {
    return value;
  }

  if (Array.isArray(value)) {
    const parts = value
      .map((item) => normalizeErrorMessage(item))
      .filter((item): item is string => Boolean(item));

    return parts.length > 0 ? parts.join("\n") : null;
  }

  if (typeof value === "object") {
    const record = value as {
      message?: unknown;
      error?: { message?: unknown };
    };

    return (
      normalizeErrorMessage(record.message) ??
      normalizeErrorMessage(record.error?.message)
    );
  }

  return String(value);
}

export const getErrorMessage = (error: unknown): string => {
  const typedError = error as ToastError | undefined;

  return (
    normalizeErrorMessage(typedError?.response?.data?.error?.message) ??
    normalizeErrorMessage(typedError?.response?.data?.message) ??
    normalizeErrorMessage(typedError?.error?.message) ??
    normalizeErrorMessage(typedError?.message) ??
    "Something went wrong"
  );
};

export const showErrorToast = (error: unknown) => {
  const message = getErrorMessage(error);
  toast.error(message, { style: { whiteSpace: "pre-line" } });
};

export const showSuccessToast = (message?: string) => {
  toast.success(message || "Operation successful", {
    style: { whiteSpace: "pre-line" },
  });
};

export const showInfoToast = (message: string) => {
  toast.info(message, { style: { whiteSpace: "pre-line" } });
};

export const showPromiseToast = async <T>(
  promise: Promise<T>,
  messages?: {
    pending?: string;
    success?: string;
    error?: string;
  },
): Promise<T> => {
  return toast.promise(
    promise,
    {
      pending: messages?.pending || "Processing...",
      success: messages?.success || "Done successfully",
      error: {
        render({ data }) {
          return getErrorMessage(data);
        },
      },
    },
    { style: { whiteSpace: "pre-line" } },
  );
};

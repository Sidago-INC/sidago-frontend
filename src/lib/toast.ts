import { toast } from "react-toastify";

type ToastError = {
  response?: {
    data?: {
      message?: string | string[];
    };
  };
  message?: string | string[];
};

export const getErrorMessage = (error: unknown): string => {
  const typedError = error as ToastError | undefined;
  const msg =
    typedError?.response?.data?.message ||
    typedError?.message ||
    "Something went wrong";

  if (Array.isArray(msg)) {
    return msg.map((m: string) => `${m}`).join("\n");
  }
  return msg;
};

// 🔴 Error Toast
export const showErrorToast = (error: unknown) => {
  const message = getErrorMessage(error);
  toast.error(message, {
    style: { whiteSpace: "pre-line" },
  });
};

// ✅ Success Toast
export const showSuccessToast = (message?: string) => {
  toast.success(message || "Operation successful ✅", {
    style: { whiteSpace: "pre-line" },
  });
};

// ℹ️ Info Toast
export const showInfoToast = (message: string) => {
  toast.info(message, {
    style: { whiteSpace: "pre-line" },
  });
};

// 🔄 Promise Toast
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
      success: messages?.success || "Done successfully ✅",
      error: {
        render({ data }) {
          return getErrorMessage(data);
        },
      },
    },
    {
      style: { whiteSpace: "pre-line" },
    },
  );
};

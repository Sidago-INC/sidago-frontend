export type Rule = (value: string) => string | null;

// ---------------- RULES ----------------
export const required = (msg = "This field is required"): Rule => {
  return (value) => (!value.trim() ? msg : null);
};

export const email = (msg = "Invalid email address"): Rule => {
  return (value) =>
    value.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())
      ? msg
      : null;
};

export const minLength = (len: number, msg?: string): Rule => {
  return (value) =>
    value.trim() && value.trim().length < len
      ? msg || `Minimum ${len} characters`
      : null;
};

export const maxLength = (len: number, msg?: string): Rule => {
  return (value) =>
    value.trim() && value.trim().length > len
      ? msg || `Maximum ${len} characters`
      : null;
};

export const pattern = (regex: RegExp, msg = "Invalid format"): Rule => {
  return (value) => (value.trim() && !regex.test(value.trim()) ? msg : null);
};

export const url = (msg = "Invalid URL"): Rule => {
  return (value) => {
    const trimmedValue = value.trim();
    if (!trimmedValue) return null;

    try {
      const parsed = new URL(trimmedValue);
      return parsed.protocol === "http:" || parsed.protocol === "https:"
        ? null
        : msg;
    } catch {
      return msg;
    }
  };
};

export const match = (
  getValue: () => string,
  message = "Values do not match",
) => {
  return (value: string): string | null => {
    if (value !== getValue()) {
      return message;
    }
    return null;
  };
};
// ---------------- VALIDATOR ----------------
export function validateField(value: string, rules: Rule[]) {
  for (const rule of rules) {
    const error = rule(value);
    if (error) return error;
  }
  return null;
}

export function validateForm<T extends Record<string, string>>(
  values: T,
  schema: Record<keyof T, Rule[]>,
) {
  const errors: Partial<Record<keyof T, string>> = {};

  for (const key in schema) {
    const error = validateField(values[key], schema[key]);
    if (error) errors[key] = error;
  }

  return errors;
}

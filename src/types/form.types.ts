export type CallsFormState = {
  email: string;
  notes: string;
  callBackDate: string;
  leadType: string;
  contactType: string;
  notWorkAnymore: boolean;
};

export type CallsModalState = {
  title: string;
  message: string;
  direction?: "top" | "bottom" | "left" | "right" | "center";
};

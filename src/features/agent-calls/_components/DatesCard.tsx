import { Clock4, Wrench } from "lucide-react";
import { CardShell } from "@/components/ui/CardShell";
import { SectionLabel } from "@/components/ui/SectionLabel";
import { DatePickerField } from "./DatePickerField";
import { DateReadonlyRow } from "./DateReadonlyRow";

type Props = {
  callBackDate: string;
  lastCalledDate: string;
  lastFixedDate: string;
  onChangeCallBackDate: (value: string) => void;
};

export function DatesCard({
  callBackDate,
  lastCalledDate,
  lastFixedDate,
  onChangeCallBackDate,
}: Props) {
  return (
    <CardShell className="space-y-3">
      <SectionLabel>Dates</SectionLabel>

      <DatePickerField
        label="Call Back Date"
        value={callBackDate}
        onChange={onChangeCallBackDate}
      />

      <DateReadonlyRow
        icon={Clock4}
        label="Last Called"
        value={lastCalledDate}
      />
      <DateReadonlyRow
        icon={Wrench}
        label="Last Fixed Date"
        value={lastFixedDate}
      />
    </CardShell>
  );
}

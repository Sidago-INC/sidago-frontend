import { useEffect, useState } from "react";
import { CheckboxInput, Modal, Select, TextInput } from "@/components/ui";
import { showErrorToast, showSuccessToast } from "@/lib/toast";
import {
  toSlug,
  useCreateBrand,
  useUpdateBrand,
  type ManagedBrand,
  type Organization,
} from "../_lib/hooks";

type Props = {
  isOpen: boolean;
  organization: Organization | null;
  brand: ManagedBrand | null;
  brands: ManagedBrand[];
  onClose: () => void;
};

const inputClassName = "h-10 rounded text-sm";

export function BrandFormModal({ isOpen, organization, brand, brands, onClose }: Props) {
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [codeEdited, setCodeEdited] = useState(false);
  const [parentId, setParentId] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const createBrand = useCreateBrand(organization?.id ?? "");
  const updateBrand = useUpdateBrand();
  const isSaving = createBrand.isPending || updateBrand.isPending;

  useEffect(() => {
    if (!isOpen) return;
    setName(brand?.displayName ?? "");
    setCode(brand?.code ?? "");
    setCodeEdited(false);
    setParentId(brand?.parentBrandId ?? "");
    setIsActive(brand?.isActive ?? true);
    setErrors({});
  }, [isOpen, brand]);

  // Sub-brands go one level deep, so only main brands can be parents.
  const parentOptions = [
    { label: "None (main brand)", value: "" },
    ...brands
      .filter((b) => !b.parentBrandId && b.id !== brand?.id && b.isActive)
      .map((b) => ({ label: b.displayName, value: b.id })),
  ];

  const handleSave = async () => {
    const nextErrors: Record<string, string> = {};
    if (!name.trim()) nextErrors.name = "Brand name is required";
    if (!brand && !/^[a-z0-9]+(-[a-z0-9]+)*$/.test(code)) {
      nextErrors.code = "Use lowercase letters, numbers and single hyphens";
    }
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    try {
      if (brand) {
        await updateBrand.mutateAsync({
          id: brand.id,
          displayName: name.trim(),
        });
        showSuccessToast("Brand updated");
      } else {
        await createBrand.mutateAsync({
          displayName: name.trim(),
          code,
          parentBrandId: parentId || undefined,
          isActive,
        });
        showSuccessToast("Brand created");
      }
      onClose();
    } catch (error) {
      showErrorToast(error);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      title={brand ? "Edit Brand" : "Add Brand"}
      onClose={onClose}
      primaryAction={{
        label: isSaving ? "Saving..." : brand ? "Save Changes" : "Create Brand",
        onClick: () => void handleSave(),
      }}
      secondaryAction={{ label: "Cancel", onClick: onClose }}
    >
      <div className="grid gap-4 text-left">
        <TextInput
          label="Company"
          value={organization?.displayName ?? ""}
          disabled
          className={inputClassName}
        />
        <TextInput
          label="Brand name"
          value={name}
          onChange={(event) => {
            setName(event.target.value);
            if (!brand && !codeEdited) setCode(toSlug(event.target.value).slice(0, 32));
          }}
          error={errors.name}
          required
          className={inputClassName}
        />
        <div className="grid gap-1">
          <TextInput
            label="Brand code"
            value={code}
            onChange={(event) => {
              setCode(event.target.value);
              setCodeEdited(true);
            }}
            error={errors.code}
            disabled={Boolean(brand)}
            maxLength={32}
            required
            className={inputClassName}
          />
          {!brand && (
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Can't be changed after creation
            </p>
          )}
        </div>
        <Select
          label="Parent brand"
          options={parentOptions}
          value={parentId}
          onChange={(value) => setParentId(String(value))}
          disabled={Boolean(brand)}
          floatingOptions
          // The modal sits at z-index 1000, above the dropdown's default layer.
          optionsClassName="z-[1200]!"
        />
        {!brand && (
          <CheckboxInput
            label="Active"
            checked={isActive}
            onChange={(event) => setIsActive(event.target.checked)}
          />
        )}
      </div>
    </Modal>
  );
}

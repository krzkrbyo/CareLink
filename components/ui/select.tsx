"use client";

import * as React from "react";
import * as SelectPrimitive from "@radix-ui/react-select";
import { Check, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

type ParsedOption = {
  value: string;
  label: React.ReactNode;
  disabled?: boolean;
};

function parseOptionChildren(children: React.ReactNode): ParsedOption[] {
  const options: ParsedOption[] = [];

  React.Children.forEach(children, (child) => {
    if (!React.isValidElement<{ value?: string; disabled?: boolean; children?: React.ReactNode }>(child)) {
      return;
    }
    if (child.type !== "option") return;

    options.push({
      value: String(child.props.value ?? ""),
      label: child.props.children ?? child.props.value ?? "",
      disabled: child.props.disabled,
    });
  });

  return options;
}

function defaultFromOptions(options: ParsedOption[], fallback?: string | number | readonly string[]) {
  if (fallback !== undefined && fallback !== "") return String(fallback);
  return options.find((o) => o.value !== "")?.value ?? "";
}

export interface SelectProps
  extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, "onChange" | "size"> {
  inputSize?: "default" | "sm" | "lg";
  onChange?: React.ChangeEventHandler<HTMLSelectElement>;
  placeholder?: string;
}

const Select = React.forwardRef<HTMLButtonElement, SelectProps>(
  (
    {
      className,
      inputSize = "default",
      disabled,
      children,
      value,
      defaultValue,
      onChange,
      name,
      required,
      id,
      placeholder,
    },
    ref
  ) => {
    const options = React.useMemo(() => parseOptionChildren(children), [children]);
    const emptyOption = options.find((o) => o.value === "");
    const items = options.filter((o) => o.value !== "");

    const [internalValue, setInternalValue] = React.useState(() =>
      defaultFromOptions(options, value ?? defaultValue)
    );

    React.useEffect(() => {
      if (value !== undefined) {
        setInternalValue(String(value));
      }
    }, [value]);

    const currentValue = value !== undefined ? String(value) : internalValue;
    const selected = options.find((o) => o.value === currentValue);
    const resolvedPlaceholder = placeholder ?? emptyOption?.label ?? "Seleccionar…";

    function emitChange(next: string) {
      if (value === undefined) setInternalValue(next);
      onChange?.({
        target: { value: next, name: name ?? "" },
      } as React.ChangeEvent<HTMLSelectElement>);
    }

    const triggerClass = cn(
      "care-input flex w-full items-center justify-between gap-2 text-left",
      inputSize === "sm" && "care-input-sm min-h-0 py-2",
      inputSize === "lg" && "care-input-lg",
      disabled && "care-input-disabled",
      !selected && "text-care-muted-light",
      className
    );

    if (items.length === 0) return null;

    return (
      <>
        {name && (
          <input
            type="hidden"
            name={name}
            value={currentValue}
            required={required && !currentValue}
          />
        )}
        <SelectPrimitive.Root
          value={currentValue || undefined}
          onValueChange={emitChange}
          disabled={disabled}
          required={required}
        >
          <SelectPrimitive.Trigger ref={ref} id={id} className={triggerClass}>
            <SelectPrimitive.Value placeholder={String(resolvedPlaceholder)}>
              {selected?.label}
            </SelectPrimitive.Value>
            <SelectPrimitive.Icon asChild>
              <ChevronDown className="h-5 w-5 shrink-0 text-care-accent-dark" aria-hidden />
            </SelectPrimitive.Icon>
          </SelectPrimitive.Trigger>

          <SelectPrimitive.Portal>
            <SelectPrimitive.Content
              position="popper"
              sideOffset={6}
              className={cn(
                "z-[100] max-h-[min(20rem,var(--radix-select-content-available-height))] overflow-hidden",
                "rounded-2xl border-2 border-care-secondary/60 bg-white shadow-xl",
                "data-[state=open]:animate-in data-[state=closed]:animate-out",
                "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
                "data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95"
              )}
            >
              <SelectPrimitive.Viewport
                className={cn(
                  "p-1.5",
                  inputSize === "sm" ? "min-w-[var(--radix-select-trigger-width)]" : "min-w-[var(--radix-select-trigger-width)]"
                )}
              >
                {items.map((option) => (
                  <SelectPrimitive.Item
                    key={option.value}
                    value={option.value}
                    disabled={option.disabled}
                    className={cn(
                      "relative flex cursor-pointer select-none items-center rounded-xl py-2.5 pl-3 pr-9 text-base outline-none transition-colors",
                      "text-care-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-40",
                      "data-[highlighted]:bg-care-secondary/50 data-[highlighted]:text-care-foreground",
                      "data-[state=checked]:bg-care-accent-dark data-[state=checked]:text-white",
                      "data-[state=checked]:data-[highlighted]:bg-care-accent-darker",
                      inputSize === "sm" && "py-2 text-sm"
                    )}
                  >
                    <SelectPrimitive.ItemText>{option.label}</SelectPrimitive.ItemText>
                    <SelectPrimitive.ItemIndicator className="absolute right-2.5 flex h-4 w-4 items-center justify-center">
                      <Check className="h-4 w-4" strokeWidth={3} />
                    </SelectPrimitive.ItemIndicator>
                  </SelectPrimitive.Item>
                ))}
              </SelectPrimitive.Viewport>
            </SelectPrimitive.Content>
          </SelectPrimitive.Portal>
        </SelectPrimitive.Root>
      </>
    );
  }
);
Select.displayName = "Select";

export { Select };

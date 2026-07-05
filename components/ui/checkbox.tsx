import * as React from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type"> {
  label?: string;
  description?: string;
}

const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, label, description, id, disabled, ...props }, ref) => {
    const generatedId = React.useId();
    const inputId = id ?? generatedId;

    return (
      <label
        htmlFor={inputId}
        className={cn(
          "group flex cursor-pointer items-start gap-3 rounded-xl border-2 border-care-secondary/50 bg-care-primary/30 p-4 transition-colors hover:border-care-accent/40 hover:bg-care-primary/50",
          disabled && "cursor-not-allowed opacity-60",
          className
        )}
      >
        <span className="relative mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center">
          <input
            ref={ref}
            id={inputId}
            type="checkbox"
            disabled={disabled}
            className="peer sr-only"
            {...props}
          />
          <span
            className={cn(
              "flex h-5 w-5 items-center justify-center rounded-md border-2 border-care-secondary bg-white transition-all",
              "peer-focus-visible:ring-4 peer-focus-visible:ring-care-accent/25",
              "peer-checked:border-care-accent-dark peer-checked:bg-care-accent-dark",
              "group-has-[:checked]:border-care-accent-dark group-has-[:checked]:bg-care-accent-dark"
            )}
          >
            <Check className="h-3.5 w-3.5 text-white opacity-0 transition-opacity group-has-[:checked]:opacity-100" />
          </span>
        </span>
        {(label || description) && (
          <span className="min-w-0">
            {label && <span className="block font-semibold text-care-foreground">{label}</span>}
            {description && <span className="block text-sm text-care-muted">{description}</span>}
          </span>
        )}
      </label>
    );
  }
);
Checkbox.displayName = "Checkbox";

export { Checkbox };

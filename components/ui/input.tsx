"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { DatePicker } from "@/components/ui/date-picker";
import { DateTimePicker } from "@/components/ui/datetime-picker";
import { TimePicker } from "@/components/ui/time-picker";

export interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type"> {
  type?: React.InputHTMLAttributes<HTMLInputElement>["type"];
  inputSize?: "default" | "sm" | "lg";
}

function emitChange(
  onChange: React.ChangeEventHandler<HTMLInputElement> | undefined,
  name: string | undefined,
  value: string
) {
  if (!onChange) return;
  onChange({
    target: { value, name: name ?? "" },
  } as React.ChangeEvent<HTMLInputElement>);
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      type = "text",
      inputSize = "default",
      disabled,
      value,
      onChange,
      onBlur,
      min,
      max,
      required,
      id,
      name,
      placeholder,
      ...props
    },
    ref
  ) => {
    const stringValue = value === undefined || value === null ? "" : String(value);

    if (type === "date") {
      return (
        <DatePicker
          id={id}
          name={name}
          value={stringValue}
          onChange={(v) => emitChange(onChange, name, v)}
          onBlur={onBlur as React.FocusEventHandler<HTMLButtonElement>}
          min={min as string | undefined}
          max={max as string | undefined}
          disabled={disabled}
          required={required}
          placeholder={placeholder}
          inputSize={inputSize}
          className={className}
        />
      );
    }

    if (type === "time") {
      return (
        <TimePicker
          id={id}
          name={name}
          value={stringValue}
          onChange={(v) => emitChange(onChange, name, v)}
          onBlur={onBlur as React.FocusEventHandler<HTMLButtonElement>}
          disabled={disabled}
          required={required}
          placeholder={placeholder}
          inputSize={inputSize}
          className={className}
        />
      );
    }

    if (type === "datetime-local") {
      return (
        <DateTimePicker
          id={id}
          name={name}
          value={stringValue}
          onChange={(v) => emitChange(onChange, name, v)}
          onBlur={onBlur as React.FocusEventHandler<HTMLButtonElement>}
          min={min as string | undefined}
          max={max as string | undefined}
          disabled={disabled}
          required={required}
          placeholder={placeholder}
          inputSize={inputSize}
          className={className}
        />
      );
    }

    const inputClassName = cn(
      "care-input",
      inputSize === "sm" && "care-input-sm",
      inputSize === "lg" && "care-input-lg",
      disabled && "care-input-disabled",
      className
    );

    return (
      <input
        ref={ref}
        type={type}
        disabled={disabled}
        value={value}
        onChange={onChange}
        onBlur={onBlur}
        min={min}
        max={max}
        required={required}
        id={id}
        name={name}
        placeholder={placeholder}
        className={inputClassName}
        {...props}
      />
    );
  }
);
Input.displayName = "Input";

export { Input };

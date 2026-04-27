import type { InputHTMLAttributes } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  help?: string;
  error?: string;
}

export default function Input({
  label,
  help,
  error,
  className = "",
  ...props
}: InputProps) {
  return (
    <div className="mb-3">
      {label && (
        <label className="form-label">
          {label}
          {props.required && <span className="text-danger ms-1">*</span>}
        </label>
      )}
      <input
        className={`form-control ${error ? 'is-invalid' : ''} ${className}`}
        {...props}
      />
      {help && <small className="form-text text-muted">{help}</small>}
      {error && <div className="invalid-feedback">{error}</div>}
    </div>
  );
}
import type { ReactNode } from "react";

interface FormWrapperProps {
  title: string;
  onSubmit: (e: React.FormEvent) => void;
  onCancel?: () => void;
  children: ReactNode;
  isLoading?: boolean;
  submitLabel?: string;
}

export default function FormWrapper({
  title,
  onSubmit,
  onCancel,
  children,
  isLoading = false,
  submitLabel = "Save",
}: FormWrapperProps) {
  return (
    <div className="card-box">
      <h4 className="fw-bold mb-4">{title}</h4>
      
      <form onSubmit={onSubmit}>
        {children}
        
        <div className="d-flex gap-2 mt-4">
          <button
            type="submit"
            className="btn btn-primary"
            disabled={isLoading}
          >
            {isLoading ? "Saving..." : submitLabel}
          </button>
          
          {onCancel && (
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onCancel}
              disabled={isLoading}
            >
              Cancel
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
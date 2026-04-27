import type { ButtonHTMLAttributes } from "react";

export default function Button({
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      className={`inline-flex items-center justify-center rounded-xl border px-3 py-2 text-sm font-medium shadow-sm transition hover:bg-gray-50 active:scale-[0.99] disabled:opacity-50 ${className}`}
      {...props}
    />
  );
}

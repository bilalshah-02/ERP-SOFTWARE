import type { SelectHTMLAttributes } from "react";

export default function Select({
  className = "",
  ...props
}: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={`h-10 w-full rounded-xl border bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-gray-200 ${className}`}
      {...props}
    />
  );
}

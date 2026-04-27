import type { PropsWithChildren } from "react";

export function Table({ children }: PropsWithChildren) {
  return (
    <div className="overflow-hidden rounded-2xl border bg-white shadow-sm">
      <div className="overflow-auto">
        <table className="min-w-full text-left text-sm">{children}</table>
      </div>
    </div>
  );
}

export function Th({ children }: PropsWithChildren) {
  return (
    <th className="whitespace-nowrap border-b bg-gray-50 px-4 py-3 text-xs font-semibold uppercase text-gray-500">
      {children}
    </th>
  );
}

export function Td({ children }: PropsWithChildren) {
  return <td className="whitespace-nowrap border-b px-4 py-3">{children}</td>;
}

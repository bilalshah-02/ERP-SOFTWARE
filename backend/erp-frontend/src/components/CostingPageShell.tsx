import type { PropsWithChildren } from "react";
import Button from "./ui/Button";
import Input from "./ui/Input";
import Select from "./ui/Select";
import Stat from "./ui/Stat";

export default function CostingPageShell({
  title,
  subtitle,
  children,
}: PropsWithChildren<{ title: string; subtitle?: string }>) {
  return (
    <div className="space-y-5">
      {/* Top bar */}
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div className="min-w-0">
          <h1 className="truncate text-2xl font-bold">{title}</h1>
          {subtitle ? (
            <p className="truncate text-sm text-gray-500">{subtitle}</p>
          ) : null}
        </div>

        <div className="flex flex-wrap gap-2">
          <Button>Export CSV</Button>
          <Button className="bg-gray-900 text-white hover:bg-gray-800">
            Refresh
          </Button>
        </div>
      </div>

      {/* Filters card */}
      <div className="rounded-2xl border bg-white p-4 shadow-sm">
        <div className="grid gap-3 md:grid-cols-4">
          <div>
            <div className="mb-1 text-xs font-semibold text-gray-500">
              Search
            </div>
            <Input placeholder="Search..." />
          </div>

          <div>
            <div className="mb-1 text-xs font-semibold text-gray-500">
              Date From
            </div>
            <Input type="date" />
          </div>

          <div>
            <div className="mb-1 text-xs font-semibold text-gray-500">
              Date To
            </div>
            <Input type="date" />
          </div>

          <div>
            <div className="mb-1 text-xs font-semibold text-gray-500">
              Group By
            </div>
            <Select defaultValue="default">
              <option value="default">Default</option>
              <option value="project">Project</option>
              <option value="product">Product</option>
              <option value="batch">Batch</option>
              <option value="process">Process</option>
            </Select>
          </div>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid gap-3 md:grid-cols-4">
        <Stat label="Rows" value="—" hint="Current result set" />
        <Stat label="Total Cost" value="—" hint="Sum of displayed costs" />
        <Stat label="Total Revenue" value="—" hint="If available" />
        <Stat label="Profit" value="—" hint="Revenue - cost" />
      </div>

      {/* Main content */}
      {children}
    </div>
  );
}

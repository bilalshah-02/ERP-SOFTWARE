import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchProductCosting } from "../../api/costing";

function sumNumbers(rows: any[], keys: string[]) {
  let total = 0;
  for (const r of rows) {
    for (const k of keys) {
      const v = Number(r?.[k]);
      if (!Number.isNaN(v)) total += v;
    }
  }
  return total;
}

export default function ProductCosting() {
  const [search, setSearch] = useState("");

  const q = useQuery({
    queryKey: ["product-costing"],
    queryFn: fetchProductCosting,
  });

  const rows = q.data ?? [];

  // Try to guess useful columns (since DB-first schemas differ)
  const filtered = useMemo(() => {
    const s = search.trim().toLowerCase();
    if (!s) return rows;

    return rows.filter((r: any) => {
      // search across common fields if they exist
      const candidates = [
        r.sku,
        r.code,
        r.product_code,
        r.product_name,
        r.name,
        r.item_name,
        r.method,
        r.costing_method,
      ]
        .filter(Boolean)
        .map((x: any) => String(x).toLowerCase());

      return candidates.some((c) => c.includes(s));
    });
  }, [rows, search]);

  // totals: attempt typical cost keys
  const totalCost = useMemo(() => {
    return sumNumbers(filtered, [
      "avg_cost",
      "average_cost",
      "unit_cost",
      "cost",
      "total_cost",
    ]);
  }, [filtered]);

  // pick columns dynamically (show first few keys)
  const columns = useMemo(() => {
    if (!filtered.length) return [];
    const keys = Object.keys(filtered[0] ?? {});
    // keep it readable: first 6 columns
    return keys.slice(0, 6);
  }, [filtered]);

  return (
    <div className="row g-4">
      {/* Title + Actions */}
      <div className="col-12">
        <div className="card-box d-flex align-items-start justify-content-between gap-3">
          <div>
            <h2 className="fw-bold mb-1">Product Costing</h2>
            <div className="text-muted">Live from /api/product-costing/</div>
          </div>

          <div className="d-flex gap-2">
            <button
              className="btn btn-outline-primary btn-sm"
              onClick={() => {
                // quick CSV export of current filtered rows
                const cols = columns.length ? columns : Object.keys(filtered[0] ?? {});
                const csv = [
                  cols.join(","),
                  ...filtered.map((r: any) =>
                    cols
                      .map((c) => JSON.stringify(r?.[c] ?? ""))
                      .join(",")
                  ),
                ].join("\n");

                const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = "product-costing.csv";
                a.click();
                URL.revokeObjectURL(url);
              }}
              disabled={!filtered.length}
            >
              Export CSV
            </button>

            <button
              className="btn btn-primary btn-sm"
              onClick={() => q.refetch()}
              disabled={q.isFetching}
            >
              {q.isFetching ? "Refreshing..." : "Refresh"}
            </button>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="col-12">
        <div className="card-box">
          <div className="row g-3">
            <div className="col-md-6">
              <label className="form-label fw-semibold">Search</label>
              <input
                className="form-control"
                placeholder="SKU / code / name..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <div className="col-md-3">
              <label className="form-label fw-semibold">Group By</label>
              <select className="form-select" defaultValue="default" disabled>
                <option value="default">Default (MVP)</option>
              </select>
            </div>

            <div className="col-md-3">
              <label className="form-label fw-semibold">Status</label>
              <input
                className="form-control"
                value={
                  q.isLoading
                    ? "Loading..."
                    : q.isError
                    ? "Error"
                    : `OK (${rows.length} rows)`
                }
                readOnly
              />
            </div>
          </div>

          {q.isError ? (
            <div className="alert alert-danger mt-3 mb-0">
              Failed to load Product Costing.
              <div className="small mt-1">
                {String((q.error as any)?.message ?? q.error)}
              </div>
            </div>
          ) : null}
        </div>
      </div>

      {/* Stats */}
      <div className="col-md-3">
        <div className="card-box">
          <div className="text-muted fw-semibold">Rows</div>
          <div className="fs-3 fw-bold">{filtered.length}</div>
          <div className="text-muted small">After search filter</div>
        </div>
      </div>

      <div className="col-md-3">
        <div className="card-box">
          <div className="text-muted fw-semibold">Total Cost (best effort)</div>
          <div className="fs-3 fw-bold">{filtered.length ? totalCost.toFixed(2) : "—"}</div>
          <div className="text-muted small">Uses common cost keys</div>
        </div>
      </div>

      <div className="col-md-3">
        <div className="card-box">
          <div className="text-muted fw-semibold">Endpoint</div>
          <div className="fs-6 fw-bold">/api/product-costing/</div>
          <div className="text-muted small">DRF List</div>
        </div>
      </div>

      <div className="col-md-3">
        <div className="card-box">
          <div className="text-muted fw-semibold">Mode</div>
          <div className="fs-6 fw-bold">MVP</div>
          <div className="text-muted small">Read-only dashboard</div>
        </div>
      </div>

      {/* Table */}
      <div className="col-12">
        <div className="card-box">
          <div className="table-responsive">
            <table className="table table-striped table-hover align-middle mb-0">
              <thead>
                <tr>
                  {(columns.length ? columns : ["(no data)"]).map((c) => (
                    <th key={c}>{c}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {q.isLoading ? (
                  <tr>
                    <td colSpan={Math.max(columns.length, 1)}>Loading…</td>
                  </tr>
                ) : filtered.length ? (
                  filtered.map((r: any, idx: number) => (
                    <tr key={r.id ?? r.pk ?? idx}>
                      {columns.map((c) => (
                        <td key={c}>
                          {r?.[c] === null || r?.[c] === undefined
                            ? ""
                            : String(r?.[c])}
                        </td>
                      ))}
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={Math.max(columns.length, 1)}>
                      No rows found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

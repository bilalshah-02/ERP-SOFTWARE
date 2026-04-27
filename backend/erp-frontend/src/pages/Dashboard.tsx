import { useNavigate } from "react-router-dom";

function DashCard({
  title,
  desc,
  to,
}: {
  title: string;
  desc: string;
  to: string;
}) {
  const nav = useNavigate();

  return (
    <a
      href={to}
      className="card-link"
      onClick={(e) => {
        e.preventDefault();
        nav(to);
      }}
    >
      <div className="card-box">
        <div className="d-flex align-items-start justify-content-between">
          <h4 className="fw-bold mb-2">{title}</h4>
          <span className="badge text-bg-primary">Open</span>
        </div>
        <p className="mb-0 text-muted">{desc}</p>
      </div>
    </a>
  );
}

export default function Dashboard() {
  return (
    <div className="row g-4">
      <div className="col-md-4">
        <DashCard
          title="Product Costing"
          desc="Average/FIFO costing view for products."
          to="/costing/product"
        />
      </div>

      <div className="col-md-4">
        <DashCard
          title="Batch Cost Summary"
          desc="Batch totals, yield variance and key costs."
          to="/costing/batch"
        />
      </div>

      <div className="col-md-4">
        <DashCard
          title="Project Profitability"
          desc="Job profitability by project and work orders."
          to="/costing/project"
        />
      </div>

      <div className="col-md-6">
        <DashCard
          title="Process Cost Summary"
          desc="Process-wise cost rollups and drivers."
          to="/costing/process"
        />
      </div>

      <div className="col-md-6">
        <div className="card-box" style={{ opacity: 0.85 }}>
          <h4 className="fw-bold mb-2">Financial Snapshot (Later)</h4>
          <p className="mb-0 text-muted">
            In MVP we focus only on costing modules.
          </p>
        </div>
      </div>
    </div>
  );
}

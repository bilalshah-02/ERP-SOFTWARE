import { NavLink } from "react-router-dom";
import { useState } from "react";

const navCls = ({ isActive }: { isActive: boolean }) =>
  isActive ? "active" : "";

function NavItem({ to, label }: { to: string; label: string }) {
  return (
    <NavLink to={to} className={navCls}>
      {label}
    </NavLink>
  );
}

export default function Sidebar() {
  const [activeSection, setActiveSection] = useState<string>("");

  const toggleSection = (section: string) => {
    setActiveSection(activeSection === section ? "" : section);
  };

  // Define submenu items for each section
  const subMenus: Record<string, Array<{ to: string; label: string }>> = {
    purchase: [
      { to: "/purchase/dashboard", label: "Dashboard" },
      { to: "/purchase/orders", label: "Purchase Orders" },
      { to: "/purchase/receipts", label: "Goods Receipt" },
      { to: "/purchase/invoices", label: "Vendor Invoices" },
      { to: "/purchase/payments", label: "Payments" },
    ],
    sales: [
      { to: "/sales/dashboard", label: "Dashboard" },
      { to: "/sales/orders", label: "Sales Orders" },
      { to: "/sales/deliveries", label: "Deliveries" },
      { to: "/sales/invoices", label: "Customer Invoices" },
      { to: "/sales/receipts", label: "Receipts" },
    ],
    inventory: [
      { to: "/inventory/dashboard", label: "Dashboard" },
      { to: "/inventory/items", label: "Items" },
      { to: "/inventory/levels/config", label: "Stock Levels" },  // ⭐ NEW
      { to: "/inventory/adjustments/create", label: "Add Stock" },
      { to: "/inventory/balance", label: "Stock Balance" },
      { to: "/inventory/movements", label: "Movements" },
      { to: "/inventory/transfers/create", label: "Transfer Stock" },
    ],
    // ✅ UPDATED: Production Module (BOM items removed!)
    production: [
      { to: "/production/dashboard", label: "Dashboard" },
      { to: "/production/boms/view", label: "All Recipes/BOMs" },
      { to: "/production/batches", label: "Production Orders" },
      { to: "/production/batches/create", label: "Start Production" },
      { to: "/production/material-issue", label: "Issue Materials" },
      { to: "/production/completion", label: "Complete Production" },
    ],
    // ✅ CRM Module
    crm: [
      { to: "/crm/dashboard", label: "Dashboard" },
      { to: "/crm/leads", label: "Leads" },
      { to: "/crm/leads/create", label: "Create Lead" },
      { to: "/crm/activities", label: "Activities" },
      { to: "/crm/activities/create", label: "Add Activity" },
      { to: "/crm/pipeline", label: "Sales Pipeline" },
      { to: "/crm/customers", label: "Customers" },
    ],
    financial: [
      // GL MODULE
      { to: "/financial/gl/dashboard", label: "GL Dashboard" },
      { to: "/financial/journal-entry", label: "Journal Entry" },
      { to: "/financial/journal-list", label: "All Journals" },
      { to: "/financial/chart-of-accounts", label: "Chart of Accounts" },
      { to: "/financial/periods", label: "Fiscal Periods" },
      // BANKING
      { to: "/financial/banking", label: "Bank Accounts" },
      // REPORTS
      { to: "/financial/reports/trial-balance", label: "Trial Balance" },
      { to: "/financial/reports/profit-loss", label: "P&L Statement" },
      { to: "/financial/reports/balance-sheet", label: "Balance Sheet" },
      { to: "/financial/reports/cash-flow", label: "Cash Flow" },
      { to: "/financial/reports/aging", label: "AR/AP Aging" },
    ],
    costing: [
      { to: "/costing/product", label: "Product Costing" },
      { to: "/costing/batch", label: "Batch Costing" },
      { to: "/costing/process", label: "Process Costing" },
      { to: "/costing/project", label: "Project Costing" },
    ],
  };

  return (
    <>
      {/* MAIN SIDEBAR (LEFT) */}
      <aside id="main-sidebar">
        <div className="sidebar-header">
          <h6>ERP System</h6>
        </div>

        <nav>
          <NavItem to="/" label="🏠 Home" />

       
          <NavItem to="/supply-chain/vendors" label="Vendors" />
          <NavItem to="/inventory/items" label="Items" />
          <NavItem to="/crm/customers" label="Customers" />
          <NavItem to="/financial/banking" label="Banking" />

          <button
            className={`section-btn ${activeSection === "purchase" ? "active" : ""}`}
            onClick={() => toggleSection("purchase")}
          >
            PURCHASE +
          </button>

          <button
            className={`section-btn ${activeSection === "sales" ? "active" : ""}`}
            onClick={() => toggleSection("sales")}
          >
            SALES +
          </button>

          <button
            className={`section-btn ${activeSection === "inventory" ? "active" : ""}`}
            onClick={() => toggleSection("inventory")}
          >
            INVENTORY +
          </button>

          {/* ✅ Production Button (BOM hidden!) */}
          <button
            className={`section-btn ${activeSection === "production" ? "active" : ""}`}
            onClick={() => toggleSection("production")}
          >
            PRODUCTION +
          </button>

          {/* ✅ CRM Button */}
          <button
            className={`section-btn ${activeSection === "crm" ? "active" : ""}`}
            onClick={() => toggleSection("crm")}
          >
            CRM +
          </button>

          <button
            className={`section-btn ${activeSection === "financial" ? "active" : ""}`}
            onClick={() => toggleSection("financial")}
          >
            FINANCIAL +
          </button>

          <button
            className={`section-btn ${activeSection === "costing" ? "active" : ""}`}
            onClick={() => toggleSection("costing")}
          >
            COSTING +
          </button>

          <NavItem to="/settings" label="⚙️ Settings" />
        </nav>
      </aside>

      {/* SUBMENU PANEL (RIGHT) - Slides out when section is active */}
      {activeSection && (
        <aside id="submenu-panel" className={activeSection ? "open" : ""}>
          <div className="submenu-header">
            <h6>{activeSection.toUpperCase()}</h6>
            <button className="close-btn" onClick={() => setActiveSection("")}>
              ×
            </button>
          </div>
          <nav>
            {subMenus[activeSection]?.map((item) => (
              <NavItem key={item.to} to={item.to} label={item.label} />
            ))}
          </nav>
        </aside>
      )}

      {/* Overlay - Click to close submenu */}
      {activeSection && (
        <div className="overlay" onClick={() => setActiveSection("")} />
      )}

      <style>{`
        /* MAIN SIDEBAR (LEFT PANEL) */
        #main-sidebar {
          width: 220px;
          height: 100vh;
          background: #001f4d;
          color: white;
          position: fixed;
          left: 0;
          top: 0;
          overflow-y: auto;
          z-index: 1001;
          font-size: 0.85rem;
        }

        #main-sidebar .sidebar-header {
          padding: 15px;
          background: #001a3d;
          border-bottom: 1px solid rgba(255,255,255,0.1);
        }

        #main-sidebar .sidebar-header h6 {
          color: #b3e5ff;
          font-weight: 600;
          font-size: 1rem;
          margin: 0;
        }

        #main-sidebar nav {
          padding: 10px 0;
        }

        #main-sidebar a {
          display: block;
          padding: 10px 15px;
          color: rgba(255, 255, 255, 0.85);
          text-decoration: none;
          transition: all 0.2s;
        }

        #main-sidebar a:hover {
          background: rgba(255, 255, 255, 0.1);
          color: white;
        }

        #main-sidebar a.active {
          background: #0066cc;
          color: white;
          border-left: 3px solid #b3e5ff;
          font-weight: 500;
        }

        .section-title {
          font-size: 0.7rem;
          font-weight: 700;
          color: #8bb4d4;
          padding: 12px 15px 5px 15px;
          letter-spacing: 0.5px;
        }

        .section-btn {
          width: 100%;
          background: none;
          border: none;
          color: #8bb4d4;
          font-size: 0.7rem;
          font-weight: 700;
          letter-spacing: 0.5px;
          cursor: pointer;
          padding: 10px 15px;
          text-align: left;
          transition: all 0.2s;
          margin-top: 8px;
        }

        .section-btn:hover {
          background: rgba(255, 255, 255, 0.05);
          color: #b3e5ff;
        }

        .section-btn.active {
          background: rgba(0, 102, 204, 0.3);
          color: #b3e5ff;
          border-left: 3px solid #b3e5ff;
        }

        /* SUBMENU PANEL (RIGHT PANEL) */
        #submenu-panel {
          width: 220px;
          height: 100vh;
          background: #002556;
          color: white;
          position: fixed;
          left: 220px;
          top: 0;
          z-index: 1000;
          font-size: 0.85rem;
          box-shadow: 2px 0 10px rgba(0,0,0,0.3);
          animation: slideIn 0.2s ease-out;
        }

        @keyframes slideIn {
          from {
            transform: translateX(-100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }

        #submenu-panel .submenu-header {
          padding: 15px;
          background: #001a3d;
          border-bottom: 1px solid rgba(255,255,255,0.1);
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        #submenu-panel .submenu-header h6 {
          color: #b3e5ff;
          font-weight: 600;
          font-size: 0.9rem;
          margin: 0;
        }

        .close-btn {
          background: none;
          border: none;
          color: rgba(255,255,255,0.7);
          font-size: 1.5rem;
          cursor: pointer;
          padding: 0;
          line-height: 1;
          transition: color 0.2s;
        }

        .close-btn:hover {
          color: white;
        }

        #submenu-panel nav {
          padding: 10px 0;
        }

        #submenu-panel a {
          display: block;
          padding: 10px 15px;
          color: rgba(255, 255, 255, 0.85);
          text-decoration: none;
          transition: all 0.2s;
          border-left: 3px solid transparent;
        }

        #submenu-panel a:hover {
          background: rgba(255, 255, 255, 0.1);
          color: white;
          border-left: 3px solid rgba(179, 229, 255, 0.3);
        }

        #submenu-panel a.active {
          background: #0066cc;
          color: white;
          border-left: 3px solid #b3e5ff;
          font-weight: 500;
        }

        /* OVERLAY - Click to close submenu */
        .overlay {
          position: fixed;
          top: 0;
          left: 440px;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.1);
          z-index: 999;
          cursor: pointer;
        }

        /* Scrollbar styling */
        #main-sidebar::-webkit-scrollbar,
        #submenu-panel::-webkit-scrollbar {
          width: 4px;
        }

        #main-sidebar::-webkit-scrollbar-thumb,
        #submenu-panel::-webkit-scrollbar-thumb {
          background: rgba(179, 229, 255, 0.3);
          border-radius: 2px;
        }

        /* Adjust main content */
        #main {
          margin-left: 220px;
          transition: margin-left 0.2s;
        }

        /* When submenu is open, push content more */
        #submenu-panel.open ~ #main {
          margin-left: 440px;
        }
      `}</style>
    </>
  );
}
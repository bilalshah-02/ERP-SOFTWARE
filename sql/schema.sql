/* =====================================================================
   SUPER ERP — FULL SCHEMA v1.5 (Standalone)
   Business: Construction Contracting + Soap Manufacturing
   Scope:
     - General Ledger / Accounting
     - AR / AP / Banking
     - Inventory & Warehouses
     - Sales, Purchase, CRM
     - Production, BOM, Batch & Process Costing
     - Job / Contract Costing (Projects)
     - HR & Payroll (with cost allocation)
     - Tax & Withholding
     - Fixed Assets
     - Approvals / Workflow
     - Quality Control (basic)
     - Management Reporting Views

   Database: PostgreSQL 14+
===================================================================== */

-- ====================================================================
-- 0. EXTENSIONS & SCHEMA
-- ====================================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "btree_gist";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

CREATE SCHEMA IF NOT EXISTS erp;
SET search_path = erp, public;

-- ====================================================================
-- 1. ENUM TYPES
-- ====================================================================

CREATE TYPE erp.account_type AS ENUM ('ASSET','LIABILITY','EQUITY','REVENUE','EXPENSE','COGS');

CREATE TYPE erp.costing_method AS ENUM ('FIFO','LIFO','AVERAGE','STANDARD','SPECIFIC');

CREATE TYPE erp.item_class AS ENUM ('INVENTORY','MANUFACTURED','SERVICE','NON_INVENTORY','KIT','FIXED_ASSET');

CREATE TYPE erp.inventory_movement_type AS ENUM ('IN','OUT','TRANSFER','ADJUSTMENT');

CREATE TYPE erp.document_status AS ENUM ('DRAFT','CONFIRMED','POSTED','CANCELLED');

CREATE TYPE erp.activity_type AS ENUM ('CALL','MEETING','EMAIL','TASK','NOTE');

CREATE TYPE erp.cost_center_type AS ENUM ('DEPARTMENT','PROJECT','PROCESS','OVERHEAD','OTHER');

CREATE TYPE erp.project_status AS ENUM ('PLANNED','IN_PROGRESS','ON_HOLD','COMPLETED','CLOSED','CANCELLED');

CREATE TYPE erp.job_cost_head AS ENUM ('MATERIAL','LABOR','EQUIPMENT','SUBCONTRACT','OVERHEAD','OTHER');

CREATE TYPE erp.depreciation_method AS ENUM ('STRAIGHT_LINE','DECLINING_BALANCE','UNITS_OF_PRODUCTION');

CREATE TYPE erp.asset_status AS ENUM ('ACTIVE','UNDER_CONSTRUCTION','SUSPENDED','DISPOSED','FULLY_DEPRECIATED');

CREATE TYPE erp.payroll_component_kind AS ENUM ('EARNING','DEDUCTION','EMPLOYER_CONTRIBUTION');

CREATE TYPE erp.lead_status AS ENUM ('NEW','QUALIFIED','PROPOSAL','WON','LOST');

-- ====================================================================
-- 2. SECURITY & USERS
-- ====================================================================

CREATE TABLE erp.app_user (
    user_key        BIGSERIAL PRIMARY KEY,
    username        VARCHAR(100) UNIQUE NOT NULL,
    full_name       VARCHAR(200),
    email           VARCHAR(255) UNIQUE,
    password_hash   TEXT NOT NULL,
    is_active       BOOLEAN DEFAULT TRUE,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE erp.user_role (
    role_key        BIGSERIAL PRIMARY KEY,
    role_name       VARCHAR(100) UNIQUE NOT NULL,
    description     TEXT
);

CREATE TABLE erp.app_user_role (
    user_key        BIGINT NOT NULL REFERENCES erp.app_user(user_key),
    role_key        BIGINT NOT NULL REFERENCES erp.user_role(role_key),
    PRIMARY KEY (user_key, role_key)
);

CREATE TABLE erp.role_permission (
    permission_key  BIGSERIAL PRIMARY KEY,
    role_key        BIGINT NOT NULL REFERENCES erp.user_role(role_key),
    module          VARCHAR(100) NOT NULL,
    permission      JSONB NOT NULL, -- e.g. {"read":true,"write":false}
    allowed         BOOLEAN DEFAULT TRUE
);

CREATE TABLE erp.audit_trail (
    audit_id        BIGSERIAL PRIMARY KEY,
    table_name      VARCHAR(200) NOT NULL,
    record_pk       TEXT,
    action          VARCHAR(20) NOT NULL, -- INSERT / UPDATE / DELETE
    changed_by      BIGINT REFERENCES erp.app_user(user_key),
    changed_at      TIMESTAMPTZ DEFAULT NOW(),
    old_data        JSONB,
    new_data        JSONB
);

-- ====================================================================
-- 3. CORE DIMENSIONS (COMPANY, CURRENCY, COST CENTER, TAX, PARTY)
-- ====================================================================

CREATE TABLE erp.dim_company (
    company_key     BIGSERIAL PRIMARY KEY,
    company_code    VARCHAR(50) UNIQUE NOT NULL,
    name            VARCHAR(255) NOT NULL,
    legal_name      VARCHAR(255),
    tax_id          VARCHAR(100),
    base_currency   CHAR(3),
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE erp.dim_currency (
    currency_code   CHAR(3) PRIMARY KEY,
    currency_name   VARCHAR(100),
    symbol          VARCHAR(10)
);

CREATE TABLE erp.dim_cost_center (
    cost_center_key BIGSERIAL PRIMARY KEY,
    company_key     BIGINT NOT NULL REFERENCES erp.dim_company(company_key),
    code            VARCHAR(50) NOT NULL,
    name            VARCHAR(255) NOT NULL,
    parent_key      BIGINT REFERENCES erp.dim_cost_center(cost_center_key),
    cost_center_type erp.cost_center_type DEFAULT 'DEPARTMENT',
    is_active       BOOLEAN DEFAULT TRUE,
    UNIQUE (company_key, code)
);

CREATE TABLE erp.dim_tax_code (
    tax_key         BIGSERIAL PRIMARY KEY,
    tax_code        VARCHAR(50) UNIQUE NOT NULL,
    description     TEXT,
    rate            NUMERIC(8,4) NOT NULL, -- 0.1700 = 17%
    is_vat          BOOLEAN DEFAULT TRUE,
    is_withholding  BOOLEAN DEFAULT FALSE,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- PARTY (customers, suppliers, others)

CREATE TABLE erp.party (
    party_key       BIGSERIAL PRIMARY KEY,
    party_code      VARCHAR(50) UNIQUE NOT NULL,
    name            VARCHAR(255) NOT NULL,
    party_type      VARCHAR(50) NOT NULL, -- CUSTOMER / SUPPLIER / EMPLOYEE / OTHER
    tax_id          VARCHAR(100),
    phone           VARCHAR(50),
    email           VARCHAR(255),
    address_line1   TEXT,
    address_line2   TEXT,
    city            VARCHAR(100),
    country         VARCHAR(100),
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ====================================================================
-- 4. ITEMS, BATCHES, WAREHOUSES
-- ====================================================================

CREATE TABLE erp.dim_item (
    item_key        BIGSERIAL PRIMARY KEY,
    item_code       VARCHAR(50) UNIQUE NOT NULL,
    name            VARCHAR(255) NOT NULL,
    description     TEXT,
    item_class      erp.item_class NOT NULL,
    uom             VARCHAR(20) NOT NULL,
    costing_method  erp.costing_method DEFAULT 'FIFO',
    is_batch_tracked BOOLEAN DEFAULT FALSE,
    is_active       BOOLEAN DEFAULT TRUE,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE erp.dim_batch (
    batch_key       BIGSERIAL PRIMARY KEY,
    item_key        BIGINT NOT NULL REFERENCES erp.dim_item(item_key),
    batch_number    VARCHAR(100) NOT NULL,
    mfg_date        DATE,
    exp_date        DATE,
    qc_released     BOOLEAN DEFAULT FALSE,
    UNIQUE (item_key, batch_number)
);

CREATE TABLE erp.warehouse (
    warehouse_key   BIGSERIAL PRIMARY KEY,
    company_key     BIGINT NOT NULL REFERENCES erp.dim_company(company_key),
    code            VARCHAR(50) NOT NULL,
    name            VARCHAR(255) NOT NULL,
    address         TEXT,
    UNIQUE (company_key, code)
);

CREATE TABLE erp.warehouse_bin (
    bin_key         BIGSERIAL PRIMARY KEY,
    warehouse_key   BIGINT NOT NULL REFERENCES erp.warehouse(warehouse_key),
    bin_code        VARCHAR(50) NOT NULL,
    description     TEXT,
    UNIQUE (warehouse_key, bin_code)
);

-- ====================================================================
-- 5. CHART OF ACCOUNTS & GL
-- ====================================================================

CREATE TABLE erp.chart_of_accounts (
    account_key     BIGSERIAL PRIMARY KEY,
    company_key     BIGINT NOT NULL REFERENCES erp.dim_company(company_key),
    account_code    VARCHAR(50) NOT NULL,
    account_name    VARCHAR(255) NOT NULL,
    account_type    erp.account_type NOT NULL,
    parent_key      BIGINT REFERENCES erp.chart_of_accounts(account_key),
    is_posting      BOOLEAN DEFAULT TRUE,
    is_active       BOOLEAN DEFAULT TRUE,
    UNIQUE (company_key, account_code)
);

CREATE TABLE erp.fiscal_period (
    period_key      BIGSERIAL PRIMARY KEY,
    company_key     BIGINT NOT NULL REFERENCES erp.dim_company(company_key),
    period_code     VARCHAR(20) NOT NULL, -- e.g. 2024-01
    start_date      DATE NOT NULL,
    end_date        DATE NOT NULL,
    is_closed       BOOLEAN DEFAULT FALSE,
    UNIQUE (company_key, period_code)
);

CREATE TABLE erp.gl_journal (
    gl_id           BIGSERIAL PRIMARY KEY,
    company_key     BIGINT NOT NULL REFERENCES erp.dim_company(company_key),
    journal_number  VARCHAR(50) NOT NULL,
    journal_date    DATE NOT NULL,
    period_key      BIGINT REFERENCES erp.fiscal_period(period_key),
    description     TEXT,
    status          erp.document_status DEFAULT 'DRAFT',
    created_by      BIGINT REFERENCES erp.app_user(user_key),
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (company_key, journal_number)
);

CREATE TABLE erp.gl_line (
    gl_line_id      BIGSERIAL PRIMARY KEY,
    gl_id           BIGINT NOT NULL REFERENCES erp.gl_journal(gl_id) ON DELETE CASCADE,
    line_no         INT NOT NULL,
    account_key     BIGINT NOT NULL REFERENCES erp.chart_of_accounts(account_key),
    cost_center_key BIGINT REFERENCES erp.dim_cost_center(cost_center_key),
    project_job_id  BIGINT, -- FK added later when project_job exists
    description     TEXT,
    debit           NUMERIC(18,2) DEFAULT 0,
    credit          NUMERIC(18,2) DEFAULT 0,
    UNIQUE (gl_id, line_no)
);

-- (we'll add FK from gl_line.project_job_id to project_job after project_job table is created)

-- ====================================================================
-- 6. SALES, PURCHASE, INVOICING, PAYMENTS
-- ====================================================================

CREATE TABLE erp.sales_order (
    so_id           BIGSERIAL PRIMARY KEY,
    company_key     BIGINT NOT NULL REFERENCES erp.dim_company(company_key),
    so_number       VARCHAR(50) NOT NULL,
    customer_key    BIGINT NOT NULL REFERENCES erp.party(party_key),
    order_date      DATE NOT NULL,
    delivery_date   DATE,
    status          erp.document_status DEFAULT 'DRAFT',
    currency_code   CHAR(3) REFERENCES erp.dim_currency(currency_code),
    remarks         TEXT,
    created_by      BIGINT REFERENCES erp.app_user(user_key),
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (company_key, so_number)
);

CREATE TABLE erp.sales_order_line (
    so_line_id      BIGSERIAL PRIMARY KEY,
    so_id           BIGINT NOT NULL REFERENCES erp.sales_order(so_id) ON DELETE CASCADE,
    line_no         INT NOT NULL,
    item_key        BIGINT NOT NULL REFERENCES erp.dim_item(item_key),
    description     TEXT,
    quantity        NUMERIC(18,3) NOT NULL,
    unit_price      NUMERIC(18,4) NOT NULL,
    discount_amount NUMERIC(18,2) DEFAULT 0,
    tax_key         BIGINT REFERENCES erp.dim_tax_code(tax_key),
    UNIQUE (so_id, line_no)
);

CREATE TABLE erp.purchase_order (
    po_id           BIGSERIAL PRIMARY KEY,
    company_key     BIGINT NOT NULL REFERENCES erp.dim_company(company_key),
    po_number       VARCHAR(50) NOT NULL,
    supplier_key    BIGINT NOT NULL REFERENCES erp.party(party_key),
    order_date      DATE NOT NULL,
    expected_date   DATE,
    status          erp.document_status DEFAULT 'DRAFT',
    currency_code   CHAR(3) REFERENCES erp.dim_currency(currency_code),
    remarks         TEXT,
    created_by      BIGINT REFERENCES erp.app_user(user_key),
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (company_key, po_number)
);

CREATE TABLE erp.purchase_order_line (
    po_line_id      BIGSERIAL PRIMARY KEY,
    po_id           BIGINT NOT NULL REFERENCES erp.purchase_order(po_id) ON DELETE CASCADE,
    line_no         INT NOT NULL,
    item_key        BIGINT NOT NULL REFERENCES erp.dim_item(item_key),
    description     TEXT,
    quantity        NUMERIC(18,3) NOT NULL,
    unit_price      NUMERIC(18,4) NOT NULL,
    discount_amount NUMERIC(18,2) DEFAULT 0,
    tax_key         BIGINT REFERENCES erp.dim_tax_code(tax_key),
    UNIQUE (po_id, line_no)
);

-- INVOICES & PAYMENTS

CREATE TABLE erp.invoice (
    invoice_id      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_key     BIGINT NOT NULL REFERENCES erp.dim_company(company_key),
    invoice_number  VARCHAR(50) NOT NULL,
    invoice_type    VARCHAR(20) NOT NULL, -- AR / AP
    party_key       BIGINT NOT NULL REFERENCES erp.party(party_key),
    invoice_date    DATE NOT NULL,
    due_date        DATE,
    status          erp.document_status DEFAULT 'DRAFT',
    currency_code   CHAR(3) REFERENCES erp.dim_currency(currency_code),
    remarks         TEXT,
    created_by      BIGINT REFERENCES erp.app_user(user_key),
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (company_key, invoice_number, invoice_type)
);

CREATE TABLE erp.invoice_line (
    line_id         BIGSERIAL PRIMARY KEY,
    invoice_id      UUID NOT NULL REFERENCES erp.invoice(invoice_id) ON DELETE CASCADE,
    line_no         INT NOT NULL,
    item_key        BIGINT REFERENCES erp.dim_item(item_key),
    description     TEXT,
    quantity        NUMERIC(18,3) DEFAULT 0,
    unit_price      NUMERIC(18,4) DEFAULT 0,
    line_amount     NUMERIC(18,2) NOT NULL,
    tax_amount      NUMERIC(18,2) DEFAULT 0,
    tax_key         BIGINT REFERENCES erp.dim_tax_code(tax_key),
    cost_center_key BIGINT REFERENCES erp.dim_cost_center(cost_center_key),
    project_job_id  BIGINT,
    UNIQUE (invoice_id, line_no)
);

CREATE TABLE erp.payment (
    payment_id      BIGSERIAL PRIMARY KEY,
    company_key     BIGINT NOT NULL REFERENCES erp.dim_company(company_key),
    party_key       BIGINT NOT NULL REFERENCES erp.party(party_key),
    payment_date    DATE NOT NULL,
    amount          NUMERIC(18,2) NOT NULL,
    payment_method  VARCHAR(50),
    reference_no    VARCHAR(100),
    remarks         TEXT,
    created_by      BIGINT REFERENCES erp.app_user(user_key),
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE erp.payment_allocation (
    allocation_id   BIGSERIAL PRIMARY KEY,
    payment_id      BIGINT NOT NULL REFERENCES erp.payment(payment_id) ON DELETE CASCADE,
    invoice_id      UUID NOT NULL REFERENCES erp.invoice(invoice_id),
    allocated_amount NUMERIC(18,2) NOT NULL
);

-- ====================================================================
-- 7. INVENTORY BALANCES & MOVEMENTS
-- ====================================================================

CREATE TABLE erp.inventory_balance (
    balance_id      BIGSERIAL PRIMARY KEY,
    company_key     BIGINT NOT NULL REFERENCES erp.dim_company(company_key),
    item_key        BIGINT NOT NULL REFERENCES erp.dim_item(item_key),
    warehouse_key   BIGINT NOT NULL REFERENCES erp.warehouse(warehouse_key),
    bin_key         BIGINT REFERENCES erp.warehouse_bin(bin_key),
    batch_key       BIGINT REFERENCES erp.dim_batch(batch_key),
    quantity_on_hand NUMERIC(18,3) DEFAULT 0,
    quantity_reserved NUMERIC(18,3) DEFAULT 0,
    avg_cost        NUMERIC(18,6) DEFAULT 0,
    total_value     NUMERIC(18,2) DEFAULT 0,
    UNIQUE (company_key, item_key, warehouse_key, COALESCE(bin_key,0), COALESCE(batch_key,0))
);

CREATE TABLE erp.inventory_transaction (
    inv_txn_id      BIGSERIAL PRIMARY KEY,
    company_key     BIGINT NOT NULL REFERENCES erp.dim_company(company_key),
    item_key        BIGINT NOT NULL REFERENCES erp.dim_item(item_key),
    warehouse_key   BIGINT NOT NULL REFERENCES erp.warehouse(warehouse_key),
    bin_key         BIGINT REFERENCES erp.warehouse_bin(bin_key),
    batch_key       BIGINT REFERENCES erp.dim_batch(batch_key),
    movement_type   erp.inventory_movement_type NOT NULL,
    quantity        NUMERIC(18,3) NOT NULL,
    unit_cost       NUMERIC(18,6),
    total_cost      NUMERIC(18,2),
    tx_date         TIMESTAMPTZ DEFAULT NOW(),
    source_doc_type VARCHAR(50),
    source_doc_id   TEXT,
    project_job_id  BIGINT
);

-- ====================================================================
-- 8. MANUFACTURING: BOM, ROUTING, PRODUCTION, QC
-- ====================================================================

CREATE TABLE erp.bom (
    bom_key         BIGSERIAL PRIMARY KEY,
    parent_item_key BIGINT NOT NULL REFERENCES erp.dim_item(item_key),
    bom_code        VARCHAR(50) NOT NULL,
    description     TEXT,
    is_active       BOOLEAN DEFAULT TRUE,
    UNIQUE (parent_item_key, bom_code)
);

CREATE TABLE erp.bom_component (
    bom_component_key BIGSERIAL PRIMARY KEY,
    bom_key         BIGINT NOT NULL REFERENCES erp.bom(bom_key) ON DELETE CASCADE,
    component_item_key BIGINT NOT NULL REFERENCES erp.dim_item(item_key),
    quantity_per     NUMERIC(18,6) NOT NULL,
    scrap_percent    NUMERIC(5,2) DEFAULT 0
);

CREATE TABLE erp.routing (
    routing_key     BIGSERIAL PRIMARY KEY,
    parent_item_key BIGINT NOT NULL REFERENCES erp.dim_item(item_key),
    operation_no    INT NOT NULL,
    operation_name  VARCHAR(200) NOT NULL,
    work_center     VARCHAR(100),
    std_setup_time  NUMERIC(18,2),
    std_run_time    NUMERIC(18,2),
    cost_rate_per_hour NUMERIC(18,4),
    UNIQUE (parent_item_key, operation_no)
);

CREATE TABLE erp.production_batch (
    prod_batch_key  BIGSERIAL PRIMARY KEY,
    company_key     BIGINT NOT NULL REFERENCES erp.dim_company(company_key),
    batch_key       BIGINT NOT NULL REFERENCES erp.dim_batch(batch_key),
    bom_key         BIGINT NOT NULL REFERENCES erp.bom(bom_key),
    routing_key     BIGINT REFERENCES erp.routing(routing_key),
    planned_qty     NUMERIC(18,3) NOT NULL,
    actual_qty      NUMERIC(18,3),
    start_date      DATE,
    end_date        DATE,
    status          erp.document_status DEFAULT 'DRAFT',
    created_by      BIGINT REFERENCES erp.app_user(user_key),
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE erp.lims_test_result (
    test_id         BIGSERIAL PRIMARY KEY,
    batch_key       BIGINT NOT NULL REFERENCES erp.dim_batch(batch_key),
    test_date       DATE NOT NULL,
    parameter       VARCHAR(200) NOT NULL,
    result_value    VARCHAR(200),
    passed          BOOLEAN,
    remarks         TEXT,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ====================================================================
-- 9. JOB / CONTRACT COSTING (CONSTRUCTION)
-- ====================================================================

CREATE TABLE erp.project_job (
    project_job_id      BIGSERIAL PRIMARY KEY,
    project_code        VARCHAR(60) UNIQUE NOT NULL,
    name                VARCHAR(255) NOT NULL,
    description         TEXT,
    company_key         BIGINT NOT NULL REFERENCES erp.dim_company(company_key),
    customer_key        BIGINT REFERENCES erp.party(party_key),
    cost_center_key     BIGINT UNIQUE REFERENCES erp.dim_cost_center(cost_center_key),
    site_location       TEXT,
    start_date          DATE,
    end_date            DATE,
    status              erp.project_status DEFAULT 'PLANNED',
    contract_value      NUMERIC(18,2),
    currency_code       CHAR(3) REFERENCES erp.dim_currency(currency_code),
    created_at          TIMESTAMPTZ DEFAULT NOW(),
    created_by          BIGINT REFERENCES erp.app_user(user_key)
);

CREATE TABLE erp.project_job_budget (
    budget_id           BIGSERIAL PRIMARY KEY,
    project_job_id      BIGINT NOT NULL REFERENCES erp.project_job(project_job_id) ON DELETE CASCADE,
    cost_head           erp.job_cost_head NOT NULL,
    budget_amount       NUMERIC(18,2) NOT NULL,
    notes               TEXT,
    created_at          TIMESTAMPTZ DEFAULT NOW(),
    created_by          BIGINT REFERENCES erp.app_user(user_key),
    UNIQUE (project_job_id, cost_head)
);

CREATE TABLE erp.project_billing (
    billing_id          BIGSERIAL PRIMARY KEY,
    project_job_id      BIGINT NOT NULL REFERENCES erp.project_job(project_job_id) ON DELETE CASCADE,
    invoice_id          UUID REFERENCES erp.invoice(invoice_id),
    billing_date        DATE NOT NULL,
    description         TEXT,
    certified_amount    NUMERIC(18,2) NOT NULL,
    retention_percent   NUMERIC(5,2),
    retention_amount    NUMERIC(18,2),
    status              VARCHAR(30) DEFAULT 'DRAFT',
    created_at          TIMESTAMPTZ DEFAULT NOW(),
    created_by          BIGINT REFERENCES erp.app_user(user_key)
);

CREATE TABLE erp.project_retention (
    retention_id        BIGSERIAL PRIMARY KEY,
    project_job_id      BIGINT NOT NULL REFERENCES erp.project_job(project_job_id) ON DELETE CASCADE,
    source_billing_id   BIGINT REFERENCES erp.project_billing(billing_id),
    original_retention_amount NUMERIC(18,2) NOT NULL,
    releasable_from     DATE,
    released            BOOLEAN DEFAULT FALSE,
    release_invoice_id  UUID REFERENCES erp.invoice(invoice_id),
    released_amount     NUMERIC(18,2),
    released_at         TIMESTAMPTZ,
    created_at          TIMESTAMPTZ DEFAULT NOW(),
    created_by          BIGINT REFERENCES erp.app_user(user_key)
);

-- Add FK links now that project_job exists
ALTER TABLE erp.gl_line
    ADD CONSTRAINT fk_gl_line_project_job
    FOREIGN KEY (project_job_id) REFERENCES erp.project_job(project_job_id);

ALTER TABLE erp.invoice_line
    ADD CONSTRAINT fk_invoice_line_project_job
    FOREIGN KEY (project_job_id) REFERENCES erp.project_job(project_job_id);

ALTER TABLE erp.inventory_transaction
    ADD CONSTRAINT fk_inv_txn_project_job
    FOREIGN KEY (project_job_id) REFERENCES erp.project_job(project_job_id);

-- ====================================================================
-- 10. BATCH & PROCESS COSTING DETAIL
-- ====================================================================

CREATE TABLE erp.batch_cost_detail (
    batch_cost_id       BIGSERIAL PRIMARY KEY,
    prod_batch_key      BIGINT NOT NULL REFERENCES erp.production_batch(prod_batch_key) ON DELETE CASCADE,
    cost_head           erp.job_cost_head NOT NULL,
    amount              NUMERIC(18,2) NOT NULL,
    source_doc_type     VARCHAR(50),     -- e.g. 'GL_JOURNAL','INVOICE','PAYROLL'
    source_doc_pk_bigint BIGINT,
    source_doc_pk_uuid  UUID,
    notes               TEXT,
    created_at          TIMESTAMPTZ DEFAULT NOW(),
    created_by          BIGINT REFERENCES erp.app_user(user_key)
);

CREATE OR REPLACE VIEW erp.vw_batch_cost_summary AS
SELECT
    pb.prod_batch_key,
    b.batch_number,
    SUM(CASE WHEN bcd.cost_head = 'MATERIAL'    THEN bcd.amount ELSE 0 END) AS material_cost,
    SUM(CASE WHEN bcd.cost_head = 'LABOR'       THEN bcd.amount ELSE 0 END) AS labor_cost,
    SUM(CASE WHEN bcd.cost_head = 'EQUIPMENT'   THEN bcd.amount ELSE 0 END) AS equipment_cost,
    SUM(CASE WHEN bcd.cost_head = 'SUBCONTRACT' THEN bcd.amount ELSE 0 END) AS subcontract_cost,
    SUM(CASE WHEN bcd.cost_head = 'OVERHEAD'    THEN bcd.amount ELSE 0 END) AS overhead_cost,
    SUM(bcd.amount) AS total_cost
FROM erp.production_batch pb
LEFT JOIN erp.dim_batch b ON pb.batch_key = b.batch_key
LEFT JOIN erp.batch_cost_detail bcd ON pb.prod_batch_key = bcd.prod_batch_key
GROUP BY pb.prod_batch_key, b.batch_number;

-- ====================================================================
-- 11. HR & PAYROLL
-- ====================================================================

CREATE TABLE erp.employee (
    employee_id     BIGSERIAL PRIMARY KEY,
    party_key       BIGINT UNIQUE REFERENCES erp.party(party_key),
    employee_code   VARCHAR(50) UNIQUE NOT NULL,
    first_name      VARCHAR(100),
    last_name       VARCHAR(100),
    hire_date       DATE,
    termination_date DATE,
    cost_center_key BIGINT REFERENCES erp.dim_cost_center(cost_center_key),
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE erp.payroll_run (
    payroll_run_id  BIGSERIAL PRIMARY KEY,
    company_key     BIGINT NOT NULL REFERENCES erp.dim_company(company_key),
    period_start    DATE NOT NULL,
    period_end      DATE NOT NULL,
    pay_date        DATE NOT NULL,
    description     TEXT,
    status          erp.document_status DEFAULT 'DRAFT',
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    created_by      BIGINT REFERENCES erp.app_user(user_key)
);

CREATE TABLE erp.payroll_entry (
    pe_id           BIGSERIAL PRIMARY KEY,
    payroll_run_id  BIGINT NOT NULL REFERENCES erp.payroll_run(payroll_run_id) ON DELETE CASCADE,
    employee_id     BIGINT NOT NULL REFERENCES erp.employee(employee_id),
    gross_pay       NUMERIC(18,2) NOT NULL,
    deductions      NUMERIC(18,2) DEFAULT 0,
    net_pay         NUMERIC(18,2) NOT NULL,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE erp.payroll_component_type (
    component_type_id   BIGSERIAL PRIMARY KEY,
    code                VARCHAR(50) UNIQUE NOT NULL,
    name                VARCHAR(200) NOT NULL,
    kind                erp.payroll_component_kind NOT NULL,
    account_key         BIGINT REFERENCES erp.chart_of_accounts(account_key),
    taxable             BOOLEAN DEFAULT TRUE,
    active              BOOLEAN DEFAULT TRUE,
    created_at          TIMESTAMPTZ DEFAULT NOW(),
    created_by          BIGINT REFERENCES erp.app_user(user_key)
);

CREATE TABLE erp.payroll_component_line (
    component_line_id   BIGSERIAL PRIMARY KEY,
    pe_id               BIGINT NOT NULL REFERENCES erp.payroll_entry(pe_id) ON DELETE CASCADE,
    component_type_id   BIGINT NOT NULL REFERENCES erp.payroll_component_type(component_type_id),
    amount              NUMERIC(18,2) NOT NULL,
    cost_center_key     BIGINT REFERENCES erp.dim_cost_center(cost_center_key),
    project_job_id      BIGINT REFERENCES erp.project_job(project_job_id),
    notes               TEXT
);

-- ====================================================================
-- 12. FIXED ASSETS
-- ====================================================================

CREATE TABLE erp.asset_category (
    asset_category_key  BIGSERIAL PRIMARY KEY,
    category_code       VARCHAR(50) UNIQUE NOT NULL,
    name                VARCHAR(200) NOT NULL,
    depreciation_method erp.depreciation_method NOT NULL,
    useful_life_months  INT,
    depreciation_account_key      BIGINT REFERENCES erp.chart_of_accounts(account_key),
    accumulated_dep_account_key   BIGINT REFERENCES erp.chart_of_accounts(account_key),
    disposal_gain_account_key     BIGINT REFERENCES erp.chart_of_accounts(account_key),
    disposal_loss_account_key     BIGINT REFERENCES erp.chart_of_accounts(account_key),
    created_at          TIMESTAMPTZ DEFAULT NOW(),
    created_by          BIGINT REFERENCES erp.app_user(user_key)
);

CREATE TABLE erp.fixed_asset (
    fixed_asset_key     BIGSERIAL PRIMARY KEY,
    asset_code          VARCHAR(60) UNIQUE NOT NULL,
    asset_name          VARCHAR(255) NOT NULL,
    company_key         BIGINT NOT NULL REFERENCES erp.dim_company(company_key),
    asset_category_key  BIGINT NOT NULL REFERENCES erp.asset_category(asset_category_key),
    cost_center_key     BIGINT REFERENCES erp.dim_cost_center(cost_center_key),
    related_item_key    BIGINT REFERENCES erp.dim_item(item_key),
    purchase_date       DATE,
    purchase_cost       NUMERIC(18,2),
    salvage_value       NUMERIC(18,2),
    start_depreciation_date DATE,
    status              erp.asset_status DEFAULT 'ACTIVE',
    remarks             TEXT,
    created_at          TIMESTAMPTZ DEFAULT NOW(),
    created_by          BIGINT REFERENCES erp.app_user(user_key)
);

CREATE TABLE erp.fixed_asset_depreciation_run (
    dep_run_id          BIGSERIAL PRIMARY KEY,
    run_date            DATE NOT NULL,
    period_start        DATE NOT NULL,
    period_end          DATE NOT NULL,
    status              VARCHAR(30) DEFAULT 'DRAFT',
    created_at          TIMESTAMPTZ DEFAULT NOW(),
    created_by          BIGINT REFERENCES erp.app_user(user_key)
);

CREATE TABLE erp.fixed_asset_depreciation_line (
    dep_line_id         BIGSERIAL PRIMARY KEY,
    dep_run_id          BIGINT NOT NULL REFERENCES erp.fixed_asset_depreciation_run(dep_run_id) ON DELETE CASCADE,
    fixed_asset_key     BIGINT NOT NULL REFERENCES erp.fixed_asset(fixed_asset_key),
    depreciation_amount NUMERIC(18,2) NOT NULL,
    period_start        DATE NOT NULL,
    period_end          DATE NOT NULL,
    gl_id               BIGINT REFERENCES erp.gl_journal(gl_id),
    created_at          TIMESTAMPTZ DEFAULT NOW()
);

-- ====================================================================
-- 13. TAX & WITHHOLDING
-- ====================================================================

CREATE TABLE erp.tax_transaction (
    tax_txn_id      BIGSERIAL PRIMARY KEY,
    invoice_id      UUID REFERENCES erp.invoice(invoice_id),
    invoice_line_id BIGINT REFERENCES erp.invoice_line(line_id),
    tax_key         BIGINT NOT NULL REFERENCES erp.dim_tax_code(tax_key),
    company_key     BIGINT REFERENCES erp.dim_company(company_key),
    tax_base_amount NUMERIC(18,2) NOT NULL,
    tax_amount      NUMERIC(18,2) NOT NULL,
    tax_direction   VARCHAR(10) CHECK (tax_direction IN ('OUTPUT','INPUT')),
    posting_date    DATE NOT NULL,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE erp.withholding_tax_setup (
    wht_id          BIGSERIAL PRIMARY KEY,
    code            VARCHAR(50) UNIQUE NOT NULL,
    description     TEXT,
    rate            NUMERIC(8,4) NOT NULL,
    applies_to      VARCHAR(20) CHECK (applies_to IN ('SUPPLIER','CUSTOMER')),
    min_amount      NUMERIC(18,2),
    account_key     BIGINT REFERENCES erp.chart_of_accounts(account_key),
    active          BOOLEAN DEFAULT TRUE,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE erp.withholding_tax_transaction (
    wht_txn_id      BIGSERIAL PRIMARY KEY,
    wht_id          BIGINT NOT NULL REFERENCES erp.withholding_tax_setup(wht_id),
    invoice_id      UUID REFERENCES erp.invoice(invoice_id),
    party_key       BIGINT REFERENCES erp.party(party_key),
    base_amount     NUMERIC(18,2) NOT NULL,
    wht_amount      NUMERIC(18,2) NOT NULL,
    posting_date    DATE NOT NULL,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ====================================================================
-- 14. APPROVAL WORKFLOWS
-- ====================================================================

CREATE TABLE erp.workflow_definition (
    workflow_id     BIGSERIAL PRIMARY KEY,
    name            VARCHAR(200) NOT NULL,
    document_type   VARCHAR(50) NOT NULL, -- 'PURCHASE_ORDER','GL_JOURNAL','INVOICE',...
    is_active       BOOLEAN DEFAULT TRUE,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    created_by      BIGINT REFERENCES erp.app_user(user_key)
);

CREATE TABLE erp.workflow_step (
    step_id         BIGSERIAL PRIMARY KEY,
    workflow_id     BIGINT NOT NULL REFERENCES erp.workflow_definition(workflow_id) ON DELETE CASCADE,
    step_order      INT NOT NULL,
    role_required   VARCHAR(100),
    min_amount      NUMERIC(18,2),
    max_amount      NUMERIC(18,2),
    description     TEXT,
    UNIQUE (workflow_id, step_order)
);

CREATE TABLE erp.document_workflow_instance (
    instance_id     BIGSERIAL PRIMARY KEY,
    workflow_id     BIGINT REFERENCES erp.workflow_definition(workflow_id),
    document_type   VARCHAR(50) NOT NULL,
    document_pk_bigint BIGINT,
    document_pk_uuid  UUID,
    document_number VARCHAR(100),
    current_step_id BIGINT REFERENCES erp.workflow_step(step_id),
    status          VARCHAR(30) DEFAULT 'PENDING',
    requested_by    BIGINT REFERENCES erp.app_user(user_key),
    requested_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE erp.document_approval_history (
    approval_id     BIGSERIAL PRIMARY KEY,
    instance_id     BIGINT NOT NULL REFERENCES erp.document_workflow_instance(instance_id) ON DELETE CASCADE,
    step_id         BIGINT REFERENCES erp.workflow_step(step_id),
    action          VARCHAR(20) CHECK (action IN ('APPROVED','REJECTED','RETURNED')),
    action_by       BIGINT REFERENCES erp.app_user(user_key),
    action_at       TIMESTAMPTZ DEFAULT NOW(),
    remarks         TEXT
);

-- ====================================================================
-- 15. CRM (LEADS & ACTIVITIES)
-- ====================================================================

CREATE TABLE erp.crm_lead (
    lead_id         BIGSERIAL PRIMARY KEY,
    lead_code       VARCHAR(60) UNIQUE,
    lead_name       VARCHAR(255) NOT NULL,
    company_key     BIGINT REFERENCES erp.dim_company(company_key),
    contact_person  VARCHAR(255),
    email           VARCHAR(255),
    phone           VARCHAR(50),
    source          VARCHAR(100),
    status          erp.lead_status DEFAULT 'NEW',
    estimated_value NUMERIC(18,2),
    currency_code   CHAR(3) REFERENCES erp.dim_currency(currency_code),
    customer_party_key BIGINT REFERENCES erp.party(party_key),
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    created_by      BIGINT REFERENCES erp.app_user(user_key)
);

CREATE TABLE erp.crm_activity (
    activity_id     BIGSERIAL PRIMARY KEY,
    lead_id         BIGINT REFERENCES erp.crm_lead(lead_id) ON DELETE CASCADE,
    party_key       BIGINT REFERENCES erp.party(party_key),
    activity_type   erp.activity_type,
    subject         VARCHAR(255),
    notes           TEXT,
    due_at          TIMESTAMPTZ,
    completed_at    TIMESTAMPTZ,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    created_by      BIGINT REFERENCES erp.app_user(user_key)
);

-- ====================================================================
-- 16. MANAGEMENT REPORTING VIEWS
-- ====================================================================

CREATE OR REPLACE VIEW erp.vw_project_job_profitability AS
SELECT
    pj.project_job_id,
    pj.project_code,
    pj.name,
    pj.company_key,
    pj.customer_key,
    cc.cost_center_key,
    COALESCE(rev.revenue, 0) AS revenue,
    COALESCE(cost.cost, 0)   AS cost,
    COALESCE(rev.revenue, 0) - COALESCE(cost.cost, 0) AS profit
FROM erp.project_job pj
LEFT JOIN erp.dim_cost_center cc ON pj.cost_center_key = cc.cost_center_key
LEFT JOIN (
    SELECT
        ca.company_key,
        gll.cost_center_key,
        SUM(CASE WHEN ca.account_type = 'REVENUE'
                 THEN gll.credit - gll.debit ELSE 0 END) AS revenue
    FROM erp.gl_line gll
    JOIN erp.chart_of_accounts ca ON gll.account_key = ca.account_key
    GROUP BY ca.company_key, gll.cost_center_key
) rev ON rev.cost_center_key = cc.cost_center_key AND rev.company_key = pj.company_key
LEFT JOIN (
    SELECT
        ca.company_key,
        gll.cost_center_key,
        SUM(CASE WHEN ca.account_type IN ('EXPENSE','COGS')
                 THEN gll.debit - gll.credit ELSE 0 END) AS cost
    FROM erp.gl_line gll
    JOIN erp.chart_of_accounts ca ON gll.account_key = ca.account_key
    GROUP BY ca.company_key, gll.cost_center_key
) cost ON cost.cost_center_key = cc.cost_center_key AND cost.company_key = pj.company_key;

-- ====================================================================
-- END OF SUPER ERP FULL SCHEMA v1.5
-- ====================================================================

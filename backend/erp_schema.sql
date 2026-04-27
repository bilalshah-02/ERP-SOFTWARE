--
-- PostgreSQL database dump
--

\restrict AS2s41TZWhHQceDJpJgBQaLYGV9EBi2na4uO4k6hVyCZ3XUKMq444F1EbEuBR2m

-- Dumped from database version 18.1
-- Dumped by pg_dump version 18.1

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: erp; Type: SCHEMA; Schema: -; Owner: erp_app
--

CREATE SCHEMA erp;


ALTER SCHEMA erp OWNER TO erp_app;

--
-- Name: account_type; Type: TYPE; Schema: erp; Owner: postgres
--

CREATE TYPE erp.account_type AS ENUM (
    'ASSET',
    'LIABILITY',
    'EQUITY',
    'REVENUE',
    'EXPENSE',
    'COGS'
);


ALTER TYPE erp.account_type OWNER TO postgres;

--
-- Name: activity_type; Type: TYPE; Schema: erp; Owner: postgres
--

CREATE TYPE erp.activity_type AS ENUM (
    'CALL',
    'MEETING',
    'EMAIL',
    'TASK',
    'NOTE'
);


ALTER TYPE erp.activity_type OWNER TO postgres;

--
-- Name: asset_status; Type: TYPE; Schema: erp; Owner: postgres
--

CREATE TYPE erp.asset_status AS ENUM (
    'ACTIVE',
    'UNDER_CONSTRUCTION',
    'SUSPENDED',
    'DISPOSED',
    'FULLY_DEPRECIATED'
);


ALTER TYPE erp.asset_status OWNER TO postgres;

--
-- Name: cost_center_type; Type: TYPE; Schema: erp; Owner: postgres
--

CREATE TYPE erp.cost_center_type AS ENUM (
    'DEPARTMENT',
    'PROJECT',
    'PROCESS',
    'OVERHEAD',
    'OTHER'
);


ALTER TYPE erp.cost_center_type OWNER TO postgres;

--
-- Name: costing_method; Type: TYPE; Schema: erp; Owner: postgres
--

CREATE TYPE erp.costing_method AS ENUM (
    'FIFO',
    'LIFO',
    'AVERAGE',
    'STANDARD',
    'SPECIFIC'
);


ALTER TYPE erp.costing_method OWNER TO postgres;

--
-- Name: depreciation_method; Type: TYPE; Schema: erp; Owner: postgres
--

CREATE TYPE erp.depreciation_method AS ENUM (
    'STRAIGHT_LINE',
    'DECLINING_BALANCE',
    'UNITS_OF_PRODUCTION'
);


ALTER TYPE erp.depreciation_method OWNER TO postgres;

--
-- Name: document_status; Type: TYPE; Schema: erp; Owner: postgres
--

CREATE TYPE erp.document_status AS ENUM (
    'DRAFT',
    'CONFIRMED',
    'POSTED',
    'CANCELLED',
    'DELIVERED'
);


ALTER TYPE erp.document_status OWNER TO postgres;

--
-- Name: inventory_movement_type; Type: TYPE; Schema: erp; Owner: postgres
--

CREATE TYPE erp.inventory_movement_type AS ENUM (
    'IN',
    'OUT',
    'TRANSFER',
    'ADJUSTMENT'
);


ALTER TYPE erp.inventory_movement_type OWNER TO postgres;

--
-- Name: item_class; Type: TYPE; Schema: erp; Owner: postgres
--

CREATE TYPE erp.item_class AS ENUM (
    'INVENTORY',
    'MANUFACTURED',
    'SERVICE',
    'NON_INVENTORY',
    'KIT',
    'FIXED_ASSET'
);


ALTER TYPE erp.item_class OWNER TO postgres;

--
-- Name: job_cost_head; Type: TYPE; Schema: erp; Owner: postgres
--

CREATE TYPE erp.job_cost_head AS ENUM (
    'MATERIAL',
    'LABOR',
    'EQUIPMENT',
    'SUBCONTRACT',
    'OVERHEAD',
    'OTHER'
);


ALTER TYPE erp.job_cost_head OWNER TO postgres;

--
-- Name: lead_status; Type: TYPE; Schema: erp; Owner: postgres
--

CREATE TYPE erp.lead_status AS ENUM (
    'NEW',
    'QUALIFIED',
    'PROPOSAL',
    'WON',
    'LOST'
);


ALTER TYPE erp.lead_status OWNER TO postgres;

--
-- Name: payroll_component_kind; Type: TYPE; Schema: erp; Owner: postgres
--

CREATE TYPE erp.payroll_component_kind AS ENUM (
    'EARNING',
    'DEDUCTION',
    'EMPLOYER_CONTRIBUTION'
);


ALTER TYPE erp.payroll_component_kind OWNER TO postgres;

--
-- Name: project_status; Type: TYPE; Schema: erp; Owner: postgres
--

CREATE TYPE erp.project_status AS ENUM (
    'PLANNED',
    'IN_PROGRESS',
    'ON_HOLD',
    'COMPLETED',
    'CLOSED',
    'CANCELLED'
);


ALTER TYPE erp.project_status OWNER TO postgres;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: app_user; Type: TABLE; Schema: erp; Owner: postgres
--

CREATE TABLE erp.app_user (
    user_key bigint NOT NULL,
    username character varying(100) NOT NULL,
    full_name character varying(200),
    email character varying(255),
    password_hash text NOT NULL,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE erp.app_user OWNER TO postgres;

--
-- Name: app_user_role; Type: TABLE; Schema: erp; Owner: postgres
--

CREATE TABLE erp.app_user_role (
    user_key bigint NOT NULL,
    role_key bigint NOT NULL
);


ALTER TABLE erp.app_user_role OWNER TO postgres;

--
-- Name: app_user_user_key_seq; Type: SEQUENCE; Schema: erp; Owner: postgres
--

CREATE SEQUENCE erp.app_user_user_key_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE erp.app_user_user_key_seq OWNER TO postgres;

--
-- Name: app_user_user_key_seq; Type: SEQUENCE OWNED BY; Schema: erp; Owner: postgres
--

ALTER SEQUENCE erp.app_user_user_key_seq OWNED BY erp.app_user.user_key;


--
-- Name: asset_category; Type: TABLE; Schema: erp; Owner: postgres
--

CREATE TABLE erp.asset_category (
    asset_category_key bigint NOT NULL,
    category_code character varying(50) NOT NULL,
    name character varying(200) NOT NULL,
    depreciation_method erp.depreciation_method NOT NULL,
    useful_life_months integer,
    depreciation_account_key bigint,
    accumulated_dep_account_key bigint,
    disposal_gain_account_key bigint,
    disposal_loss_account_key bigint,
    created_at timestamp with time zone DEFAULT now(),
    created_by bigint
);


ALTER TABLE erp.asset_category OWNER TO postgres;

--
-- Name: asset_category_asset_category_key_seq; Type: SEQUENCE; Schema: erp; Owner: postgres
--

CREATE SEQUENCE erp.asset_category_asset_category_key_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE erp.asset_category_asset_category_key_seq OWNER TO postgres;

--
-- Name: asset_category_asset_category_key_seq; Type: SEQUENCE OWNED BY; Schema: erp; Owner: postgres
--

ALTER SEQUENCE erp.asset_category_asset_category_key_seq OWNED BY erp.asset_category.asset_category_key;


--
-- Name: audit_trail; Type: TABLE; Schema: erp; Owner: postgres
--

CREATE TABLE erp.audit_trail (
    audit_id bigint NOT NULL,
    table_name character varying(200) NOT NULL,
    record_pk text,
    action character varying(20) NOT NULL,
    changed_by bigint,
    changed_at timestamp with time zone DEFAULT now(),
    old_data jsonb,
    new_data jsonb
);


ALTER TABLE erp.audit_trail OWNER TO postgres;

--
-- Name: audit_trail_audit_id_seq; Type: SEQUENCE; Schema: erp; Owner: postgres
--

CREATE SEQUENCE erp.audit_trail_audit_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE erp.audit_trail_audit_id_seq OWNER TO postgres;

--
-- Name: audit_trail_audit_id_seq; Type: SEQUENCE OWNED BY; Schema: erp; Owner: postgres
--

ALTER SEQUENCE erp.audit_trail_audit_id_seq OWNED BY erp.audit_trail.audit_id;


--
-- Name: auth_group; Type: TABLE; Schema: erp; Owner: erp_app
--

CREATE TABLE erp.auth_group (
    id integer NOT NULL,
    name character varying(150) NOT NULL
);


ALTER TABLE erp.auth_group OWNER TO erp_app;

--
-- Name: auth_group_id_seq; Type: SEQUENCE; Schema: erp; Owner: erp_app
--

ALTER TABLE erp.auth_group ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME erp.auth_group_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: auth_group_permissions; Type: TABLE; Schema: erp; Owner: erp_app
--

CREATE TABLE erp.auth_group_permissions (
    id bigint NOT NULL,
    group_id integer NOT NULL,
    permission_id integer NOT NULL
);


ALTER TABLE erp.auth_group_permissions OWNER TO erp_app;

--
-- Name: auth_group_permissions_id_seq; Type: SEQUENCE; Schema: erp; Owner: erp_app
--

ALTER TABLE erp.auth_group_permissions ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME erp.auth_group_permissions_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: auth_permission; Type: TABLE; Schema: erp; Owner: erp_app
--

CREATE TABLE erp.auth_permission (
    id integer NOT NULL,
    name character varying(255) NOT NULL,
    content_type_id integer NOT NULL,
    codename character varying(100) NOT NULL
);


ALTER TABLE erp.auth_permission OWNER TO erp_app;

--
-- Name: auth_permission_id_seq; Type: SEQUENCE; Schema: erp; Owner: erp_app
--

ALTER TABLE erp.auth_permission ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME erp.auth_permission_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: auth_user; Type: TABLE; Schema: erp; Owner: erp_app
--

CREATE TABLE erp.auth_user (
    id integer NOT NULL,
    password character varying(128) NOT NULL,
    last_login timestamp with time zone,
    is_superuser boolean NOT NULL,
    username character varying(150) NOT NULL,
    first_name character varying(150) NOT NULL,
    last_name character varying(150) NOT NULL,
    email character varying(254) NOT NULL,
    is_staff boolean NOT NULL,
    is_active boolean NOT NULL,
    date_joined timestamp with time zone NOT NULL
);


ALTER TABLE erp.auth_user OWNER TO erp_app;

--
-- Name: auth_user_groups; Type: TABLE; Schema: erp; Owner: erp_app
--

CREATE TABLE erp.auth_user_groups (
    id bigint NOT NULL,
    user_id integer NOT NULL,
    group_id integer NOT NULL
);


ALTER TABLE erp.auth_user_groups OWNER TO erp_app;

--
-- Name: auth_user_groups_id_seq; Type: SEQUENCE; Schema: erp; Owner: erp_app
--

ALTER TABLE erp.auth_user_groups ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME erp.auth_user_groups_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: auth_user_id_seq; Type: SEQUENCE; Schema: erp; Owner: erp_app
--

ALTER TABLE erp.auth_user ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME erp.auth_user_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: auth_user_user_permissions; Type: TABLE; Schema: erp; Owner: erp_app
--

CREATE TABLE erp.auth_user_user_permissions (
    id bigint NOT NULL,
    user_id integer NOT NULL,
    permission_id integer NOT NULL
);


ALTER TABLE erp.auth_user_user_permissions OWNER TO erp_app;

--
-- Name: auth_user_user_permissions_id_seq; Type: SEQUENCE; Schema: erp; Owner: erp_app
--

ALTER TABLE erp.auth_user_user_permissions ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME erp.auth_user_user_permissions_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: batch_cost_detail; Type: TABLE; Schema: erp; Owner: postgres
--

CREATE TABLE erp.batch_cost_detail (
    batch_cost_id bigint NOT NULL,
    prod_batch_key bigint NOT NULL,
    cost_head erp.job_cost_head NOT NULL,
    amount numeric(18,2) NOT NULL,
    source_doc_type character varying(50),
    source_doc_pk_bigint bigint,
    source_doc_pk_uuid uuid,
    notes text,
    created_at timestamp with time zone DEFAULT now(),
    created_by bigint
);


ALTER TABLE erp.batch_cost_detail OWNER TO postgres;

--
-- Name: batch_cost_detail_batch_cost_id_seq; Type: SEQUENCE; Schema: erp; Owner: postgres
--

CREATE SEQUENCE erp.batch_cost_detail_batch_cost_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE erp.batch_cost_detail_batch_cost_id_seq OWNER TO postgres;

--
-- Name: batch_cost_detail_batch_cost_id_seq; Type: SEQUENCE OWNED BY; Schema: erp; Owner: postgres
--

ALTER SEQUENCE erp.batch_cost_detail_batch_cost_id_seq OWNED BY erp.batch_cost_detail.batch_cost_id;


--
-- Name: bom; Type: TABLE; Schema: erp; Owner: postgres
--

CREATE TABLE erp.bom (
    bom_key bigint NOT NULL,
    parent_item_key bigint NOT NULL,
    bom_code character varying(50) NOT NULL,
    description text,
    is_active boolean DEFAULT true
);


ALTER TABLE erp.bom OWNER TO postgres;

--
-- Name: bom_bom_key_seq; Type: SEQUENCE; Schema: erp; Owner: postgres
--

CREATE SEQUENCE erp.bom_bom_key_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE erp.bom_bom_key_seq OWNER TO postgres;

--
-- Name: bom_bom_key_seq; Type: SEQUENCE OWNED BY; Schema: erp; Owner: postgres
--

ALTER SEQUENCE erp.bom_bom_key_seq OWNED BY erp.bom.bom_key;


--
-- Name: bom_component; Type: TABLE; Schema: erp; Owner: postgres
--

CREATE TABLE erp.bom_component (
    bom_component_key bigint NOT NULL,
    bom_key bigint NOT NULL,
    component_item_key bigint NOT NULL,
    quantity_per numeric(18,6) NOT NULL,
    scrap_percent numeric(5,2) DEFAULT 0
);


ALTER TABLE erp.bom_component OWNER TO postgres;

--
-- Name: bom_component_bom_component_key_seq; Type: SEQUENCE; Schema: erp; Owner: postgres
--

CREATE SEQUENCE erp.bom_component_bom_component_key_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE erp.bom_component_bom_component_key_seq OWNER TO postgres;

--
-- Name: bom_component_bom_component_key_seq; Type: SEQUENCE OWNED BY; Schema: erp; Owner: postgres
--

ALTER SEQUENCE erp.bom_component_bom_component_key_seq OWNED BY erp.bom_component.bom_component_key;


--
-- Name: chart_of_accounts; Type: TABLE; Schema: erp; Owner: postgres
--

CREATE TABLE erp.chart_of_accounts (
    account_key bigint NOT NULL,
    company_key bigint NOT NULL,
    account_code character varying(50) NOT NULL,
    account_name character varying(255) NOT NULL,
    account_type erp.account_type NOT NULL,
    parent_key bigint,
    is_posting boolean DEFAULT true,
    is_active boolean DEFAULT true
);


ALTER TABLE erp.chart_of_accounts OWNER TO postgres;

--
-- Name: chart_of_accounts_account_key_seq; Type: SEQUENCE; Schema: erp; Owner: postgres
--

CREATE SEQUENCE erp.chart_of_accounts_account_key_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE erp.chart_of_accounts_account_key_seq OWNER TO postgres;

--
-- Name: chart_of_accounts_account_key_seq; Type: SEQUENCE OWNED BY; Schema: erp; Owner: postgres
--

ALTER SEQUENCE erp.chart_of_accounts_account_key_seq OWNED BY erp.chart_of_accounts.account_key;


--
-- Name: crm_activity; Type: TABLE; Schema: erp; Owner: postgres
--

CREATE TABLE erp.crm_activity (
    activity_id bigint NOT NULL,
    lead_id bigint,
    party_key bigint,
    activity_type erp.activity_type,
    subject character varying(255),
    notes text,
    due_at timestamp with time zone,
    completed_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now(),
    created_by bigint
);


ALTER TABLE erp.crm_activity OWNER TO postgres;

--
-- Name: crm_activity_activity_id_seq; Type: SEQUENCE; Schema: erp; Owner: postgres
--

CREATE SEQUENCE erp.crm_activity_activity_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE erp.crm_activity_activity_id_seq OWNER TO postgres;

--
-- Name: crm_activity_activity_id_seq; Type: SEQUENCE OWNED BY; Schema: erp; Owner: postgres
--

ALTER SEQUENCE erp.crm_activity_activity_id_seq OWNED BY erp.crm_activity.activity_id;


--
-- Name: crm_lead; Type: TABLE; Schema: erp; Owner: postgres
--

CREATE TABLE erp.crm_lead (
    lead_id bigint NOT NULL,
    lead_code character varying(60),
    lead_name character varying(255) NOT NULL,
    company_key bigint,
    contact_person character varying(255),
    email character varying(255),
    phone character varying(50),
    source character varying(100),
    status erp.lead_status DEFAULT 'NEW'::erp.lead_status,
    estimated_value numeric(18,2),
    currency_code character(3),
    customer_party_key bigint,
    created_at timestamp with time zone DEFAULT now(),
    created_by bigint
);


ALTER TABLE erp.crm_lead OWNER TO postgres;

--
-- Name: crm_lead_lead_id_seq; Type: SEQUENCE; Schema: erp; Owner: postgres
--

CREATE SEQUENCE erp.crm_lead_lead_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE erp.crm_lead_lead_id_seq OWNER TO postgres;

--
-- Name: crm_lead_lead_id_seq; Type: SEQUENCE OWNED BY; Schema: erp; Owner: postgres
--

ALTER SEQUENCE erp.crm_lead_lead_id_seq OWNED BY erp.crm_lead.lead_id;


--
-- Name: delivery_note; Type: TABLE; Schema: erp; Owner: postgres
--

CREATE TABLE erp.delivery_note (
    dn_id bigint NOT NULL,
    company_key bigint NOT NULL,
    dn_number character varying(50) NOT NULL,
    so_id bigint,
    delivery_date date NOT NULL,
    warehouse_key bigint NOT NULL,
    status erp.document_status DEFAULT 'DRAFT'::erp.document_status,
    notes text,
    created_by bigint,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE erp.delivery_note OWNER TO postgres;

--
-- Name: delivery_note_dn_id_seq; Type: SEQUENCE; Schema: erp; Owner: postgres
--

CREATE SEQUENCE erp.delivery_note_dn_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE erp.delivery_note_dn_id_seq OWNER TO postgres;

--
-- Name: delivery_note_dn_id_seq; Type: SEQUENCE OWNED BY; Schema: erp; Owner: postgres
--

ALTER SEQUENCE erp.delivery_note_dn_id_seq OWNED BY erp.delivery_note.dn_id;


--
-- Name: delivery_note_line; Type: TABLE; Schema: erp; Owner: postgres
--

CREATE TABLE erp.delivery_note_line (
    dn_line_id bigint NOT NULL,
    dn_id bigint NOT NULL,
    line_no integer NOT NULL,
    item_key bigint NOT NULL,
    description text,
    quantity_delivered numeric(18,3) NOT NULL,
    unit_cost numeric(18,6),
    total_cost numeric(18,2),
    so_line_id bigint
);


ALTER TABLE erp.delivery_note_line OWNER TO postgres;

--
-- Name: delivery_note_line_dn_line_id_seq; Type: SEQUENCE; Schema: erp; Owner: postgres
--

CREATE SEQUENCE erp.delivery_note_line_dn_line_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE erp.delivery_note_line_dn_line_id_seq OWNER TO postgres;

--
-- Name: delivery_note_line_dn_line_id_seq; Type: SEQUENCE OWNED BY; Schema: erp; Owner: postgres
--

ALTER SEQUENCE erp.delivery_note_line_dn_line_id_seq OWNED BY erp.delivery_note_line.dn_line_id;


--
-- Name: dim_batch; Type: TABLE; Schema: erp; Owner: postgres
--

CREATE TABLE erp.dim_batch (
    batch_key bigint NOT NULL,
    item_key bigint NOT NULL,
    batch_number character varying(100) NOT NULL,
    mfg_date date,
    exp_date date,
    qc_released boolean DEFAULT false
);


ALTER TABLE erp.dim_batch OWNER TO postgres;

--
-- Name: dim_batch_batch_key_seq; Type: SEQUENCE; Schema: erp; Owner: postgres
--

CREATE SEQUENCE erp.dim_batch_batch_key_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE erp.dim_batch_batch_key_seq OWNER TO postgres;

--
-- Name: dim_batch_batch_key_seq; Type: SEQUENCE OWNED BY; Schema: erp; Owner: postgres
--

ALTER SEQUENCE erp.dim_batch_batch_key_seq OWNED BY erp.dim_batch.batch_key;


--
-- Name: dim_company; Type: TABLE; Schema: erp; Owner: postgres
--

CREATE TABLE erp.dim_company (
    company_key bigint NOT NULL,
    company_code character varying(50) NOT NULL,
    name character varying(255) NOT NULL,
    legal_name character varying(255),
    tax_id character varying(100),
    base_currency character(3),
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE erp.dim_company OWNER TO postgres;

--
-- Name: dim_company_company_key_seq; Type: SEQUENCE; Schema: erp; Owner: postgres
--

CREATE SEQUENCE erp.dim_company_company_key_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE erp.dim_company_company_key_seq OWNER TO postgres;

--
-- Name: dim_company_company_key_seq; Type: SEQUENCE OWNED BY; Schema: erp; Owner: postgres
--

ALTER SEQUENCE erp.dim_company_company_key_seq OWNED BY erp.dim_company.company_key;


--
-- Name: dim_cost_center; Type: TABLE; Schema: erp; Owner: postgres
--

CREATE TABLE erp.dim_cost_center (
    cost_center_key bigint NOT NULL,
    company_key bigint NOT NULL,
    code character varying(50) NOT NULL,
    name character varying(255) NOT NULL,
    parent_key bigint,
    cost_center_type erp.cost_center_type DEFAULT 'DEPARTMENT'::erp.cost_center_type,
    is_active boolean DEFAULT true
);


ALTER TABLE erp.dim_cost_center OWNER TO postgres;

--
-- Name: dim_cost_center_cost_center_key_seq; Type: SEQUENCE; Schema: erp; Owner: postgres
--

CREATE SEQUENCE erp.dim_cost_center_cost_center_key_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE erp.dim_cost_center_cost_center_key_seq OWNER TO postgres;

--
-- Name: dim_cost_center_cost_center_key_seq; Type: SEQUENCE OWNED BY; Schema: erp; Owner: postgres
--

ALTER SEQUENCE erp.dim_cost_center_cost_center_key_seq OWNED BY erp.dim_cost_center.cost_center_key;


--
-- Name: dim_currency; Type: TABLE; Schema: erp; Owner: postgres
--

CREATE TABLE erp.dim_currency (
    currency_code character(3) NOT NULL,
    currency_name character varying(100),
    symbol character varying(10)
);


ALTER TABLE erp.dim_currency OWNER TO postgres;

--
-- Name: dim_item; Type: TABLE; Schema: erp; Owner: postgres
--

CREATE TABLE erp.dim_item (
    item_key bigint NOT NULL,
    item_code character varying(50) NOT NULL,
    name character varying(255) NOT NULL,
    description text,
    item_class erp.item_class NOT NULL,
    uom character varying(20) NOT NULL,
    costing_method erp.costing_method DEFAULT 'FIFO'::erp.costing_method,
    is_batch_tracked boolean DEFAULT false,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    avg_daily_usage numeric(18,4) DEFAULT 0,
    min_daily_usage numeric(18,4) DEFAULT 0,
    max_daily_usage numeric(18,4) DEFAULT 0,
    avg_lead_time_days integer DEFAULT 0,
    min_lead_time_days integer DEFAULT 0,
    max_lead_time_days integer DEFAULT 0,
    economic_order_qty numeric(18,4) DEFAULT 0,
    reorder_level numeric(18,4) DEFAULT 0,
    min_stock_absolute numeric(18,4) DEFAULT 0,
    min_stock_normal numeric(18,4) DEFAULT 0,
    max_stock_absolute numeric(18,4) DEFAULT 0,
    max_stock_normal numeric(18,4) DEFAULT 0
);


ALTER TABLE erp.dim_item OWNER TO postgres;

--
-- Name: COLUMN dim_item.avg_daily_usage; Type: COMMENT; Schema: erp; Owner: postgres
--

COMMENT ON COLUMN erp.dim_item.avg_daily_usage IS 'Average daily usage/consumption';


--
-- Name: COLUMN dim_item.min_daily_usage; Type: COMMENT; Schema: erp; Owner: postgres
--

COMMENT ON COLUMN erp.dim_item.min_daily_usage IS 'Minimum daily usage';


--
-- Name: COLUMN dim_item.max_daily_usage; Type: COMMENT; Schema: erp; Owner: postgres
--

COMMENT ON COLUMN erp.dim_item.max_daily_usage IS 'Maximum daily usage';


--
-- Name: COLUMN dim_item.avg_lead_time_days; Type: COMMENT; Schema: erp; Owner: postgres
--

COMMENT ON COLUMN erp.dim_item.avg_lead_time_days IS 'Average lead time in days';


--
-- Name: COLUMN dim_item.min_lead_time_days; Type: COMMENT; Schema: erp; Owner: postgres
--

COMMENT ON COLUMN erp.dim_item.min_lead_time_days IS 'Minimum lead time in days';


--
-- Name: COLUMN dim_item.max_lead_time_days; Type: COMMENT; Schema: erp; Owner: postgres
--

COMMENT ON COLUMN erp.dim_item.max_lead_time_days IS 'Maximum lead time in days';


--
-- Name: COLUMN dim_item.economic_order_qty; Type: COMMENT; Schema: erp; Owner: postgres
--

COMMENT ON COLUMN erp.dim_item.economic_order_qty IS 'Economic Order Quantity (EOQ)';


--
-- Name: COLUMN dim_item.reorder_level; Type: COMMENT; Schema: erp; Owner: postgres
--

COMMENT ON COLUMN erp.dim_item.reorder_level IS 'Reorder Level = Max Usage x Max Lead Time';


--
-- Name: COLUMN dim_item.min_stock_absolute; Type: COMMENT; Schema: erp; Owner: postgres
--

COMMENT ON COLUMN erp.dim_item.min_stock_absolute IS 'Min Absolute = Reorder Level - (Max Usage x Max Lead Time)';


--
-- Name: COLUMN dim_item.min_stock_normal; Type: COMMENT; Schema: erp; Owner: postgres
--

COMMENT ON COLUMN erp.dim_item.min_stock_normal IS 'Min Normal = Reorder Level - (Avg Usage x Avg Lead Time)';


--
-- Name: COLUMN dim_item.max_stock_absolute; Type: COMMENT; Schema: erp; Owner: postgres
--

COMMENT ON COLUMN erp.dim_item.max_stock_absolute IS 'Max Absolute = Reorder Level - (Min Usage x Min Lead Time) + EOQ';


--
-- Name: COLUMN dim_item.max_stock_normal; Type: COMMENT; Schema: erp; Owner: postgres
--

COMMENT ON COLUMN erp.dim_item.max_stock_normal IS 'Max Normal = Reorder Level - (Avg Usage x Avg Lead Time) + EOQ';


--
-- Name: dim_item_item_key_seq; Type: SEQUENCE; Schema: erp; Owner: postgres
--

CREATE SEQUENCE erp.dim_item_item_key_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE erp.dim_item_item_key_seq OWNER TO postgres;

--
-- Name: dim_item_item_key_seq; Type: SEQUENCE OWNED BY; Schema: erp; Owner: postgres
--

ALTER SEQUENCE erp.dim_item_item_key_seq OWNED BY erp.dim_item.item_key;


--
-- Name: dim_tax_code; Type: TABLE; Schema: erp; Owner: postgres
--

CREATE TABLE erp.dim_tax_code (
    tax_key bigint NOT NULL,
    tax_code character varying(50) NOT NULL,
    description text,
    rate numeric(8,4) NOT NULL,
    is_vat boolean DEFAULT true,
    is_withholding boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE erp.dim_tax_code OWNER TO postgres;

--
-- Name: dim_tax_code_tax_key_seq; Type: SEQUENCE; Schema: erp; Owner: postgres
--

CREATE SEQUENCE erp.dim_tax_code_tax_key_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE erp.dim_tax_code_tax_key_seq OWNER TO postgres;

--
-- Name: dim_tax_code_tax_key_seq; Type: SEQUENCE OWNED BY; Schema: erp; Owner: postgres
--

ALTER SEQUENCE erp.dim_tax_code_tax_key_seq OWNED BY erp.dim_tax_code.tax_key;


--
-- Name: django_admin_log; Type: TABLE; Schema: erp; Owner: erp_app
--

CREATE TABLE erp.django_admin_log (
    id integer NOT NULL,
    action_time timestamp with time zone NOT NULL,
    object_id text,
    object_repr character varying(200) NOT NULL,
    action_flag smallint NOT NULL,
    change_message text NOT NULL,
    content_type_id integer,
    user_id integer NOT NULL,
    CONSTRAINT django_admin_log_action_flag_check CHECK ((action_flag >= 0))
);


ALTER TABLE erp.django_admin_log OWNER TO erp_app;

--
-- Name: django_admin_log_id_seq; Type: SEQUENCE; Schema: erp; Owner: erp_app
--

ALTER TABLE erp.django_admin_log ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME erp.django_admin_log_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: django_content_type; Type: TABLE; Schema: erp; Owner: erp_app
--

CREATE TABLE erp.django_content_type (
    id integer NOT NULL,
    app_label character varying(100) NOT NULL,
    model character varying(100) NOT NULL
);


ALTER TABLE erp.django_content_type OWNER TO erp_app;

--
-- Name: django_content_type_id_seq; Type: SEQUENCE; Schema: erp; Owner: erp_app
--

ALTER TABLE erp.django_content_type ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME erp.django_content_type_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: django_migrations; Type: TABLE; Schema: erp; Owner: erp_app
--

CREATE TABLE erp.django_migrations (
    id bigint NOT NULL,
    app character varying(255) NOT NULL,
    name character varying(255) NOT NULL,
    applied timestamp with time zone NOT NULL
);


ALTER TABLE erp.django_migrations OWNER TO erp_app;

--
-- Name: django_migrations_id_seq; Type: SEQUENCE; Schema: erp; Owner: erp_app
--

ALTER TABLE erp.django_migrations ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME erp.django_migrations_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: django_session; Type: TABLE; Schema: erp; Owner: erp_app
--

CREATE TABLE erp.django_session (
    session_key character varying(40) NOT NULL,
    session_data text NOT NULL,
    expire_date timestamp with time zone NOT NULL
);


ALTER TABLE erp.django_session OWNER TO erp_app;

--
-- Name: document_approval_history; Type: TABLE; Schema: erp; Owner: postgres
--

CREATE TABLE erp.document_approval_history (
    approval_id bigint NOT NULL,
    instance_id bigint NOT NULL,
    step_id bigint,
    action character varying(20),
    action_by bigint,
    action_at timestamp with time zone DEFAULT now(),
    remarks text,
    CONSTRAINT document_approval_history_action_check CHECK (((action)::text = ANY ((ARRAY['APPROVED'::character varying, 'REJECTED'::character varying, 'RETURNED'::character varying])::text[])))
);


ALTER TABLE erp.document_approval_history OWNER TO postgres;

--
-- Name: document_approval_history_approval_id_seq; Type: SEQUENCE; Schema: erp; Owner: postgres
--

CREATE SEQUENCE erp.document_approval_history_approval_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE erp.document_approval_history_approval_id_seq OWNER TO postgres;

--
-- Name: document_approval_history_approval_id_seq; Type: SEQUENCE OWNED BY; Schema: erp; Owner: postgres
--

ALTER SEQUENCE erp.document_approval_history_approval_id_seq OWNED BY erp.document_approval_history.approval_id;


--
-- Name: document_workflow_instance; Type: TABLE; Schema: erp; Owner: postgres
--

CREATE TABLE erp.document_workflow_instance (
    instance_id bigint NOT NULL,
    workflow_id bigint,
    document_type character varying(50) NOT NULL,
    document_pk_bigint bigint,
    document_pk_uuid uuid,
    document_number character varying(100),
    current_step_id bigint,
    status character varying(30) DEFAULT 'PENDING'::character varying,
    requested_by bigint,
    requested_at timestamp with time zone DEFAULT now()
);


ALTER TABLE erp.document_workflow_instance OWNER TO postgres;

--
-- Name: document_workflow_instance_instance_id_seq; Type: SEQUENCE; Schema: erp; Owner: postgres
--

CREATE SEQUENCE erp.document_workflow_instance_instance_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE erp.document_workflow_instance_instance_id_seq OWNER TO postgres;

--
-- Name: document_workflow_instance_instance_id_seq; Type: SEQUENCE OWNED BY; Schema: erp; Owner: postgres
--

ALTER SEQUENCE erp.document_workflow_instance_instance_id_seq OWNED BY erp.document_workflow_instance.instance_id;


--
-- Name: employee; Type: TABLE; Schema: erp; Owner: postgres
--

CREATE TABLE erp.employee (
    employee_id bigint NOT NULL,
    party_key bigint,
    employee_code character varying(50) NOT NULL,
    first_name character varying(100),
    last_name character varying(100),
    hire_date date,
    termination_date date,
    cost_center_key bigint,
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE erp.employee OWNER TO postgres;

--
-- Name: employee_employee_id_seq; Type: SEQUENCE; Schema: erp; Owner: postgres
--

CREATE SEQUENCE erp.employee_employee_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE erp.employee_employee_id_seq OWNER TO postgres;

--
-- Name: employee_employee_id_seq; Type: SEQUENCE OWNED BY; Schema: erp; Owner: postgres
--

ALTER SEQUENCE erp.employee_employee_id_seq OWNED BY erp.employee.employee_id;


--
-- Name: fiscal_period; Type: TABLE; Schema: erp; Owner: postgres
--

CREATE TABLE erp.fiscal_period (
    period_key bigint NOT NULL,
    company_key bigint NOT NULL,
    period_code character varying(20) NOT NULL,
    start_date date NOT NULL,
    end_date date NOT NULL,
    is_closed boolean DEFAULT false
);


ALTER TABLE erp.fiscal_period OWNER TO postgres;

--
-- Name: fiscal_period_period_key_seq; Type: SEQUENCE; Schema: erp; Owner: postgres
--

CREATE SEQUENCE erp.fiscal_period_period_key_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE erp.fiscal_period_period_key_seq OWNER TO postgres;

--
-- Name: fiscal_period_period_key_seq; Type: SEQUENCE OWNED BY; Schema: erp; Owner: postgres
--

ALTER SEQUENCE erp.fiscal_period_period_key_seq OWNED BY erp.fiscal_period.period_key;


--
-- Name: fixed_asset; Type: TABLE; Schema: erp; Owner: postgres
--

CREATE TABLE erp.fixed_asset (
    fixed_asset_key bigint NOT NULL,
    asset_code character varying(60) NOT NULL,
    asset_name character varying(255) NOT NULL,
    company_key bigint NOT NULL,
    asset_category_key bigint NOT NULL,
    cost_center_key bigint,
    related_item_key bigint,
    purchase_date date,
    purchase_cost numeric(18,2),
    salvage_value numeric(18,2),
    start_depreciation_date date,
    status erp.asset_status DEFAULT 'ACTIVE'::erp.asset_status,
    remarks text,
    created_at timestamp with time zone DEFAULT now(),
    created_by bigint
);


ALTER TABLE erp.fixed_asset OWNER TO postgres;

--
-- Name: fixed_asset_depreciation_line; Type: TABLE; Schema: erp; Owner: postgres
--

CREATE TABLE erp.fixed_asset_depreciation_line (
    dep_line_id bigint NOT NULL,
    dep_run_id bigint NOT NULL,
    fixed_asset_key bigint NOT NULL,
    depreciation_amount numeric(18,2) NOT NULL,
    period_start date NOT NULL,
    period_end date NOT NULL,
    gl_id bigint,
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE erp.fixed_asset_depreciation_line OWNER TO postgres;

--
-- Name: fixed_asset_depreciation_line_dep_line_id_seq; Type: SEQUENCE; Schema: erp; Owner: postgres
--

CREATE SEQUENCE erp.fixed_asset_depreciation_line_dep_line_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE erp.fixed_asset_depreciation_line_dep_line_id_seq OWNER TO postgres;

--
-- Name: fixed_asset_depreciation_line_dep_line_id_seq; Type: SEQUENCE OWNED BY; Schema: erp; Owner: postgres
--

ALTER SEQUENCE erp.fixed_asset_depreciation_line_dep_line_id_seq OWNED BY erp.fixed_asset_depreciation_line.dep_line_id;


--
-- Name: fixed_asset_depreciation_run; Type: TABLE; Schema: erp; Owner: postgres
--

CREATE TABLE erp.fixed_asset_depreciation_run (
    dep_run_id bigint NOT NULL,
    run_date date NOT NULL,
    period_start date NOT NULL,
    period_end date NOT NULL,
    status character varying(30) DEFAULT 'DRAFT'::character varying,
    created_at timestamp with time zone DEFAULT now(),
    created_by bigint
);


ALTER TABLE erp.fixed_asset_depreciation_run OWNER TO postgres;

--
-- Name: fixed_asset_depreciation_run_dep_run_id_seq; Type: SEQUENCE; Schema: erp; Owner: postgres
--

CREATE SEQUENCE erp.fixed_asset_depreciation_run_dep_run_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE erp.fixed_asset_depreciation_run_dep_run_id_seq OWNER TO postgres;

--
-- Name: fixed_asset_depreciation_run_dep_run_id_seq; Type: SEQUENCE OWNED BY; Schema: erp; Owner: postgres
--

ALTER SEQUENCE erp.fixed_asset_depreciation_run_dep_run_id_seq OWNED BY erp.fixed_asset_depreciation_run.dep_run_id;


--
-- Name: fixed_asset_fixed_asset_key_seq; Type: SEQUENCE; Schema: erp; Owner: postgres
--

CREATE SEQUENCE erp.fixed_asset_fixed_asset_key_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE erp.fixed_asset_fixed_asset_key_seq OWNER TO postgres;

--
-- Name: fixed_asset_fixed_asset_key_seq; Type: SEQUENCE OWNED BY; Schema: erp; Owner: postgres
--

ALTER SEQUENCE erp.fixed_asset_fixed_asset_key_seq OWNED BY erp.fixed_asset.fixed_asset_key;


--
-- Name: gl_journal; Type: TABLE; Schema: erp; Owner: postgres
--

CREATE TABLE erp.gl_journal (
    gl_id bigint NOT NULL,
    company_key bigint NOT NULL,
    journal_number character varying(50) NOT NULL,
    journal_date date NOT NULL,
    period_key bigint,
    description text,
    status erp.document_status DEFAULT 'DRAFT'::erp.document_status,
    created_by bigint,
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE erp.gl_journal OWNER TO postgres;

--
-- Name: gl_journal_gl_id_seq; Type: SEQUENCE; Schema: erp; Owner: postgres
--

CREATE SEQUENCE erp.gl_journal_gl_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE erp.gl_journal_gl_id_seq OWNER TO postgres;

--
-- Name: gl_journal_gl_id_seq; Type: SEQUENCE OWNED BY; Schema: erp; Owner: postgres
--

ALTER SEQUENCE erp.gl_journal_gl_id_seq OWNED BY erp.gl_journal.gl_id;


--
-- Name: gl_line; Type: TABLE; Schema: erp; Owner: postgres
--

CREATE TABLE erp.gl_line (
    gl_line_id bigint NOT NULL,
    gl_id bigint NOT NULL,
    line_no integer NOT NULL,
    account_key bigint NOT NULL,
    cost_center_key bigint,
    project_job_id bigint,
    description text,
    debit numeric(18,2) DEFAULT 0,
    credit numeric(18,2) DEFAULT 0
);


ALTER TABLE erp.gl_line OWNER TO postgres;

--
-- Name: gl_line_gl_line_id_seq; Type: SEQUENCE; Schema: erp; Owner: postgres
--

CREATE SEQUENCE erp.gl_line_gl_line_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE erp.gl_line_gl_line_id_seq OWNER TO postgres;

--
-- Name: gl_line_gl_line_id_seq; Type: SEQUENCE OWNED BY; Schema: erp; Owner: postgres
--

ALTER SEQUENCE erp.gl_line_gl_line_id_seq OWNED BY erp.gl_line.gl_line_id;


--
-- Name: inventory_balance; Type: TABLE; Schema: erp; Owner: postgres
--

CREATE TABLE erp.inventory_balance (
    balance_id bigint NOT NULL,
    company_key bigint NOT NULL,
    item_key bigint NOT NULL,
    warehouse_key bigint NOT NULL,
    bin_key bigint,
    batch_key bigint,
    quantity_on_hand numeric(18,3) DEFAULT 0,
    quantity_reserved numeric(18,3) DEFAULT 0,
    avg_cost numeric(18,6) DEFAULT 0,
    total_value numeric(18,2) DEFAULT 0
);


ALTER TABLE erp.inventory_balance OWNER TO postgres;

--
-- Name: inventory_balance_balance_id_seq; Type: SEQUENCE; Schema: erp; Owner: postgres
--

CREATE SEQUENCE erp.inventory_balance_balance_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE erp.inventory_balance_balance_id_seq OWNER TO postgres;

--
-- Name: inventory_balance_balance_id_seq; Type: SEQUENCE OWNED BY; Schema: erp; Owner: postgres
--

ALTER SEQUENCE erp.inventory_balance_balance_id_seq OWNED BY erp.inventory_balance.balance_id;


--
-- Name: inventory_transaction; Type: TABLE; Schema: erp; Owner: postgres
--

CREATE TABLE erp.inventory_transaction (
    inv_txn_id bigint NOT NULL,
    company_key bigint NOT NULL,
    item_key bigint NOT NULL,
    warehouse_key bigint NOT NULL,
    bin_key bigint,
    batch_key bigint,
    movement_type erp.inventory_movement_type NOT NULL,
    quantity numeric(18,3) NOT NULL,
    unit_cost numeric(18,6),
    total_cost numeric(18,2),
    tx_date timestamp with time zone DEFAULT now(),
    source_doc_type character varying(50),
    source_doc_id text,
    project_job_id bigint
);


ALTER TABLE erp.inventory_transaction OWNER TO postgres;

--
-- Name: inventory_transaction_inv_txn_id_seq; Type: SEQUENCE; Schema: erp; Owner: postgres
--

CREATE SEQUENCE erp.inventory_transaction_inv_txn_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE erp.inventory_transaction_inv_txn_id_seq OWNER TO postgres;

--
-- Name: inventory_transaction_inv_txn_id_seq; Type: SEQUENCE OWNED BY; Schema: erp; Owner: postgres
--

ALTER SEQUENCE erp.inventory_transaction_inv_txn_id_seq OWNED BY erp.inventory_transaction.inv_txn_id;


--
-- Name: invoice; Type: TABLE; Schema: erp; Owner: postgres
--

CREATE TABLE erp.invoice (
    invoice_id uuid DEFAULT gen_random_uuid() NOT NULL,
    company_key bigint NOT NULL,
    invoice_number character varying(50) NOT NULL,
    invoice_type character varying(20) NOT NULL,
    party_key bigint NOT NULL,
    invoice_date date NOT NULL,
    due_date date,
    status erp.document_status DEFAULT 'DRAFT'::erp.document_status,
    currency_code character(3),
    remarks text,
    created_by bigint,
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE erp.invoice OWNER TO postgres;

--
-- Name: invoice_line; Type: TABLE; Schema: erp; Owner: postgres
--

CREATE TABLE erp.invoice_line (
    line_id bigint NOT NULL,
    invoice_id uuid NOT NULL,
    line_no integer NOT NULL,
    item_key bigint,
    description text,
    quantity numeric(18,3) DEFAULT 0,
    unit_price numeric(18,4) DEFAULT 0,
    line_amount numeric(18,2) NOT NULL,
    tax_amount numeric(18,2) DEFAULT 0,
    tax_key bigint,
    cost_center_key bigint,
    project_job_id bigint
);


ALTER TABLE erp.invoice_line OWNER TO postgres;

--
-- Name: invoice_line_line_id_seq; Type: SEQUENCE; Schema: erp; Owner: postgres
--

CREATE SEQUENCE erp.invoice_line_line_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE erp.invoice_line_line_id_seq OWNER TO postgres;

--
-- Name: invoice_line_line_id_seq; Type: SEQUENCE OWNED BY; Schema: erp; Owner: postgres
--

ALTER SEQUENCE erp.invoice_line_line_id_seq OWNED BY erp.invoice_line.line_id;


--
-- Name: lims_test_result; Type: TABLE; Schema: erp; Owner: postgres
--

CREATE TABLE erp.lims_test_result (
    test_id bigint NOT NULL,
    batch_key bigint NOT NULL,
    test_date date NOT NULL,
    parameter character varying(200) NOT NULL,
    result_value character varying(200),
    passed boolean,
    remarks text,
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE erp.lims_test_result OWNER TO postgres;

--
-- Name: lims_test_result_test_id_seq; Type: SEQUENCE; Schema: erp; Owner: postgres
--

CREATE SEQUENCE erp.lims_test_result_test_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE erp.lims_test_result_test_id_seq OWNER TO postgres;

--
-- Name: lims_test_result_test_id_seq; Type: SEQUENCE OWNED BY; Schema: erp; Owner: postgres
--

ALTER SEQUENCE erp.lims_test_result_test_id_seq OWNED BY erp.lims_test_result.test_id;


--
-- Name: party; Type: TABLE; Schema: erp; Owner: postgres
--

CREATE TABLE erp.party (
    party_key bigint NOT NULL,
    party_code character varying(50) NOT NULL,
    name character varying(255) NOT NULL,
    party_type character varying(50) NOT NULL,
    tax_id character varying(100),
    phone character varying(50),
    email character varying(255),
    address_line1 text,
    address_line2 text,
    city character varying(100),
    country character varying(100),
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE erp.party OWNER TO postgres;

--
-- Name: party_party_key_seq; Type: SEQUENCE; Schema: erp; Owner: postgres
--

CREATE SEQUENCE erp.party_party_key_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE erp.party_party_key_seq OWNER TO postgres;

--
-- Name: party_party_key_seq; Type: SEQUENCE OWNED BY; Schema: erp; Owner: postgres
--

ALTER SEQUENCE erp.party_party_key_seq OWNED BY erp.party.party_key;


--
-- Name: payment; Type: TABLE; Schema: erp; Owner: postgres
--

CREATE TABLE erp.payment (
    payment_id bigint NOT NULL,
    company_key bigint NOT NULL,
    party_key bigint NOT NULL,
    payment_date date NOT NULL,
    amount numeric(18,2) NOT NULL,
    payment_method character varying(50),
    reference_no character varying(100),
    remarks text,
    created_by bigint,
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE erp.payment OWNER TO postgres;

--
-- Name: payment_allocation; Type: TABLE; Schema: erp; Owner: postgres
--

CREATE TABLE erp.payment_allocation (
    allocation_id bigint NOT NULL,
    payment_id bigint NOT NULL,
    invoice_id uuid NOT NULL,
    allocated_amount numeric(18,2) NOT NULL
);


ALTER TABLE erp.payment_allocation OWNER TO postgres;

--
-- Name: payment_allocation_allocation_id_seq; Type: SEQUENCE; Schema: erp; Owner: postgres
--

CREATE SEQUENCE erp.payment_allocation_allocation_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE erp.payment_allocation_allocation_id_seq OWNER TO postgres;

--
-- Name: payment_allocation_allocation_id_seq; Type: SEQUENCE OWNED BY; Schema: erp; Owner: postgres
--

ALTER SEQUENCE erp.payment_allocation_allocation_id_seq OWNED BY erp.payment_allocation.allocation_id;


--
-- Name: payment_payment_id_seq; Type: SEQUENCE; Schema: erp; Owner: postgres
--

CREATE SEQUENCE erp.payment_payment_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE erp.payment_payment_id_seq OWNER TO postgres;

--
-- Name: payment_payment_id_seq; Type: SEQUENCE OWNED BY; Schema: erp; Owner: postgres
--

ALTER SEQUENCE erp.payment_payment_id_seq OWNED BY erp.payment.payment_id;


--
-- Name: payroll_component_line; Type: TABLE; Schema: erp; Owner: postgres
--

CREATE TABLE erp.payroll_component_line (
    component_line_id bigint NOT NULL,
    pe_id bigint NOT NULL,
    component_type_id bigint NOT NULL,
    amount numeric(18,2) NOT NULL,
    cost_center_key bigint,
    project_job_id bigint,
    notes text
);


ALTER TABLE erp.payroll_component_line OWNER TO postgres;

--
-- Name: payroll_component_line_component_line_id_seq; Type: SEQUENCE; Schema: erp; Owner: postgres
--

CREATE SEQUENCE erp.payroll_component_line_component_line_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE erp.payroll_component_line_component_line_id_seq OWNER TO postgres;

--
-- Name: payroll_component_line_component_line_id_seq; Type: SEQUENCE OWNED BY; Schema: erp; Owner: postgres
--

ALTER SEQUENCE erp.payroll_component_line_component_line_id_seq OWNED BY erp.payroll_component_line.component_line_id;


--
-- Name: payroll_component_type; Type: TABLE; Schema: erp; Owner: postgres
--

CREATE TABLE erp.payroll_component_type (
    component_type_id bigint NOT NULL,
    code character varying(50) NOT NULL,
    name character varying(200) NOT NULL,
    kind erp.payroll_component_kind NOT NULL,
    account_key bigint,
    taxable boolean DEFAULT true,
    active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    created_by bigint
);


ALTER TABLE erp.payroll_component_type OWNER TO postgres;

--
-- Name: payroll_component_type_component_type_id_seq; Type: SEQUENCE; Schema: erp; Owner: postgres
--

CREATE SEQUENCE erp.payroll_component_type_component_type_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE erp.payroll_component_type_component_type_id_seq OWNER TO postgres;

--
-- Name: payroll_component_type_component_type_id_seq; Type: SEQUENCE OWNED BY; Schema: erp; Owner: postgres
--

ALTER SEQUENCE erp.payroll_component_type_component_type_id_seq OWNED BY erp.payroll_component_type.component_type_id;


--
-- Name: payroll_entry; Type: TABLE; Schema: erp; Owner: postgres
--

CREATE TABLE erp.payroll_entry (
    pe_id bigint NOT NULL,
    payroll_run_id bigint NOT NULL,
    employee_id bigint NOT NULL,
    gross_pay numeric(18,2) NOT NULL,
    deductions numeric(18,2) DEFAULT 0,
    net_pay numeric(18,2) NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE erp.payroll_entry OWNER TO postgres;

--
-- Name: payroll_entry_pe_id_seq; Type: SEQUENCE; Schema: erp; Owner: postgres
--

CREATE SEQUENCE erp.payroll_entry_pe_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE erp.payroll_entry_pe_id_seq OWNER TO postgres;

--
-- Name: payroll_entry_pe_id_seq; Type: SEQUENCE OWNED BY; Schema: erp; Owner: postgres
--

ALTER SEQUENCE erp.payroll_entry_pe_id_seq OWNED BY erp.payroll_entry.pe_id;


--
-- Name: payroll_run; Type: TABLE; Schema: erp; Owner: postgres
--

CREATE TABLE erp.payroll_run (
    payroll_run_id bigint NOT NULL,
    company_key bigint NOT NULL,
    period_start date NOT NULL,
    period_end date NOT NULL,
    pay_date date NOT NULL,
    description text,
    status erp.document_status DEFAULT 'DRAFT'::erp.document_status,
    created_at timestamp with time zone DEFAULT now(),
    created_by bigint
);


ALTER TABLE erp.payroll_run OWNER TO postgres;

--
-- Name: payroll_run_payroll_run_id_seq; Type: SEQUENCE; Schema: erp; Owner: postgres
--

CREATE SEQUENCE erp.payroll_run_payroll_run_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE erp.payroll_run_payroll_run_id_seq OWNER TO postgres;

--
-- Name: payroll_run_payroll_run_id_seq; Type: SEQUENCE OWNED BY; Schema: erp; Owner: postgres
--

ALTER SEQUENCE erp.payroll_run_payroll_run_id_seq OWNED BY erp.payroll_run.payroll_run_id;


--
-- Name: product_costing; Type: TABLE; Schema: erp; Owner: erp_app
--

CREATE TABLE erp.product_costing (
    product_costing_id bigint NOT NULL,
    company_key bigint NOT NULL,
    item_key bigint NOT NULL,
    cost_version text DEFAULT 'STANDARD'::text NOT NULL,
    effective_date date DEFAULT CURRENT_DATE NOT NULL,
    material_cost numeric(18,6) DEFAULT 0 NOT NULL,
    labor_cost numeric(18,6) DEFAULT 0 NOT NULL,
    overhead_cost numeric(18,6) DEFAULT 0 NOT NULL,
    total_cost numeric(18,6) GENERATED ALWAYS AS (((material_cost + labor_cost) + overhead_cost)) STORED,
    notes text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE erp.product_costing OWNER TO erp_app;

--
-- Name: product_costing_product_costing_id_seq; Type: SEQUENCE; Schema: erp; Owner: erp_app
--

CREATE SEQUENCE erp.product_costing_product_costing_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE erp.product_costing_product_costing_id_seq OWNER TO erp_app;

--
-- Name: product_costing_product_costing_id_seq; Type: SEQUENCE OWNED BY; Schema: erp; Owner: erp_app
--

ALTER SEQUENCE erp.product_costing_product_costing_id_seq OWNED BY erp.product_costing.product_costing_id;


--
-- Name: production_batch; Type: TABLE; Schema: erp; Owner: postgres
--

CREATE TABLE erp.production_batch (
    prod_batch_key bigint NOT NULL,
    company_key bigint NOT NULL,
    batch_key bigint NOT NULL,
    bom_key bigint NOT NULL,
    routing_key bigint,
    planned_qty numeric(18,3) NOT NULL,
    actual_qty numeric(18,3),
    start_date date,
    end_date date,
    status erp.document_status DEFAULT 'DRAFT'::erp.document_status,
    created_by bigint,
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE erp.production_batch OWNER TO postgres;

--
-- Name: production_batch_prod_batch_key_seq; Type: SEQUENCE; Schema: erp; Owner: postgres
--

CREATE SEQUENCE erp.production_batch_prod_batch_key_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE erp.production_batch_prod_batch_key_seq OWNER TO postgres;

--
-- Name: production_batch_prod_batch_key_seq; Type: SEQUENCE OWNED BY; Schema: erp; Owner: postgres
--

ALTER SEQUENCE erp.production_batch_prod_batch_key_seq OWNED BY erp.production_batch.prod_batch_key;


--
-- Name: project_billing; Type: TABLE; Schema: erp; Owner: postgres
--

CREATE TABLE erp.project_billing (
    billing_id bigint NOT NULL,
    project_job_id bigint NOT NULL,
    invoice_id uuid,
    billing_date date NOT NULL,
    description text,
    certified_amount numeric(18,2) NOT NULL,
    retention_percent numeric(5,2),
    retention_amount numeric(18,2),
    status character varying(30) DEFAULT 'DRAFT'::character varying,
    created_at timestamp with time zone DEFAULT now(),
    created_by bigint
);


ALTER TABLE erp.project_billing OWNER TO postgres;

--
-- Name: project_billing_billing_id_seq; Type: SEQUENCE; Schema: erp; Owner: postgres
--

CREATE SEQUENCE erp.project_billing_billing_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE erp.project_billing_billing_id_seq OWNER TO postgres;

--
-- Name: project_billing_billing_id_seq; Type: SEQUENCE OWNED BY; Schema: erp; Owner: postgres
--

ALTER SEQUENCE erp.project_billing_billing_id_seq OWNED BY erp.project_billing.billing_id;


--
-- Name: project_job; Type: TABLE; Schema: erp; Owner: postgres
--

CREATE TABLE erp.project_job (
    project_job_id bigint NOT NULL,
    project_code character varying(60) NOT NULL,
    name character varying(255) NOT NULL,
    description text,
    company_key bigint NOT NULL,
    customer_key bigint,
    cost_center_key bigint,
    site_location text,
    start_date date,
    end_date date,
    status erp.project_status DEFAULT 'PLANNED'::erp.project_status,
    contract_value numeric(18,2),
    currency_code character(3),
    created_at timestamp with time zone DEFAULT now(),
    created_by bigint
);


ALTER TABLE erp.project_job OWNER TO postgres;

--
-- Name: project_job_budget; Type: TABLE; Schema: erp; Owner: postgres
--

CREATE TABLE erp.project_job_budget (
    budget_id bigint NOT NULL,
    project_job_id bigint NOT NULL,
    cost_head erp.job_cost_head NOT NULL,
    budget_amount numeric(18,2) NOT NULL,
    notes text,
    created_at timestamp with time zone DEFAULT now(),
    created_by bigint
);


ALTER TABLE erp.project_job_budget OWNER TO postgres;

--
-- Name: project_job_budget_budget_id_seq; Type: SEQUENCE; Schema: erp; Owner: postgres
--

CREATE SEQUENCE erp.project_job_budget_budget_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE erp.project_job_budget_budget_id_seq OWNER TO postgres;

--
-- Name: project_job_budget_budget_id_seq; Type: SEQUENCE OWNED BY; Schema: erp; Owner: postgres
--

ALTER SEQUENCE erp.project_job_budget_budget_id_seq OWNED BY erp.project_job_budget.budget_id;


--
-- Name: project_job_project_job_id_seq; Type: SEQUENCE; Schema: erp; Owner: postgres
--

CREATE SEQUENCE erp.project_job_project_job_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE erp.project_job_project_job_id_seq OWNER TO postgres;

--
-- Name: project_job_project_job_id_seq; Type: SEQUENCE OWNED BY; Schema: erp; Owner: postgres
--

ALTER SEQUENCE erp.project_job_project_job_id_seq OWNED BY erp.project_job.project_job_id;


--
-- Name: project_retention; Type: TABLE; Schema: erp; Owner: postgres
--

CREATE TABLE erp.project_retention (
    retention_id bigint NOT NULL,
    project_job_id bigint NOT NULL,
    source_billing_id bigint,
    original_retention_amount numeric(18,2) NOT NULL,
    releasable_from date,
    released boolean DEFAULT false,
    release_invoice_id uuid,
    released_amount numeric(18,2),
    released_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now(),
    created_by bigint
);


ALTER TABLE erp.project_retention OWNER TO postgres;

--
-- Name: project_retention_retention_id_seq; Type: SEQUENCE; Schema: erp; Owner: postgres
--

CREATE SEQUENCE erp.project_retention_retention_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE erp.project_retention_retention_id_seq OWNER TO postgres;

--
-- Name: project_retention_retention_id_seq; Type: SEQUENCE OWNED BY; Schema: erp; Owner: postgres
--

ALTER SEQUENCE erp.project_retention_retention_id_seq OWNED BY erp.project_retention.retention_id;


--
-- Name: purchase_order; Type: TABLE; Schema: erp; Owner: postgres
--

CREATE TABLE erp.purchase_order (
    po_id bigint NOT NULL,
    company_key bigint NOT NULL,
    po_number character varying(50) NOT NULL,
    supplier_key bigint NOT NULL,
    order_date date NOT NULL,
    expected_date date,
    status erp.document_status DEFAULT 'DRAFT'::erp.document_status,
    currency_code character(3),
    remarks text,
    created_by bigint,
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE erp.purchase_order OWNER TO postgres;

--
-- Name: purchase_order_line; Type: TABLE; Schema: erp; Owner: postgres
--

CREATE TABLE erp.purchase_order_line (
    po_line_id bigint NOT NULL,
    po_id bigint NOT NULL,
    line_no integer NOT NULL,
    item_key bigint NOT NULL,
    description text,
    quantity numeric(18,3) NOT NULL,
    unit_price numeric(18,4) NOT NULL,
    discount_amount numeric(18,2) DEFAULT 0,
    tax_key bigint
);


ALTER TABLE erp.purchase_order_line OWNER TO postgres;

--
-- Name: purchase_order_line_po_line_id_seq; Type: SEQUENCE; Schema: erp; Owner: postgres
--

CREATE SEQUENCE erp.purchase_order_line_po_line_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE erp.purchase_order_line_po_line_id_seq OWNER TO postgres;

--
-- Name: purchase_order_line_po_line_id_seq; Type: SEQUENCE OWNED BY; Schema: erp; Owner: postgres
--

ALTER SEQUENCE erp.purchase_order_line_po_line_id_seq OWNED BY erp.purchase_order_line.po_line_id;


--
-- Name: purchase_order_po_id_seq; Type: SEQUENCE; Schema: erp; Owner: postgres
--

CREATE SEQUENCE erp.purchase_order_po_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE erp.purchase_order_po_id_seq OWNER TO postgres;

--
-- Name: purchase_order_po_id_seq; Type: SEQUENCE OWNED BY; Schema: erp; Owner: postgres
--

ALTER SEQUENCE erp.purchase_order_po_id_seq OWNED BY erp.purchase_order.po_id;


--
-- Name: role_permission; Type: TABLE; Schema: erp; Owner: postgres
--

CREATE TABLE erp.role_permission (
    permission_key bigint NOT NULL,
    role_key bigint NOT NULL,
    module character varying(100) NOT NULL,
    permission jsonb NOT NULL,
    allowed boolean DEFAULT true
);


ALTER TABLE erp.role_permission OWNER TO postgres;

--
-- Name: role_permission_permission_key_seq; Type: SEQUENCE; Schema: erp; Owner: postgres
--

CREATE SEQUENCE erp.role_permission_permission_key_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE erp.role_permission_permission_key_seq OWNER TO postgres;

--
-- Name: role_permission_permission_key_seq; Type: SEQUENCE OWNED BY; Schema: erp; Owner: postgres
--

ALTER SEQUENCE erp.role_permission_permission_key_seq OWNED BY erp.role_permission.permission_key;


--
-- Name: routing; Type: TABLE; Schema: erp; Owner: postgres
--

CREATE TABLE erp.routing (
    routing_key bigint NOT NULL,
    parent_item_key bigint NOT NULL,
    operation_no integer NOT NULL,
    operation_name character varying(200) NOT NULL,
    work_center character varying(100),
    std_setup_time numeric(18,2),
    std_run_time numeric(18,2),
    cost_rate_per_hour numeric(18,4)
);


ALTER TABLE erp.routing OWNER TO postgres;

--
-- Name: routing_routing_key_seq; Type: SEQUENCE; Schema: erp; Owner: postgres
--

CREATE SEQUENCE erp.routing_routing_key_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE erp.routing_routing_key_seq OWNER TO postgres;

--
-- Name: routing_routing_key_seq; Type: SEQUENCE OWNED BY; Schema: erp; Owner: postgres
--

ALTER SEQUENCE erp.routing_routing_key_seq OWNED BY erp.routing.routing_key;


--
-- Name: sales_order; Type: TABLE; Schema: erp; Owner: postgres
--

CREATE TABLE erp.sales_order (
    so_id bigint NOT NULL,
    company_key bigint NOT NULL,
    so_number character varying(50) NOT NULL,
    customer_key bigint NOT NULL,
    order_date date NOT NULL,
    delivery_date date,
    status erp.document_status DEFAULT 'DRAFT'::erp.document_status,
    currency_code character(3),
    remarks text,
    created_by bigint,
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE erp.sales_order OWNER TO postgres;

--
-- Name: sales_order_line; Type: TABLE; Schema: erp; Owner: postgres
--

CREATE TABLE erp.sales_order_line (
    so_line_id bigint NOT NULL,
    so_id bigint NOT NULL,
    line_no integer NOT NULL,
    item_key bigint NOT NULL,
    description text,
    quantity numeric(18,3) NOT NULL,
    unit_price numeric(18,4) NOT NULL,
    discount_amount numeric(18,2) DEFAULT 0,
    tax_key bigint
);


ALTER TABLE erp.sales_order_line OWNER TO postgres;

--
-- Name: sales_order_line_so_line_id_seq; Type: SEQUENCE; Schema: erp; Owner: postgres
--

CREATE SEQUENCE erp.sales_order_line_so_line_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE erp.sales_order_line_so_line_id_seq OWNER TO postgres;

--
-- Name: sales_order_line_so_line_id_seq; Type: SEQUENCE OWNED BY; Schema: erp; Owner: postgres
--

ALTER SEQUENCE erp.sales_order_line_so_line_id_seq OWNED BY erp.sales_order_line.so_line_id;


--
-- Name: sales_order_so_id_seq; Type: SEQUENCE; Schema: erp; Owner: postgres
--

CREATE SEQUENCE erp.sales_order_so_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE erp.sales_order_so_id_seq OWNER TO postgres;

--
-- Name: sales_order_so_id_seq; Type: SEQUENCE OWNED BY; Schema: erp; Owner: postgres
--

ALTER SEQUENCE erp.sales_order_so_id_seq OWNED BY erp.sales_order.so_id;


--
-- Name: tax_transaction; Type: TABLE; Schema: erp; Owner: postgres
--

CREATE TABLE erp.tax_transaction (
    tax_txn_id bigint NOT NULL,
    invoice_id uuid,
    invoice_line_id bigint,
    tax_key bigint NOT NULL,
    company_key bigint,
    tax_base_amount numeric(18,2) NOT NULL,
    tax_amount numeric(18,2) NOT NULL,
    tax_direction character varying(10),
    posting_date date NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT tax_transaction_tax_direction_check CHECK (((tax_direction)::text = ANY ((ARRAY['OUTPUT'::character varying, 'INPUT'::character varying])::text[])))
);


ALTER TABLE erp.tax_transaction OWNER TO postgres;

--
-- Name: tax_transaction_tax_txn_id_seq; Type: SEQUENCE; Schema: erp; Owner: postgres
--

CREATE SEQUENCE erp.tax_transaction_tax_txn_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE erp.tax_transaction_tax_txn_id_seq OWNER TO postgres;

--
-- Name: tax_transaction_tax_txn_id_seq; Type: SEQUENCE OWNED BY; Schema: erp; Owner: postgres
--

ALTER SEQUENCE erp.tax_transaction_tax_txn_id_seq OWNED BY erp.tax_transaction.tax_txn_id;


--
-- Name: user_role; Type: TABLE; Schema: erp; Owner: postgres
--

CREATE TABLE erp.user_role (
    role_key bigint NOT NULL,
    role_name character varying(100) NOT NULL,
    description text
);


ALTER TABLE erp.user_role OWNER TO postgres;

--
-- Name: user_role_role_key_seq; Type: SEQUENCE; Schema: erp; Owner: postgres
--

CREATE SEQUENCE erp.user_role_role_key_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE erp.user_role_role_key_seq OWNER TO postgres;

--
-- Name: user_role_role_key_seq; Type: SEQUENCE OWNED BY; Schema: erp; Owner: postgres
--

ALTER SEQUENCE erp.user_role_role_key_seq OWNED BY erp.user_role.role_key;


--
-- Name: vw_batch_cost_summary; Type: VIEW; Schema: erp; Owner: postgres
--

CREATE VIEW erp.vw_batch_cost_summary AS
 SELECT pb.prod_batch_key,
    b.batch_number,
    sum(
        CASE
            WHEN (bcd.cost_head = 'MATERIAL'::erp.job_cost_head) THEN bcd.amount
            ELSE (0)::numeric
        END) AS material_cost,
    sum(
        CASE
            WHEN (bcd.cost_head = 'LABOR'::erp.job_cost_head) THEN bcd.amount
            ELSE (0)::numeric
        END) AS labor_cost,
    sum(
        CASE
            WHEN (bcd.cost_head = 'EQUIPMENT'::erp.job_cost_head) THEN bcd.amount
            ELSE (0)::numeric
        END) AS equipment_cost,
    sum(
        CASE
            WHEN (bcd.cost_head = 'SUBCONTRACT'::erp.job_cost_head) THEN bcd.amount
            ELSE (0)::numeric
        END) AS subcontract_cost,
    sum(
        CASE
            WHEN (bcd.cost_head = 'OVERHEAD'::erp.job_cost_head) THEN bcd.amount
            ELSE (0)::numeric
        END) AS overhead_cost,
    sum(bcd.amount) AS total_cost
   FROM ((erp.production_batch pb
     LEFT JOIN erp.dim_batch b ON ((pb.batch_key = b.batch_key)))
     LEFT JOIN erp.batch_cost_detail bcd ON ((pb.prod_batch_key = bcd.prod_batch_key)))
  GROUP BY pb.prod_batch_key, b.batch_number;


ALTER VIEW erp.vw_batch_cost_summary OWNER TO postgres;

--
-- Name: vw_project_job_profitability; Type: VIEW; Schema: erp; Owner: postgres
--

CREATE VIEW erp.vw_project_job_profitability AS
 SELECT pj.project_job_id,
    pj.project_code,
    pj.name,
    pj.company_key,
    pj.customer_key,
    cc.cost_center_key,
    COALESCE(rev.revenue, (0)::numeric) AS revenue,
    COALESCE(cost.cost, (0)::numeric) AS cost,
    (COALESCE(rev.revenue, (0)::numeric) - COALESCE(cost.cost, (0)::numeric)) AS profit
   FROM (((erp.project_job pj
     LEFT JOIN erp.dim_cost_center cc ON ((pj.cost_center_key = cc.cost_center_key)))
     LEFT JOIN ( SELECT ca.company_key,
            gll.cost_center_key,
            sum(
                CASE
                    WHEN (ca.account_type = 'REVENUE'::erp.account_type) THEN (gll.credit - gll.debit)
                    ELSE (0)::numeric
                END) AS revenue
           FROM (erp.gl_line gll
             JOIN erp.chart_of_accounts ca ON ((gll.account_key = ca.account_key)))
          GROUP BY ca.company_key, gll.cost_center_key) rev ON (((rev.cost_center_key = cc.cost_center_key) AND (rev.company_key = pj.company_key))))
     LEFT JOIN ( SELECT ca.company_key,
            gll.cost_center_key,
            sum(
                CASE
                    WHEN (ca.account_type = ANY (ARRAY['EXPENSE'::erp.account_type, 'COGS'::erp.account_type])) THEN (gll.debit - gll.credit)
                    ELSE (0)::numeric
                END) AS cost
           FROM (erp.gl_line gll
             JOIN erp.chart_of_accounts ca ON ((gll.account_key = ca.account_key)))
          GROUP BY ca.company_key, gll.cost_center_key) cost ON (((cost.cost_center_key = cc.cost_center_key) AND (cost.company_key = pj.company_key))));


ALTER VIEW erp.vw_project_job_profitability OWNER TO postgres;

--
-- Name: warehouse; Type: TABLE; Schema: erp; Owner: postgres
--

CREATE TABLE erp.warehouse (
    warehouse_key bigint NOT NULL,
    company_key bigint NOT NULL,
    code character varying(50) NOT NULL,
    name character varying(255) NOT NULL,
    address text
);


ALTER TABLE erp.warehouse OWNER TO postgres;

--
-- Name: warehouse_bin; Type: TABLE; Schema: erp; Owner: postgres
--

CREATE TABLE erp.warehouse_bin (
    bin_key bigint NOT NULL,
    warehouse_key bigint NOT NULL,
    bin_code character varying(50) NOT NULL,
    description text
);


ALTER TABLE erp.warehouse_bin OWNER TO postgres;

--
-- Name: warehouse_bin_bin_key_seq; Type: SEQUENCE; Schema: erp; Owner: postgres
--

CREATE SEQUENCE erp.warehouse_bin_bin_key_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE erp.warehouse_bin_bin_key_seq OWNER TO postgres;

--
-- Name: warehouse_bin_bin_key_seq; Type: SEQUENCE OWNED BY; Schema: erp; Owner: postgres
--

ALTER SEQUENCE erp.warehouse_bin_bin_key_seq OWNED BY erp.warehouse_bin.bin_key;


--
-- Name: warehouse_warehouse_key_seq; Type: SEQUENCE; Schema: erp; Owner: postgres
--

CREATE SEQUENCE erp.warehouse_warehouse_key_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE erp.warehouse_warehouse_key_seq OWNER TO postgres;

--
-- Name: warehouse_warehouse_key_seq; Type: SEQUENCE OWNED BY; Schema: erp; Owner: postgres
--

ALTER SEQUENCE erp.warehouse_warehouse_key_seq OWNED BY erp.warehouse.warehouse_key;


--
-- Name: withholding_tax_setup; Type: TABLE; Schema: erp; Owner: postgres
--

CREATE TABLE erp.withholding_tax_setup (
    wht_id bigint NOT NULL,
    code character varying(50) NOT NULL,
    description text,
    rate numeric(8,4) NOT NULL,
    applies_to character varying(20),
    min_amount numeric(18,2),
    account_key bigint,
    active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT withholding_tax_setup_applies_to_check CHECK (((applies_to)::text = ANY ((ARRAY['SUPPLIER'::character varying, 'CUSTOMER'::character varying])::text[])))
);


ALTER TABLE erp.withholding_tax_setup OWNER TO postgres;

--
-- Name: withholding_tax_setup_wht_id_seq; Type: SEQUENCE; Schema: erp; Owner: postgres
--

CREATE SEQUENCE erp.withholding_tax_setup_wht_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE erp.withholding_tax_setup_wht_id_seq OWNER TO postgres;

--
-- Name: withholding_tax_setup_wht_id_seq; Type: SEQUENCE OWNED BY; Schema: erp; Owner: postgres
--

ALTER SEQUENCE erp.withholding_tax_setup_wht_id_seq OWNED BY erp.withholding_tax_setup.wht_id;


--
-- Name: withholding_tax_transaction; Type: TABLE; Schema: erp; Owner: postgres
--

CREATE TABLE erp.withholding_tax_transaction (
    wht_txn_id bigint NOT NULL,
    wht_id bigint NOT NULL,
    invoice_id uuid,
    party_key bigint,
    base_amount numeric(18,2) NOT NULL,
    wht_amount numeric(18,2) NOT NULL,
    posting_date date NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE erp.withholding_tax_transaction OWNER TO postgres;

--
-- Name: withholding_tax_transaction_wht_txn_id_seq; Type: SEQUENCE; Schema: erp; Owner: postgres
--

CREATE SEQUENCE erp.withholding_tax_transaction_wht_txn_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE erp.withholding_tax_transaction_wht_txn_id_seq OWNER TO postgres;

--
-- Name: withholding_tax_transaction_wht_txn_id_seq; Type: SEQUENCE OWNED BY; Schema: erp; Owner: postgres
--

ALTER SEQUENCE erp.withholding_tax_transaction_wht_txn_id_seq OWNED BY erp.withholding_tax_transaction.wht_txn_id;


--
-- Name: workflow_definition; Type: TABLE; Schema: erp; Owner: postgres
--

CREATE TABLE erp.workflow_definition (
    workflow_id bigint NOT NULL,
    name character varying(200) NOT NULL,
    document_type character varying(50) NOT NULL,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    created_by bigint
);


ALTER TABLE erp.workflow_definition OWNER TO postgres;

--
-- Name: workflow_definition_workflow_id_seq; Type: SEQUENCE; Schema: erp; Owner: postgres
--

CREATE SEQUENCE erp.workflow_definition_workflow_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE erp.workflow_definition_workflow_id_seq OWNER TO postgres;

--
-- Name: workflow_definition_workflow_id_seq; Type: SEQUENCE OWNED BY; Schema: erp; Owner: postgres
--

ALTER SEQUENCE erp.workflow_definition_workflow_id_seq OWNED BY erp.workflow_definition.workflow_id;


--
-- Name: workflow_step; Type: TABLE; Schema: erp; Owner: postgres
--

CREATE TABLE erp.workflow_step (
    step_id bigint NOT NULL,
    workflow_id bigint NOT NULL,
    step_order integer NOT NULL,
    role_required character varying(100),
    min_amount numeric(18,2),
    max_amount numeric(18,2),
    description text
);


ALTER TABLE erp.workflow_step OWNER TO postgres;

--
-- Name: workflow_step_step_id_seq; Type: SEQUENCE; Schema: erp; Owner: postgres
--

CREATE SEQUENCE erp.workflow_step_step_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE erp.workflow_step_step_id_seq OWNER TO postgres;

--
-- Name: workflow_step_step_id_seq; Type: SEQUENCE OWNED BY; Schema: erp; Owner: postgres
--

ALTER SEQUENCE erp.workflow_step_step_id_seq OWNED BY erp.workflow_step.step_id;


--
-- Name: app_user user_key; Type: DEFAULT; Schema: erp; Owner: postgres
--

ALTER TABLE ONLY erp.app_user ALTER COLUMN user_key SET DEFAULT nextval('erp.app_user_user_key_seq'::regclass);


--
-- Name: asset_category asset_category_key; Type: DEFAULT; Schema: erp; Owner: postgres
--

ALTER TABLE ONLY erp.asset_category ALTER COLUMN asset_category_key SET DEFAULT nextval('erp.asset_category_asset_category_key_seq'::regclass);


--
-- Name: audit_trail audit_id; Type: DEFAULT; Schema: erp; Owner: postgres
--

ALTER TABLE ONLY erp.audit_trail ALTER COLUMN audit_id SET DEFAULT nextval('erp.audit_trail_audit_id_seq'::regclass);


--
-- Name: batch_cost_detail batch_cost_id; Type: DEFAULT; Schema: erp; Owner: postgres
--

ALTER TABLE ONLY erp.batch_cost_detail ALTER COLUMN batch_cost_id SET DEFAULT nextval('erp.batch_cost_detail_batch_cost_id_seq'::regclass);


--
-- Name: bom bom_key; Type: DEFAULT; Schema: erp; Owner: postgres
--

ALTER TABLE ONLY erp.bom ALTER COLUMN bom_key SET DEFAULT nextval('erp.bom_bom_key_seq'::regclass);


--
-- Name: bom_component bom_component_key; Type: DEFAULT; Schema: erp; Owner: postgres
--

ALTER TABLE ONLY erp.bom_component ALTER COLUMN bom_component_key SET DEFAULT nextval('erp.bom_component_bom_component_key_seq'::regclass);


--
-- Name: chart_of_accounts account_key; Type: DEFAULT; Schema: erp; Owner: postgres
--

ALTER TABLE ONLY erp.chart_of_accounts ALTER COLUMN account_key SET DEFAULT nextval('erp.chart_of_accounts_account_key_seq'::regclass);


--
-- Name: crm_activity activity_id; Type: DEFAULT; Schema: erp; Owner: postgres
--

ALTER TABLE ONLY erp.crm_activity ALTER COLUMN activity_id SET DEFAULT nextval('erp.crm_activity_activity_id_seq'::regclass);


--
-- Name: crm_lead lead_id; Type: DEFAULT; Schema: erp; Owner: postgres
--

ALTER TABLE ONLY erp.crm_lead ALTER COLUMN lead_id SET DEFAULT nextval('erp.crm_lead_lead_id_seq'::regclass);


--
-- Name: delivery_note dn_id; Type: DEFAULT; Schema: erp; Owner: postgres
--

ALTER TABLE ONLY erp.delivery_note ALTER COLUMN dn_id SET DEFAULT nextval('erp.delivery_note_dn_id_seq'::regclass);


--
-- Name: delivery_note_line dn_line_id; Type: DEFAULT; Schema: erp; Owner: postgres
--

ALTER TABLE ONLY erp.delivery_note_line ALTER COLUMN dn_line_id SET DEFAULT nextval('erp.delivery_note_line_dn_line_id_seq'::regclass);


--
-- Name: dim_batch batch_key; Type: DEFAULT; Schema: erp; Owner: postgres
--

ALTER TABLE ONLY erp.dim_batch ALTER COLUMN batch_key SET DEFAULT nextval('erp.dim_batch_batch_key_seq'::regclass);


--
-- Name: dim_company company_key; Type: DEFAULT; Schema: erp; Owner: postgres
--

ALTER TABLE ONLY erp.dim_company ALTER COLUMN company_key SET DEFAULT nextval('erp.dim_company_company_key_seq'::regclass);


--
-- Name: dim_cost_center cost_center_key; Type: DEFAULT; Schema: erp; Owner: postgres
--

ALTER TABLE ONLY erp.dim_cost_center ALTER COLUMN cost_center_key SET DEFAULT nextval('erp.dim_cost_center_cost_center_key_seq'::regclass);


--
-- Name: dim_item item_key; Type: DEFAULT; Schema: erp; Owner: postgres
--

ALTER TABLE ONLY erp.dim_item ALTER COLUMN item_key SET DEFAULT nextval('erp.dim_item_item_key_seq'::regclass);


--
-- Name: dim_tax_code tax_key; Type: DEFAULT; Schema: erp; Owner: postgres
--

ALTER TABLE ONLY erp.dim_tax_code ALTER COLUMN tax_key SET DEFAULT nextval('erp.dim_tax_code_tax_key_seq'::regclass);


--
-- Name: document_approval_history approval_id; Type: DEFAULT; Schema: erp; Owner: postgres
--

ALTER TABLE ONLY erp.document_approval_history ALTER COLUMN approval_id SET DEFAULT nextval('erp.document_approval_history_approval_id_seq'::regclass);


--
-- Name: document_workflow_instance instance_id; Type: DEFAULT; Schema: erp; Owner: postgres
--

ALTER TABLE ONLY erp.document_workflow_instance ALTER COLUMN instance_id SET DEFAULT nextval('erp.document_workflow_instance_instance_id_seq'::regclass);


--
-- Name: employee employee_id; Type: DEFAULT; Schema: erp; Owner: postgres
--

ALTER TABLE ONLY erp.employee ALTER COLUMN employee_id SET DEFAULT nextval('erp.employee_employee_id_seq'::regclass);


--
-- Name: fiscal_period period_key; Type: DEFAULT; Schema: erp; Owner: postgres
--

ALTER TABLE ONLY erp.fiscal_period ALTER COLUMN period_key SET DEFAULT nextval('erp.fiscal_period_period_key_seq'::regclass);


--
-- Name: fixed_asset fixed_asset_key; Type: DEFAULT; Schema: erp; Owner: postgres
--

ALTER TABLE ONLY erp.fixed_asset ALTER COLUMN fixed_asset_key SET DEFAULT nextval('erp.fixed_asset_fixed_asset_key_seq'::regclass);


--
-- Name: fixed_asset_depreciation_line dep_line_id; Type: DEFAULT; Schema: erp; Owner: postgres
--

ALTER TABLE ONLY erp.fixed_asset_depreciation_line ALTER COLUMN dep_line_id SET DEFAULT nextval('erp.fixed_asset_depreciation_line_dep_line_id_seq'::regclass);


--
-- Name: fixed_asset_depreciation_run dep_run_id; Type: DEFAULT; Schema: erp; Owner: postgres
--

ALTER TABLE ONLY erp.fixed_asset_depreciation_run ALTER COLUMN dep_run_id SET DEFAULT nextval('erp.fixed_asset_depreciation_run_dep_run_id_seq'::regclass);


--
-- Name: gl_journal gl_id; Type: DEFAULT; Schema: erp; Owner: postgres
--

ALTER TABLE ONLY erp.gl_journal ALTER COLUMN gl_id SET DEFAULT nextval('erp.gl_journal_gl_id_seq'::regclass);


--
-- Name: gl_line gl_line_id; Type: DEFAULT; Schema: erp; Owner: postgres
--

ALTER TABLE ONLY erp.gl_line ALTER COLUMN gl_line_id SET DEFAULT nextval('erp.gl_line_gl_line_id_seq'::regclass);


--
-- Name: inventory_balance balance_id; Type: DEFAULT; Schema: erp; Owner: postgres
--

ALTER TABLE ONLY erp.inventory_balance ALTER COLUMN balance_id SET DEFAULT nextval('erp.inventory_balance_balance_id_seq'::regclass);


--
-- Name: inventory_transaction inv_txn_id; Type: DEFAULT; Schema: erp; Owner: postgres
--

ALTER TABLE ONLY erp.inventory_transaction ALTER COLUMN inv_txn_id SET DEFAULT nextval('erp.inventory_transaction_inv_txn_id_seq'::regclass);


--
-- Name: invoice_line line_id; Type: DEFAULT; Schema: erp; Owner: postgres
--

ALTER TABLE ONLY erp.invoice_line ALTER COLUMN line_id SET DEFAULT nextval('erp.invoice_line_line_id_seq'::regclass);


--
-- Name: lims_test_result test_id; Type: DEFAULT; Schema: erp; Owner: postgres
--

ALTER TABLE ONLY erp.lims_test_result ALTER COLUMN test_id SET DEFAULT nextval('erp.lims_test_result_test_id_seq'::regclass);


--
-- Name: party party_key; Type: DEFAULT; Schema: erp; Owner: postgres
--

ALTER TABLE ONLY erp.party ALTER COLUMN party_key SET DEFAULT nextval('erp.party_party_key_seq'::regclass);


--
-- Name: payment payment_id; Type: DEFAULT; Schema: erp; Owner: postgres
--

ALTER TABLE ONLY erp.payment ALTER COLUMN payment_id SET DEFAULT nextval('erp.payment_payment_id_seq'::regclass);


--
-- Name: payment_allocation allocation_id; Type: DEFAULT; Schema: erp; Owner: postgres
--

ALTER TABLE ONLY erp.payment_allocation ALTER COLUMN allocation_id SET DEFAULT nextval('erp.payment_allocation_allocation_id_seq'::regclass);


--
-- Name: payroll_component_line component_line_id; Type: DEFAULT; Schema: erp; Owner: postgres
--

ALTER TABLE ONLY erp.payroll_component_line ALTER COLUMN component_line_id SET DEFAULT nextval('erp.payroll_component_line_component_line_id_seq'::regclass);


--
-- Name: payroll_component_type component_type_id; Type: DEFAULT; Schema: erp; Owner: postgres
--

ALTER TABLE ONLY erp.payroll_component_type ALTER COLUMN component_type_id SET DEFAULT nextval('erp.payroll_component_type_component_type_id_seq'::regclass);


--
-- Name: payroll_entry pe_id; Type: DEFAULT; Schema: erp; Owner: postgres
--

ALTER TABLE ONLY erp.payroll_entry ALTER COLUMN pe_id SET DEFAULT nextval('erp.payroll_entry_pe_id_seq'::regclass);


--
-- Name: payroll_run payroll_run_id; Type: DEFAULT; Schema: erp; Owner: postgres
--

ALTER TABLE ONLY erp.payroll_run ALTER COLUMN payroll_run_id SET DEFAULT nextval('erp.payroll_run_payroll_run_id_seq'::regclass);


--
-- Name: product_costing product_costing_id; Type: DEFAULT; Schema: erp; Owner: erp_app
--

ALTER TABLE ONLY erp.product_costing ALTER COLUMN product_costing_id SET DEFAULT nextval('erp.product_costing_product_costing_id_seq'::regclass);


--
-- Name: production_batch prod_batch_key; Type: DEFAULT; Schema: erp; Owner: postgres
--

ALTER TABLE ONLY erp.production_batch ALTER COLUMN prod_batch_key SET DEFAULT nextval('erp.production_batch_prod_batch_key_seq'::regclass);


--
-- Name: project_billing billing_id; Type: DEFAULT; Schema: erp; Owner: postgres
--

ALTER TABLE ONLY erp.project_billing ALTER COLUMN billing_id SET DEFAULT nextval('erp.project_billing_billing_id_seq'::regclass);


--
-- Name: project_job project_job_id; Type: DEFAULT; Schema: erp; Owner: postgres
--

ALTER TABLE ONLY erp.project_job ALTER COLUMN project_job_id SET DEFAULT nextval('erp.project_job_project_job_id_seq'::regclass);


--
-- Name: project_job_budget budget_id; Type: DEFAULT; Schema: erp; Owner: postgres
--

ALTER TABLE ONLY erp.project_job_budget ALTER COLUMN budget_id SET DEFAULT nextval('erp.project_job_budget_budget_id_seq'::regclass);


--
-- Name: project_retention retention_id; Type: DEFAULT; Schema: erp; Owner: postgres
--

ALTER TABLE ONLY erp.project_retention ALTER COLUMN retention_id SET DEFAULT nextval('erp.project_retention_retention_id_seq'::regclass);


--
-- Name: purchase_order po_id; Type: DEFAULT; Schema: erp; Owner: postgres
--

ALTER TABLE ONLY erp.purchase_order ALTER COLUMN po_id SET DEFAULT nextval('erp.purchase_order_po_id_seq'::regclass);


--
-- Name: purchase_order_line po_line_id; Type: DEFAULT; Schema: erp; Owner: postgres
--

ALTER TABLE ONLY erp.purchase_order_line ALTER COLUMN po_line_id SET DEFAULT nextval('erp.purchase_order_line_po_line_id_seq'::regclass);


--
-- Name: role_permission permission_key; Type: DEFAULT; Schema: erp; Owner: postgres
--

ALTER TABLE ONLY erp.role_permission ALTER COLUMN permission_key SET DEFAULT nextval('erp.role_permission_permission_key_seq'::regclass);


--
-- Name: routing routing_key; Type: DEFAULT; Schema: erp; Owner: postgres
--

ALTER TABLE ONLY erp.routing ALTER COLUMN routing_key SET DEFAULT nextval('erp.routing_routing_key_seq'::regclass);


--
-- Name: sales_order so_id; Type: DEFAULT; Schema: erp; Owner: postgres
--

ALTER TABLE ONLY erp.sales_order ALTER COLUMN so_id SET DEFAULT nextval('erp.sales_order_so_id_seq'::regclass);


--
-- Name: sales_order_line so_line_id; Type: DEFAULT; Schema: erp; Owner: postgres
--

ALTER TABLE ONLY erp.sales_order_line ALTER COLUMN so_line_id SET DEFAULT nextval('erp.sales_order_line_so_line_id_seq'::regclass);


--
-- Name: tax_transaction tax_txn_id; Type: DEFAULT; Schema: erp; Owner: postgres
--

ALTER TABLE ONLY erp.tax_transaction ALTER COLUMN tax_txn_id SET DEFAULT nextval('erp.tax_transaction_tax_txn_id_seq'::regclass);


--
-- Name: user_role role_key; Type: DEFAULT; Schema: erp; Owner: postgres
--

ALTER TABLE ONLY erp.user_role ALTER COLUMN role_key SET DEFAULT nextval('erp.user_role_role_key_seq'::regclass);


--
-- Name: warehouse warehouse_key; Type: DEFAULT; Schema: erp; Owner: postgres
--

ALTER TABLE ONLY erp.warehouse ALTER COLUMN warehouse_key SET DEFAULT nextval('erp.warehouse_warehouse_key_seq'::regclass);


--
-- Name: warehouse_bin bin_key; Type: DEFAULT; Schema: erp; Owner: postgres
--

ALTER TABLE ONLY erp.warehouse_bin ALTER COLUMN bin_key SET DEFAULT nextval('erp.warehouse_bin_bin_key_seq'::regclass);


--
-- Name: withholding_tax_setup wht_id; Type: DEFAULT; Schema: erp; Owner: postgres
--

ALTER TABLE ONLY erp.withholding_tax_setup ALTER COLUMN wht_id SET DEFAULT nextval('erp.withholding_tax_setup_wht_id_seq'::regclass);


--
-- Name: withholding_tax_transaction wht_txn_id; Type: DEFAULT; Schema: erp; Owner: postgres
--

ALTER TABLE ONLY erp.withholding_tax_transaction ALTER COLUMN wht_txn_id SET DEFAULT nextval('erp.withholding_tax_transaction_wht_txn_id_seq'::regclass);


--
-- Name: workflow_definition workflow_id; Type: DEFAULT; Schema: erp; Owner: postgres
--

ALTER TABLE ONLY erp.workflow_definition ALTER COLUMN workflow_id SET DEFAULT nextval('erp.workflow_definition_workflow_id_seq'::regclass);


--
-- Name: workflow_step step_id; Type: DEFAULT; Schema: erp; Owner: postgres
--

ALTER TABLE ONLY erp.workflow_step ALTER COLUMN step_id SET DEFAULT nextval('erp.workflow_step_step_id_seq'::regclass);


--
-- Name: app_user app_user_email_key; Type: CONSTRAINT; Schema: erp; Owner: postgres
--

ALTER TABLE ONLY erp.app_user
    ADD CONSTRAINT app_user_email_key UNIQUE (email);


--
-- Name: app_user app_user_pkey; Type: CONSTRAINT; Schema: erp; Owner: postgres
--

ALTER TABLE ONLY erp.app_user
    ADD CONSTRAINT app_user_pkey PRIMARY KEY (user_key);


--
-- Name: app_user_role app_user_role_pkey; Type: CONSTRAINT; Schema: erp; Owner: postgres
--

ALTER TABLE ONLY erp.app_user_role
    ADD CONSTRAINT app_user_role_pkey PRIMARY KEY (user_key, role_key);


--
-- Name: app_user app_user_username_key; Type: CONSTRAINT; Schema: erp; Owner: postgres
--

ALTER TABLE ONLY erp.app_user
    ADD CONSTRAINT app_user_username_key UNIQUE (username);


--
-- Name: asset_category asset_category_category_code_key; Type: CONSTRAINT; Schema: erp; Owner: postgres
--

ALTER TABLE ONLY erp.asset_category
    ADD CONSTRAINT asset_category_category_code_key UNIQUE (category_code);


--
-- Name: asset_category asset_category_pkey; Type: CONSTRAINT; Schema: erp; Owner: postgres
--

ALTER TABLE ONLY erp.asset_category
    ADD CONSTRAINT asset_category_pkey PRIMARY KEY (asset_category_key);


--
-- Name: audit_trail audit_trail_pkey; Type: CONSTRAINT; Schema: erp; Owner: postgres
--

ALTER TABLE ONLY erp.audit_trail
    ADD CONSTRAINT audit_trail_pkey PRIMARY KEY (audit_id);


--
-- Name: auth_group auth_group_name_key; Type: CONSTRAINT; Schema: erp; Owner: erp_app
--

ALTER TABLE ONLY erp.auth_group
    ADD CONSTRAINT auth_group_name_key UNIQUE (name);


--
-- Name: auth_group_permissions auth_group_permissions_group_id_permission_id_0cd325b0_uniq; Type: CONSTRAINT; Schema: erp; Owner: erp_app
--

ALTER TABLE ONLY erp.auth_group_permissions
    ADD CONSTRAINT auth_group_permissions_group_id_permission_id_0cd325b0_uniq UNIQUE (group_id, permission_id);


--
-- Name: auth_group_permissions auth_group_permissions_pkey; Type: CONSTRAINT; Schema: erp; Owner: erp_app
--

ALTER TABLE ONLY erp.auth_group_permissions
    ADD CONSTRAINT auth_group_permissions_pkey PRIMARY KEY (id);


--
-- Name: auth_group auth_group_pkey; Type: CONSTRAINT; Schema: erp; Owner: erp_app
--

ALTER TABLE ONLY erp.auth_group
    ADD CONSTRAINT auth_group_pkey PRIMARY KEY (id);


--
-- Name: auth_permission auth_permission_content_type_id_codename_01ab375a_uniq; Type: CONSTRAINT; Schema: erp; Owner: erp_app
--

ALTER TABLE ONLY erp.auth_permission
    ADD CONSTRAINT auth_permission_content_type_id_codename_01ab375a_uniq UNIQUE (content_type_id, codename);


--
-- Name: auth_permission auth_permission_pkey; Type: CONSTRAINT; Schema: erp; Owner: erp_app
--

ALTER TABLE ONLY erp.auth_permission
    ADD CONSTRAINT auth_permission_pkey PRIMARY KEY (id);


--
-- Name: auth_user_groups auth_user_groups_pkey; Type: CONSTRAINT; Schema: erp; Owner: erp_app
--

ALTER TABLE ONLY erp.auth_user_groups
    ADD CONSTRAINT auth_user_groups_pkey PRIMARY KEY (id);


--
-- Name: auth_user_groups auth_user_groups_user_id_group_id_94350c0c_uniq; Type: CONSTRAINT; Schema: erp; Owner: erp_app
--

ALTER TABLE ONLY erp.auth_user_groups
    ADD CONSTRAINT auth_user_groups_user_id_group_id_94350c0c_uniq UNIQUE (user_id, group_id);


--
-- Name: auth_user auth_user_pkey; Type: CONSTRAINT; Schema: erp; Owner: erp_app
--

ALTER TABLE ONLY erp.auth_user
    ADD CONSTRAINT auth_user_pkey PRIMARY KEY (id);


--
-- Name: auth_user_user_permissions auth_user_user_permissions_pkey; Type: CONSTRAINT; Schema: erp; Owner: erp_app
--

ALTER TABLE ONLY erp.auth_user_user_permissions
    ADD CONSTRAINT auth_user_user_permissions_pkey PRIMARY KEY (id);


--
-- Name: auth_user_user_permissions auth_user_user_permissions_user_id_permission_id_14a6b632_uniq; Type: CONSTRAINT; Schema: erp; Owner: erp_app
--

ALTER TABLE ONLY erp.auth_user_user_permissions
    ADD CONSTRAINT auth_user_user_permissions_user_id_permission_id_14a6b632_uniq UNIQUE (user_id, permission_id);


--
-- Name: auth_user auth_user_username_key; Type: CONSTRAINT; Schema: erp; Owner: erp_app
--

ALTER TABLE ONLY erp.auth_user
    ADD CONSTRAINT auth_user_username_key UNIQUE (username);


--
-- Name: batch_cost_detail batch_cost_detail_pkey; Type: CONSTRAINT; Schema: erp; Owner: postgres
--

ALTER TABLE ONLY erp.batch_cost_detail
    ADD CONSTRAINT batch_cost_detail_pkey PRIMARY KEY (batch_cost_id);


--
-- Name: bom_component bom_component_pkey; Type: CONSTRAINT; Schema: erp; Owner: postgres
--

ALTER TABLE ONLY erp.bom_component
    ADD CONSTRAINT bom_component_pkey PRIMARY KEY (bom_component_key);


--
-- Name: bom bom_parent_item_key_bom_code_key; Type: CONSTRAINT; Schema: erp; Owner: postgres
--

ALTER TABLE ONLY erp.bom
    ADD CONSTRAINT bom_parent_item_key_bom_code_key UNIQUE (parent_item_key, bom_code);


--
-- Name: bom bom_pkey; Type: CONSTRAINT; Schema: erp; Owner: postgres
--

ALTER TABLE ONLY erp.bom
    ADD CONSTRAINT bom_pkey PRIMARY KEY (bom_key);


--
-- Name: chart_of_accounts chart_of_accounts_company_key_account_code_key; Type: CONSTRAINT; Schema: erp; Owner: postgres
--

ALTER TABLE ONLY erp.chart_of_accounts
    ADD CONSTRAINT chart_of_accounts_company_key_account_code_key UNIQUE (company_key, account_code);


--
-- Name: chart_of_accounts chart_of_accounts_pkey; Type: CONSTRAINT; Schema: erp; Owner: postgres
--

ALTER TABLE ONLY erp.chart_of_accounts
    ADD CONSTRAINT chart_of_accounts_pkey PRIMARY KEY (account_key);


--
-- Name: crm_activity crm_activity_pkey; Type: CONSTRAINT; Schema: erp; Owner: postgres
--

ALTER TABLE ONLY erp.crm_activity
    ADD CONSTRAINT crm_activity_pkey PRIMARY KEY (activity_id);


--
-- Name: crm_lead crm_lead_lead_code_key; Type: CONSTRAINT; Schema: erp; Owner: postgres
--

ALTER TABLE ONLY erp.crm_lead
    ADD CONSTRAINT crm_lead_lead_code_key UNIQUE (lead_code);


--
-- Name: crm_lead crm_lead_pkey; Type: CONSTRAINT; Schema: erp; Owner: postgres
--

ALTER TABLE ONLY erp.crm_lead
    ADD CONSTRAINT crm_lead_pkey PRIMARY KEY (lead_id);


--
-- Name: delivery_note delivery_note_company_dn_number_unique; Type: CONSTRAINT; Schema: erp; Owner: postgres
--

ALTER TABLE ONLY erp.delivery_note
    ADD CONSTRAINT delivery_note_company_dn_number_unique UNIQUE (company_key, dn_number);


--
-- Name: delivery_note_line delivery_note_line_dn_line_no_unique; Type: CONSTRAINT; Schema: erp; Owner: postgres
--

ALTER TABLE ONLY erp.delivery_note_line
    ADD CONSTRAINT delivery_note_line_dn_line_no_unique UNIQUE (dn_id, line_no);


--
-- Name: delivery_note_line delivery_note_line_pkey; Type: CONSTRAINT; Schema: erp; Owner: postgres
--

ALTER TABLE ONLY erp.delivery_note_line
    ADD CONSTRAINT delivery_note_line_pkey PRIMARY KEY (dn_line_id);


--
-- Name: delivery_note delivery_note_pkey; Type: CONSTRAINT; Schema: erp; Owner: postgres
--

ALTER TABLE ONLY erp.delivery_note
    ADD CONSTRAINT delivery_note_pkey PRIMARY KEY (dn_id);


--
-- Name: dim_batch dim_batch_item_key_batch_number_key; Type: CONSTRAINT; Schema: erp; Owner: postgres
--

ALTER TABLE ONLY erp.dim_batch
    ADD CONSTRAINT dim_batch_item_key_batch_number_key UNIQUE (item_key, batch_number);


--
-- Name: dim_batch dim_batch_pkey; Type: CONSTRAINT; Schema: erp; Owner: postgres
--

ALTER TABLE ONLY erp.dim_batch
    ADD CONSTRAINT dim_batch_pkey PRIMARY KEY (batch_key);


--
-- Name: dim_company dim_company_company_code_key; Type: CONSTRAINT; Schema: erp; Owner: postgres
--

ALTER TABLE ONLY erp.dim_company
    ADD CONSTRAINT dim_company_company_code_key UNIQUE (company_code);


--
-- Name: dim_company dim_company_pkey; Type: CONSTRAINT; Schema: erp; Owner: postgres
--

ALTER TABLE ONLY erp.dim_company
    ADD CONSTRAINT dim_company_pkey PRIMARY KEY (company_key);


--
-- Name: dim_cost_center dim_cost_center_company_key_code_key; Type: CONSTRAINT; Schema: erp; Owner: postgres
--

ALTER TABLE ONLY erp.dim_cost_center
    ADD CONSTRAINT dim_cost_center_company_key_code_key UNIQUE (company_key, code);


--
-- Name: dim_cost_center dim_cost_center_pkey; Type: CONSTRAINT; Schema: erp; Owner: postgres
--

ALTER TABLE ONLY erp.dim_cost_center
    ADD CONSTRAINT dim_cost_center_pkey PRIMARY KEY (cost_center_key);


--
-- Name: dim_currency dim_currency_pkey; Type: CONSTRAINT; Schema: erp; Owner: postgres
--

ALTER TABLE ONLY erp.dim_currency
    ADD CONSTRAINT dim_currency_pkey PRIMARY KEY (currency_code);


--
-- Name: dim_item dim_item_item_code_key; Type: CONSTRAINT; Schema: erp; Owner: postgres
--

ALTER TABLE ONLY erp.dim_item
    ADD CONSTRAINT dim_item_item_code_key UNIQUE (item_code);


--
-- Name: dim_item dim_item_pkey; Type: CONSTRAINT; Schema: erp; Owner: postgres
--

ALTER TABLE ONLY erp.dim_item
    ADD CONSTRAINT dim_item_pkey PRIMARY KEY (item_key);


--
-- Name: dim_tax_code dim_tax_code_pkey; Type: CONSTRAINT; Schema: erp; Owner: postgres
--

ALTER TABLE ONLY erp.dim_tax_code
    ADD CONSTRAINT dim_tax_code_pkey PRIMARY KEY (tax_key);


--
-- Name: dim_tax_code dim_tax_code_tax_code_key; Type: CONSTRAINT; Schema: erp; Owner: postgres
--

ALTER TABLE ONLY erp.dim_tax_code
    ADD CONSTRAINT dim_tax_code_tax_code_key UNIQUE (tax_code);


--
-- Name: django_admin_log django_admin_log_pkey; Type: CONSTRAINT; Schema: erp; Owner: erp_app
--

ALTER TABLE ONLY erp.django_admin_log
    ADD CONSTRAINT django_admin_log_pkey PRIMARY KEY (id);


--
-- Name: django_content_type django_content_type_app_label_model_76bd3d3b_uniq; Type: CONSTRAINT; Schema: erp; Owner: erp_app
--

ALTER TABLE ONLY erp.django_content_type
    ADD CONSTRAINT django_content_type_app_label_model_76bd3d3b_uniq UNIQUE (app_label, model);


--
-- Name: django_content_type django_content_type_pkey; Type: CONSTRAINT; Schema: erp; Owner: erp_app
--

ALTER TABLE ONLY erp.django_content_type
    ADD CONSTRAINT django_content_type_pkey PRIMARY KEY (id);


--
-- Name: django_migrations django_migrations_pkey; Type: CONSTRAINT; Schema: erp; Owner: erp_app
--

ALTER TABLE ONLY erp.django_migrations
    ADD CONSTRAINT django_migrations_pkey PRIMARY KEY (id);


--
-- Name: django_session django_session_pkey; Type: CONSTRAINT; Schema: erp; Owner: erp_app
--

ALTER TABLE ONLY erp.django_session
    ADD CONSTRAINT django_session_pkey PRIMARY KEY (session_key);


--
-- Name: document_approval_history document_approval_history_pkey; Type: CONSTRAINT; Schema: erp; Owner: postgres
--

ALTER TABLE ONLY erp.document_approval_history
    ADD CONSTRAINT document_approval_history_pkey PRIMARY KEY (approval_id);


--
-- Name: document_workflow_instance document_workflow_instance_pkey; Type: CONSTRAINT; Schema: erp; Owner: postgres
--

ALTER TABLE ONLY erp.document_workflow_instance
    ADD CONSTRAINT document_workflow_instance_pkey PRIMARY KEY (instance_id);


--
-- Name: employee employee_employee_code_key; Type: CONSTRAINT; Schema: erp; Owner: postgres
--

ALTER TABLE ONLY erp.employee
    ADD CONSTRAINT employee_employee_code_key UNIQUE (employee_code);


--
-- Name: employee employee_party_key_key; Type: CONSTRAINT; Schema: erp; Owner: postgres
--

ALTER TABLE ONLY erp.employee
    ADD CONSTRAINT employee_party_key_key UNIQUE (party_key);


--
-- Name: employee employee_pkey; Type: CONSTRAINT; Schema: erp; Owner: postgres
--

ALTER TABLE ONLY erp.employee
    ADD CONSTRAINT employee_pkey PRIMARY KEY (employee_id);


--
-- Name: fiscal_period fiscal_period_company_key_period_code_key; Type: CONSTRAINT; Schema: erp; Owner: postgres
--

ALTER TABLE ONLY erp.fiscal_period
    ADD CONSTRAINT fiscal_period_company_key_period_code_key UNIQUE (company_key, period_code);


--
-- Name: fiscal_period fiscal_period_pkey; Type: CONSTRAINT; Schema: erp; Owner: postgres
--

ALTER TABLE ONLY erp.fiscal_period
    ADD CONSTRAINT fiscal_period_pkey PRIMARY KEY (period_key);


--
-- Name: fixed_asset fixed_asset_asset_code_key; Type: CONSTRAINT; Schema: erp; Owner: postgres
--

ALTER TABLE ONLY erp.fixed_asset
    ADD CONSTRAINT fixed_asset_asset_code_key UNIQUE (asset_code);


--
-- Name: fixed_asset_depreciation_line fixed_asset_depreciation_line_pkey; Type: CONSTRAINT; Schema: erp; Owner: postgres
--

ALTER TABLE ONLY erp.fixed_asset_depreciation_line
    ADD CONSTRAINT fixed_asset_depreciation_line_pkey PRIMARY KEY (dep_line_id);


--
-- Name: fixed_asset_depreciation_run fixed_asset_depreciation_run_pkey; Type: CONSTRAINT; Schema: erp; Owner: postgres
--

ALTER TABLE ONLY erp.fixed_asset_depreciation_run
    ADD CONSTRAINT fixed_asset_depreciation_run_pkey PRIMARY KEY (dep_run_id);


--
-- Name: fixed_asset fixed_asset_pkey; Type: CONSTRAINT; Schema: erp; Owner: postgres
--

ALTER TABLE ONLY erp.fixed_asset
    ADD CONSTRAINT fixed_asset_pkey PRIMARY KEY (fixed_asset_key);


--
-- Name: gl_journal gl_journal_company_key_journal_number_key; Type: CONSTRAINT; Schema: erp; Owner: postgres
--

ALTER TABLE ONLY erp.gl_journal
    ADD CONSTRAINT gl_journal_company_key_journal_number_key UNIQUE (company_key, journal_number);


--
-- Name: gl_journal gl_journal_pkey; Type: CONSTRAINT; Schema: erp; Owner: postgres
--

ALTER TABLE ONLY erp.gl_journal
    ADD CONSTRAINT gl_journal_pkey PRIMARY KEY (gl_id);


--
-- Name: gl_line gl_line_gl_id_line_no_key; Type: CONSTRAINT; Schema: erp; Owner: postgres
--

ALTER TABLE ONLY erp.gl_line
    ADD CONSTRAINT gl_line_gl_id_line_no_key UNIQUE (gl_id, line_no);


--
-- Name: gl_line gl_line_pkey; Type: CONSTRAINT; Schema: erp; Owner: postgres
--

ALTER TABLE ONLY erp.gl_line
    ADD CONSTRAINT gl_line_pkey PRIMARY KEY (gl_line_id);


--
-- Name: inventory_balance inventory_balance_pkey; Type: CONSTRAINT; Schema: erp; Owner: postgres
--

ALTER TABLE ONLY erp.inventory_balance
    ADD CONSTRAINT inventory_balance_pkey PRIMARY KEY (balance_id);


--
-- Name: inventory_transaction inventory_transaction_pkey; Type: CONSTRAINT; Schema: erp; Owner: postgres
--

ALTER TABLE ONLY erp.inventory_transaction
    ADD CONSTRAINT inventory_transaction_pkey PRIMARY KEY (inv_txn_id);


--
-- Name: invoice invoice_company_key_invoice_number_invoice_type_key; Type: CONSTRAINT; Schema: erp; Owner: postgres
--

ALTER TABLE ONLY erp.invoice
    ADD CONSTRAINT invoice_company_key_invoice_number_invoice_type_key UNIQUE (company_key, invoice_number, invoice_type);


--
-- Name: invoice_line invoice_line_invoice_id_line_no_key; Type: CONSTRAINT; Schema: erp; Owner: postgres
--

ALTER TABLE ONLY erp.invoice_line
    ADD CONSTRAINT invoice_line_invoice_id_line_no_key UNIQUE (invoice_id, line_no);


--
-- Name: invoice_line invoice_line_pkey; Type: CONSTRAINT; Schema: erp; Owner: postgres
--

ALTER TABLE ONLY erp.invoice_line
    ADD CONSTRAINT invoice_line_pkey PRIMARY KEY (line_id);


--
-- Name: invoice invoice_pkey; Type: CONSTRAINT; Schema: erp; Owner: postgres
--

ALTER TABLE ONLY erp.invoice
    ADD CONSTRAINT invoice_pkey PRIMARY KEY (invoice_id);


--
-- Name: lims_test_result lims_test_result_pkey; Type: CONSTRAINT; Schema: erp; Owner: postgres
--

ALTER TABLE ONLY erp.lims_test_result
    ADD CONSTRAINT lims_test_result_pkey PRIMARY KEY (test_id);


--
-- Name: party party_party_code_key; Type: CONSTRAINT; Schema: erp; Owner: postgres
--

ALTER TABLE ONLY erp.party
    ADD CONSTRAINT party_party_code_key UNIQUE (party_code);


--
-- Name: party party_pkey; Type: CONSTRAINT; Schema: erp; Owner: postgres
--

ALTER TABLE ONLY erp.party
    ADD CONSTRAINT party_pkey PRIMARY KEY (party_key);


--
-- Name: payment_allocation payment_allocation_pkey; Type: CONSTRAINT; Schema: erp; Owner: postgres
--

ALTER TABLE ONLY erp.payment_allocation
    ADD CONSTRAINT payment_allocation_pkey PRIMARY KEY (allocation_id);


--
-- Name: payment payment_pkey; Type: CONSTRAINT; Schema: erp; Owner: postgres
--

ALTER TABLE ONLY erp.payment
    ADD CONSTRAINT payment_pkey PRIMARY KEY (payment_id);


--
-- Name: payroll_component_line payroll_component_line_pkey; Type: CONSTRAINT; Schema: erp; Owner: postgres
--

ALTER TABLE ONLY erp.payroll_component_line
    ADD CONSTRAINT payroll_component_line_pkey PRIMARY KEY (component_line_id);


--
-- Name: payroll_component_type payroll_component_type_code_key; Type: CONSTRAINT; Schema: erp; Owner: postgres
--

ALTER TABLE ONLY erp.payroll_component_type
    ADD CONSTRAINT payroll_component_type_code_key UNIQUE (code);


--
-- Name: payroll_component_type payroll_component_type_pkey; Type: CONSTRAINT; Schema: erp; Owner: postgres
--

ALTER TABLE ONLY erp.payroll_component_type
    ADD CONSTRAINT payroll_component_type_pkey PRIMARY KEY (component_type_id);


--
-- Name: payroll_entry payroll_entry_pkey; Type: CONSTRAINT; Schema: erp; Owner: postgres
--

ALTER TABLE ONLY erp.payroll_entry
    ADD CONSTRAINT payroll_entry_pkey PRIMARY KEY (pe_id);


--
-- Name: payroll_run payroll_run_pkey; Type: CONSTRAINT; Schema: erp; Owner: postgres
--

ALTER TABLE ONLY erp.payroll_run
    ADD CONSTRAINT payroll_run_pkey PRIMARY KEY (payroll_run_id);


--
-- Name: product_costing product_costing_pkey; Type: CONSTRAINT; Schema: erp; Owner: erp_app
--

ALTER TABLE ONLY erp.product_costing
    ADD CONSTRAINT product_costing_pkey PRIMARY KEY (product_costing_id);


--
-- Name: production_batch production_batch_pkey; Type: CONSTRAINT; Schema: erp; Owner: postgres
--

ALTER TABLE ONLY erp.production_batch
    ADD CONSTRAINT production_batch_pkey PRIMARY KEY (prod_batch_key);


--
-- Name: project_billing project_billing_pkey; Type: CONSTRAINT; Schema: erp; Owner: postgres
--

ALTER TABLE ONLY erp.project_billing
    ADD CONSTRAINT project_billing_pkey PRIMARY KEY (billing_id);


--
-- Name: project_job_budget project_job_budget_pkey; Type: CONSTRAINT; Schema: erp; Owner: postgres
--

ALTER TABLE ONLY erp.project_job_budget
    ADD CONSTRAINT project_job_budget_pkey PRIMARY KEY (budget_id);


--
-- Name: project_job_budget project_job_budget_project_job_id_cost_head_key; Type: CONSTRAINT; Schema: erp; Owner: postgres
--

ALTER TABLE ONLY erp.project_job_budget
    ADD CONSTRAINT project_job_budget_project_job_id_cost_head_key UNIQUE (project_job_id, cost_head);


--
-- Name: project_job project_job_cost_center_key_key; Type: CONSTRAINT; Schema: erp; Owner: postgres
--

ALTER TABLE ONLY erp.project_job
    ADD CONSTRAINT project_job_cost_center_key_key UNIQUE (cost_center_key);


--
-- Name: project_job project_job_pkey; Type: CONSTRAINT; Schema: erp; Owner: postgres
--

ALTER TABLE ONLY erp.project_job
    ADD CONSTRAINT project_job_pkey PRIMARY KEY (project_job_id);


--
-- Name: project_job project_job_project_code_key; Type: CONSTRAINT; Schema: erp; Owner: postgres
--

ALTER TABLE ONLY erp.project_job
    ADD CONSTRAINT project_job_project_code_key UNIQUE (project_code);


--
-- Name: project_retention project_retention_pkey; Type: CONSTRAINT; Schema: erp; Owner: postgres
--

ALTER TABLE ONLY erp.project_retention
    ADD CONSTRAINT project_retention_pkey PRIMARY KEY (retention_id);


--
-- Name: purchase_order purchase_order_company_key_po_number_key; Type: CONSTRAINT; Schema: erp; Owner: postgres
--

ALTER TABLE ONLY erp.purchase_order
    ADD CONSTRAINT purchase_order_company_key_po_number_key UNIQUE (company_key, po_number);


--
-- Name: purchase_order_line purchase_order_line_pkey; Type: CONSTRAINT; Schema: erp; Owner: postgres
--

ALTER TABLE ONLY erp.purchase_order_line
    ADD CONSTRAINT purchase_order_line_pkey PRIMARY KEY (po_line_id);


--
-- Name: purchase_order_line purchase_order_line_po_id_line_no_key; Type: CONSTRAINT; Schema: erp; Owner: postgres
--

ALTER TABLE ONLY erp.purchase_order_line
    ADD CONSTRAINT purchase_order_line_po_id_line_no_key UNIQUE (po_id, line_no);


--
-- Name: purchase_order purchase_order_pkey; Type: CONSTRAINT; Schema: erp; Owner: postgres
--

ALTER TABLE ONLY erp.purchase_order
    ADD CONSTRAINT purchase_order_pkey PRIMARY KEY (po_id);


--
-- Name: role_permission role_permission_pkey; Type: CONSTRAINT; Schema: erp; Owner: postgres
--

ALTER TABLE ONLY erp.role_permission
    ADD CONSTRAINT role_permission_pkey PRIMARY KEY (permission_key);


--
-- Name: routing routing_parent_item_key_operation_no_key; Type: CONSTRAINT; Schema: erp; Owner: postgres
--

ALTER TABLE ONLY erp.routing
    ADD CONSTRAINT routing_parent_item_key_operation_no_key UNIQUE (parent_item_key, operation_no);


--
-- Name: routing routing_pkey; Type: CONSTRAINT; Schema: erp; Owner: postgres
--

ALTER TABLE ONLY erp.routing
    ADD CONSTRAINT routing_pkey PRIMARY KEY (routing_key);


--
-- Name: sales_order sales_order_company_key_so_number_key; Type: CONSTRAINT; Schema: erp; Owner: postgres
--

ALTER TABLE ONLY erp.sales_order
    ADD CONSTRAINT sales_order_company_key_so_number_key UNIQUE (company_key, so_number);


--
-- Name: sales_order_line sales_order_line_pkey; Type: CONSTRAINT; Schema: erp; Owner: postgres
--

ALTER TABLE ONLY erp.sales_order_line
    ADD CONSTRAINT sales_order_line_pkey PRIMARY KEY (so_line_id);


--
-- Name: sales_order_line sales_order_line_so_id_line_no_key; Type: CONSTRAINT; Schema: erp; Owner: postgres
--

ALTER TABLE ONLY erp.sales_order_line
    ADD CONSTRAINT sales_order_line_so_id_line_no_key UNIQUE (so_id, line_no);


--
-- Name: sales_order sales_order_pkey; Type: CONSTRAINT; Schema: erp; Owner: postgres
--

ALTER TABLE ONLY erp.sales_order
    ADD CONSTRAINT sales_order_pkey PRIMARY KEY (so_id);


--
-- Name: tax_transaction tax_transaction_pkey; Type: CONSTRAINT; Schema: erp; Owner: postgres
--

ALTER TABLE ONLY erp.tax_transaction
    ADD CONSTRAINT tax_transaction_pkey PRIMARY KEY (tax_txn_id);


--
-- Name: user_role user_role_pkey; Type: CONSTRAINT; Schema: erp; Owner: postgres
--

ALTER TABLE ONLY erp.user_role
    ADD CONSTRAINT user_role_pkey PRIMARY KEY (role_key);


--
-- Name: user_role user_role_role_name_key; Type: CONSTRAINT; Schema: erp; Owner: postgres
--

ALTER TABLE ONLY erp.user_role
    ADD CONSTRAINT user_role_role_name_key UNIQUE (role_name);


--
-- Name: warehouse_bin warehouse_bin_pkey; Type: CONSTRAINT; Schema: erp; Owner: postgres
--

ALTER TABLE ONLY erp.warehouse_bin
    ADD CONSTRAINT warehouse_bin_pkey PRIMARY KEY (bin_key);


--
-- Name: warehouse_bin warehouse_bin_warehouse_key_bin_code_key; Type: CONSTRAINT; Schema: erp; Owner: postgres
--

ALTER TABLE ONLY erp.warehouse_bin
    ADD CONSTRAINT warehouse_bin_warehouse_key_bin_code_key UNIQUE (warehouse_key, bin_code);


--
-- Name: warehouse warehouse_company_key_code_key; Type: CONSTRAINT; Schema: erp; Owner: postgres
--

ALTER TABLE ONLY erp.warehouse
    ADD CONSTRAINT warehouse_company_key_code_key UNIQUE (company_key, code);


--
-- Name: warehouse warehouse_pkey; Type: CONSTRAINT; Schema: erp; Owner: postgres
--

ALTER TABLE ONLY erp.warehouse
    ADD CONSTRAINT warehouse_pkey PRIMARY KEY (warehouse_key);


--
-- Name: withholding_tax_setup withholding_tax_setup_code_key; Type: CONSTRAINT; Schema: erp; Owner: postgres
--

ALTER TABLE ONLY erp.withholding_tax_setup
    ADD CONSTRAINT withholding_tax_setup_code_key UNIQUE (code);


--
-- Name: withholding_tax_setup withholding_tax_setup_pkey; Type: CONSTRAINT; Schema: erp; Owner: postgres
--

ALTER TABLE ONLY erp.withholding_tax_setup
    ADD CONSTRAINT withholding_tax_setup_pkey PRIMARY KEY (wht_id);


--
-- Name: withholding_tax_transaction withholding_tax_transaction_pkey; Type: CONSTRAINT; Schema: erp; Owner: postgres
--

ALTER TABLE ONLY erp.withholding_tax_transaction
    ADD CONSTRAINT withholding_tax_transaction_pkey PRIMARY KEY (wht_txn_id);


--
-- Name: workflow_definition workflow_definition_pkey; Type: CONSTRAINT; Schema: erp; Owner: postgres
--

ALTER TABLE ONLY erp.workflow_definition
    ADD CONSTRAINT workflow_definition_pkey PRIMARY KEY (workflow_id);


--
-- Name: workflow_step workflow_step_pkey; Type: CONSTRAINT; Schema: erp; Owner: postgres
--

ALTER TABLE ONLY erp.workflow_step
    ADD CONSTRAINT workflow_step_pkey PRIMARY KEY (step_id);


--
-- Name: workflow_step workflow_step_workflow_id_step_order_key; Type: CONSTRAINT; Schema: erp; Owner: postgres
--

ALTER TABLE ONLY erp.workflow_step
    ADD CONSTRAINT workflow_step_workflow_id_step_order_key UNIQUE (workflow_id, step_order);


--
-- Name: auth_group_name_a6ea08ec_like; Type: INDEX; Schema: erp; Owner: erp_app
--

CREATE INDEX auth_group_name_a6ea08ec_like ON erp.auth_group USING btree (name varchar_pattern_ops);


--
-- Name: auth_group_permissions_group_id_b120cbf9; Type: INDEX; Schema: erp; Owner: erp_app
--

CREATE INDEX auth_group_permissions_group_id_b120cbf9 ON erp.auth_group_permissions USING btree (group_id);


--
-- Name: auth_group_permissions_permission_id_84c5c92e; Type: INDEX; Schema: erp; Owner: erp_app
--

CREATE INDEX auth_group_permissions_permission_id_84c5c92e ON erp.auth_group_permissions USING btree (permission_id);


--
-- Name: auth_permission_content_type_id_2f476e4b; Type: INDEX; Schema: erp; Owner: erp_app
--

CREATE INDEX auth_permission_content_type_id_2f476e4b ON erp.auth_permission USING btree (content_type_id);


--
-- Name: auth_user_groups_group_id_97559544; Type: INDEX; Schema: erp; Owner: erp_app
--

CREATE INDEX auth_user_groups_group_id_97559544 ON erp.auth_user_groups USING btree (group_id);


--
-- Name: auth_user_groups_user_id_6a12ed8b; Type: INDEX; Schema: erp; Owner: erp_app
--

CREATE INDEX auth_user_groups_user_id_6a12ed8b ON erp.auth_user_groups USING btree (user_id);


--
-- Name: auth_user_user_permissions_permission_id_1fbb5f2c; Type: INDEX; Schema: erp; Owner: erp_app
--

CREATE INDEX auth_user_user_permissions_permission_id_1fbb5f2c ON erp.auth_user_user_permissions USING btree (permission_id);


--
-- Name: auth_user_user_permissions_user_id_a95ead1b; Type: INDEX; Schema: erp; Owner: erp_app
--

CREATE INDEX auth_user_user_permissions_user_id_a95ead1b ON erp.auth_user_user_permissions USING btree (user_id);


--
-- Name: auth_user_username_6821ab7c_like; Type: INDEX; Schema: erp; Owner: erp_app
--

CREATE INDEX auth_user_username_6821ab7c_like ON erp.auth_user USING btree (username varchar_pattern_ops);


--
-- Name: django_admin_log_content_type_id_c4bce8eb; Type: INDEX; Schema: erp; Owner: erp_app
--

CREATE INDEX django_admin_log_content_type_id_c4bce8eb ON erp.django_admin_log USING btree (content_type_id);


--
-- Name: django_admin_log_user_id_c564eba6; Type: INDEX; Schema: erp; Owner: erp_app
--

CREATE INDEX django_admin_log_user_id_c564eba6 ON erp.django_admin_log USING btree (user_id);


--
-- Name: django_session_expire_date_a5c62663; Type: INDEX; Schema: erp; Owner: erp_app
--

CREATE INDEX django_session_expire_date_a5c62663 ON erp.django_session USING btree (expire_date);


--
-- Name: django_session_session_key_c0390e0f_like; Type: INDEX; Schema: erp; Owner: erp_app
--

CREATE INDEX django_session_session_key_c0390e0f_like ON erp.django_session USING btree (session_key varchar_pattern_ops);


--
-- Name: idx_delivery_note_date; Type: INDEX; Schema: erp; Owner: postgres
--

CREATE INDEX idx_delivery_note_date ON erp.delivery_note USING btree (delivery_date);


--
-- Name: idx_delivery_note_line_dn; Type: INDEX; Schema: erp; Owner: postgres
--

CREATE INDEX idx_delivery_note_line_dn ON erp.delivery_note_line USING btree (dn_id);


--
-- Name: idx_delivery_note_line_item; Type: INDEX; Schema: erp; Owner: postgres
--

CREATE INDEX idx_delivery_note_line_item ON erp.delivery_note_line USING btree (item_key);


--
-- Name: idx_delivery_note_so; Type: INDEX; Schema: erp; Owner: postgres
--

CREATE INDEX idx_delivery_note_so ON erp.delivery_note USING btree (so_id);


--
-- Name: idx_delivery_note_warehouse; Type: INDEX; Schema: erp; Owner: postgres
--

CREATE INDEX idx_delivery_note_warehouse ON erp.delivery_note USING btree (warehouse_key);


--
-- Name: idx_item_reorder_level; Type: INDEX; Schema: erp; Owner: postgres
--

CREATE INDEX idx_item_reorder_level ON erp.dim_item USING btree (reorder_level) WHERE (is_active = true);


--
-- Name: ux_inventory_balance; Type: INDEX; Schema: erp; Owner: postgres
--

CREATE UNIQUE INDEX ux_inventory_balance ON erp.inventory_balance USING btree (company_key, item_key, warehouse_key, COALESCE(bin_key, (0)::bigint), COALESCE(batch_key, (0)::bigint));


--
-- Name: ux_product_costing; Type: INDEX; Schema: erp; Owner: erp_app
--

CREATE UNIQUE INDEX ux_product_costing ON erp.product_costing USING btree (company_key, item_key, cost_version, effective_date);


--
-- Name: app_user_role app_user_role_role_key_fkey; Type: FK CONSTRAINT; Schema: erp; Owner: postgres
--

ALTER TABLE ONLY erp.app_user_role
    ADD CONSTRAINT app_user_role_role_key_fkey FOREIGN KEY (role_key) REFERENCES erp.user_role(role_key);


--
-- Name: app_user_role app_user_role_user_key_fkey; Type: FK CONSTRAINT; Schema: erp; Owner: postgres
--

ALTER TABLE ONLY erp.app_user_role
    ADD CONSTRAINT app_user_role_user_key_fkey FOREIGN KEY (user_key) REFERENCES erp.app_user(user_key);


--
-- Name: asset_category asset_category_accumulated_dep_account_key_fkey; Type: FK CONSTRAINT; Schema: erp; Owner: postgres
--

ALTER TABLE ONLY erp.asset_category
    ADD CONSTRAINT asset_category_accumulated_dep_account_key_fkey FOREIGN KEY (accumulated_dep_account_key) REFERENCES erp.chart_of_accounts(account_key);


--
-- Name: asset_category asset_category_created_by_fkey; Type: FK CONSTRAINT; Schema: erp; Owner: postgres
--

ALTER TABLE ONLY erp.asset_category
    ADD CONSTRAINT asset_category_created_by_fkey FOREIGN KEY (created_by) REFERENCES erp.app_user(user_key);


--
-- Name: asset_category asset_category_depreciation_account_key_fkey; Type: FK CONSTRAINT; Schema: erp; Owner: postgres
--

ALTER TABLE ONLY erp.asset_category
    ADD CONSTRAINT asset_category_depreciation_account_key_fkey FOREIGN KEY (depreciation_account_key) REFERENCES erp.chart_of_accounts(account_key);


--
-- Name: asset_category asset_category_disposal_gain_account_key_fkey; Type: FK CONSTRAINT; Schema: erp; Owner: postgres
--

ALTER TABLE ONLY erp.asset_category
    ADD CONSTRAINT asset_category_disposal_gain_account_key_fkey FOREIGN KEY (disposal_gain_account_key) REFERENCES erp.chart_of_accounts(account_key);


--
-- Name: asset_category asset_category_disposal_loss_account_key_fkey; Type: FK CONSTRAINT; Schema: erp; Owner: postgres
--

ALTER TABLE ONLY erp.asset_category
    ADD CONSTRAINT asset_category_disposal_loss_account_key_fkey FOREIGN KEY (disposal_loss_account_key) REFERENCES erp.chart_of_accounts(account_key);


--
-- Name: audit_trail audit_trail_changed_by_fkey; Type: FK CONSTRAINT; Schema: erp; Owner: postgres
--

ALTER TABLE ONLY erp.audit_trail
    ADD CONSTRAINT audit_trail_changed_by_fkey FOREIGN KEY (changed_by) REFERENCES erp.app_user(user_key);


--
-- Name: auth_group_permissions auth_group_permissio_permission_id_84c5c92e_fk_auth_perm; Type: FK CONSTRAINT; Schema: erp; Owner: erp_app
--

ALTER TABLE ONLY erp.auth_group_permissions
    ADD CONSTRAINT auth_group_permissio_permission_id_84c5c92e_fk_auth_perm FOREIGN KEY (permission_id) REFERENCES erp.auth_permission(id) DEFERRABLE INITIALLY DEFERRED;


--
-- Name: auth_group_permissions auth_group_permissions_group_id_b120cbf9_fk_auth_group_id; Type: FK CONSTRAINT; Schema: erp; Owner: erp_app
--

ALTER TABLE ONLY erp.auth_group_permissions
    ADD CONSTRAINT auth_group_permissions_group_id_b120cbf9_fk_auth_group_id FOREIGN KEY (group_id) REFERENCES erp.auth_group(id) DEFERRABLE INITIALLY DEFERRED;


--
-- Name: auth_permission auth_permission_content_type_id_2f476e4b_fk_django_co; Type: FK CONSTRAINT; Schema: erp; Owner: erp_app
--

ALTER TABLE ONLY erp.auth_permission
    ADD CONSTRAINT auth_permission_content_type_id_2f476e4b_fk_django_co FOREIGN KEY (content_type_id) REFERENCES erp.django_content_type(id) DEFERRABLE INITIALLY DEFERRED;


--
-- Name: auth_user_groups auth_user_groups_group_id_97559544_fk_auth_group_id; Type: FK CONSTRAINT; Schema: erp; Owner: erp_app
--

ALTER TABLE ONLY erp.auth_user_groups
    ADD CONSTRAINT auth_user_groups_group_id_97559544_fk_auth_group_id FOREIGN KEY (group_id) REFERENCES erp.auth_group(id) DEFERRABLE INITIALLY DEFERRED;


--
-- Name: auth_user_groups auth_user_groups_user_id_6a12ed8b_fk_auth_user_id; Type: FK CONSTRAINT; Schema: erp; Owner: erp_app
--

ALTER TABLE ONLY erp.auth_user_groups
    ADD CONSTRAINT auth_user_groups_user_id_6a12ed8b_fk_auth_user_id FOREIGN KEY (user_id) REFERENCES erp.auth_user(id) DEFERRABLE INITIALLY DEFERRED;


--
-- Name: auth_user_user_permissions auth_user_user_permi_permission_id_1fbb5f2c_fk_auth_perm; Type: FK CONSTRAINT; Schema: erp; Owner: erp_app
--

ALTER TABLE ONLY erp.auth_user_user_permissions
    ADD CONSTRAINT auth_user_user_permi_permission_id_1fbb5f2c_fk_auth_perm FOREIGN KEY (permission_id) REFERENCES erp.auth_permission(id) DEFERRABLE INITIALLY DEFERRED;


--
-- Name: auth_user_user_permissions auth_user_user_permissions_user_id_a95ead1b_fk_auth_user_id; Type: FK CONSTRAINT; Schema: erp; Owner: erp_app
--

ALTER TABLE ONLY erp.auth_user_user_permissions
    ADD CONSTRAINT auth_user_user_permissions_user_id_a95ead1b_fk_auth_user_id FOREIGN KEY (user_id) REFERENCES erp.auth_user(id) DEFERRABLE INITIALLY DEFERRED;


--
-- Name: batch_cost_detail batch_cost_detail_created_by_fkey; Type: FK CONSTRAINT; Schema: erp; Owner: postgres
--

ALTER TABLE ONLY erp.batch_cost_detail
    ADD CONSTRAINT batch_cost_detail_created_by_fkey FOREIGN KEY (created_by) REFERENCES erp.app_user(user_key);


--
-- Name: batch_cost_detail batch_cost_detail_prod_batch_key_fkey; Type: FK CONSTRAINT; Schema: erp; Owner: postgres
--

ALTER TABLE ONLY erp.batch_cost_detail
    ADD CONSTRAINT batch_cost_detail_prod_batch_key_fkey FOREIGN KEY (prod_batch_key) REFERENCES erp.production_batch(prod_batch_key) ON DELETE CASCADE;


--
-- Name: bom_component bom_component_bom_key_fkey; Type: FK CONSTRAINT; Schema: erp; Owner: postgres
--

ALTER TABLE ONLY erp.bom_component
    ADD CONSTRAINT bom_component_bom_key_fkey FOREIGN KEY (bom_key) REFERENCES erp.bom(bom_key) ON DELETE CASCADE;


--
-- Name: bom_component bom_component_component_item_key_fkey; Type: FK CONSTRAINT; Schema: erp; Owner: postgres
--

ALTER TABLE ONLY erp.bom_component
    ADD CONSTRAINT bom_component_component_item_key_fkey FOREIGN KEY (component_item_key) REFERENCES erp.dim_item(item_key);


--
-- Name: bom bom_parent_item_key_fkey; Type: FK CONSTRAINT; Schema: erp; Owner: postgres
--

ALTER TABLE ONLY erp.bom
    ADD CONSTRAINT bom_parent_item_key_fkey FOREIGN KEY (parent_item_key) REFERENCES erp.dim_item(item_key);


--
-- Name: chart_of_accounts chart_of_accounts_company_key_fkey; Type: FK CONSTRAINT; Schema: erp; Owner: postgres
--

ALTER TABLE ONLY erp.chart_of_accounts
    ADD CONSTRAINT chart_of_accounts_company_key_fkey FOREIGN KEY (company_key) REFERENCES erp.dim_company(company_key);


--
-- Name: chart_of_accounts chart_of_accounts_parent_key_fkey; Type: FK CONSTRAINT; Schema: erp; Owner: postgres
--

ALTER TABLE ONLY erp.chart_of_accounts
    ADD CONSTRAINT chart_of_accounts_parent_key_fkey FOREIGN KEY (parent_key) REFERENCES erp.chart_of_accounts(account_key);


--
-- Name: crm_activity crm_activity_created_by_fkey; Type: FK CONSTRAINT; Schema: erp; Owner: postgres
--

ALTER TABLE ONLY erp.crm_activity
    ADD CONSTRAINT crm_activity_created_by_fkey FOREIGN KEY (created_by) REFERENCES erp.app_user(user_key);


--
-- Name: crm_activity crm_activity_lead_id_fkey; Type: FK CONSTRAINT; Schema: erp; Owner: postgres
--

ALTER TABLE ONLY erp.crm_activity
    ADD CONSTRAINT crm_activity_lead_id_fkey FOREIGN KEY (lead_id) REFERENCES erp.crm_lead(lead_id) ON DELETE CASCADE;


--
-- Name: crm_activity crm_activity_party_key_fkey; Type: FK CONSTRAINT; Schema: erp; Owner: postgres
--

ALTER TABLE ONLY erp.crm_activity
    ADD CONSTRAINT crm_activity_party_key_fkey FOREIGN KEY (party_key) REFERENCES erp.party(party_key);


--
-- Name: crm_lead crm_lead_company_key_fkey; Type: FK CONSTRAINT; Schema: erp; Owner: postgres
--

ALTER TABLE ONLY erp.crm_lead
    ADD CONSTRAINT crm_lead_company_key_fkey FOREIGN KEY (company_key) REFERENCES erp.dim_company(company_key);


--
-- Name: crm_lead crm_lead_created_by_fkey; Type: FK CONSTRAINT; Schema: erp; Owner: postgres
--

ALTER TABLE ONLY erp.crm_lead
    ADD CONSTRAINT crm_lead_created_by_fkey FOREIGN KEY (created_by) REFERENCES erp.app_user(user_key);


--
-- Name: crm_lead crm_lead_currency_code_fkey; Type: FK CONSTRAINT; Schema: erp; Owner: postgres
--

ALTER TABLE ONLY erp.crm_lead
    ADD CONSTRAINT crm_lead_currency_code_fkey FOREIGN KEY (currency_code) REFERENCES erp.dim_currency(currency_code);


--
-- Name: crm_lead crm_lead_customer_party_key_fkey; Type: FK CONSTRAINT; Schema: erp; Owner: postgres
--

ALTER TABLE ONLY erp.crm_lead
    ADD CONSTRAINT crm_lead_customer_party_key_fkey FOREIGN KEY (customer_party_key) REFERENCES erp.party(party_key);


--
-- Name: delivery_note delivery_note_company_key_fkey; Type: FK CONSTRAINT; Schema: erp; Owner: postgres
--

ALTER TABLE ONLY erp.delivery_note
    ADD CONSTRAINT delivery_note_company_key_fkey FOREIGN KEY (company_key) REFERENCES erp.dim_company(company_key);


--
-- Name: delivery_note delivery_note_created_by_fkey; Type: FK CONSTRAINT; Schema: erp; Owner: postgres
--

ALTER TABLE ONLY erp.delivery_note
    ADD CONSTRAINT delivery_note_created_by_fkey FOREIGN KEY (created_by) REFERENCES erp.app_user(user_key);


--
-- Name: delivery_note_line delivery_note_line_dn_id_fkey; Type: FK CONSTRAINT; Schema: erp; Owner: postgres
--

ALTER TABLE ONLY erp.delivery_note_line
    ADD CONSTRAINT delivery_note_line_dn_id_fkey FOREIGN KEY (dn_id) REFERENCES erp.delivery_note(dn_id) ON DELETE CASCADE;


--
-- Name: delivery_note_line delivery_note_line_item_key_fkey; Type: FK CONSTRAINT; Schema: erp; Owner: postgres
--

ALTER TABLE ONLY erp.delivery_note_line
    ADD CONSTRAINT delivery_note_line_item_key_fkey FOREIGN KEY (item_key) REFERENCES erp.dim_item(item_key);


--
-- Name: delivery_note_line delivery_note_line_so_line_id_fkey; Type: FK CONSTRAINT; Schema: erp; Owner: postgres
--

ALTER TABLE ONLY erp.delivery_note_line
    ADD CONSTRAINT delivery_note_line_so_line_id_fkey FOREIGN KEY (so_line_id) REFERENCES erp.sales_order_line(so_line_id);


--
-- Name: delivery_note delivery_note_so_id_fkey; Type: FK CONSTRAINT; Schema: erp; Owner: postgres
--

ALTER TABLE ONLY erp.delivery_note
    ADD CONSTRAINT delivery_note_so_id_fkey FOREIGN KEY (so_id) REFERENCES erp.sales_order(so_id);


--
-- Name: delivery_note delivery_note_warehouse_key_fkey; Type: FK CONSTRAINT; Schema: erp; Owner: postgres
--

ALTER TABLE ONLY erp.delivery_note
    ADD CONSTRAINT delivery_note_warehouse_key_fkey FOREIGN KEY (warehouse_key) REFERENCES erp.warehouse(warehouse_key);


--
-- Name: dim_batch dim_batch_item_key_fkey; Type: FK CONSTRAINT; Schema: erp; Owner: postgres
--

ALTER TABLE ONLY erp.dim_batch
    ADD CONSTRAINT dim_batch_item_key_fkey FOREIGN KEY (item_key) REFERENCES erp.dim_item(item_key);


--
-- Name: dim_cost_center dim_cost_center_company_key_fkey; Type: FK CONSTRAINT; Schema: erp; Owner: postgres
--

ALTER TABLE ONLY erp.dim_cost_center
    ADD CONSTRAINT dim_cost_center_company_key_fkey FOREIGN KEY (company_key) REFERENCES erp.dim_company(company_key);


--
-- Name: dim_cost_center dim_cost_center_parent_key_fkey; Type: FK CONSTRAINT; Schema: erp; Owner: postgres
--

ALTER TABLE ONLY erp.dim_cost_center
    ADD CONSTRAINT dim_cost_center_parent_key_fkey FOREIGN KEY (parent_key) REFERENCES erp.dim_cost_center(cost_center_key);


--
-- Name: django_admin_log django_admin_log_content_type_id_c4bce8eb_fk_django_co; Type: FK CONSTRAINT; Schema: erp; Owner: erp_app
--

ALTER TABLE ONLY erp.django_admin_log
    ADD CONSTRAINT django_admin_log_content_type_id_c4bce8eb_fk_django_co FOREIGN KEY (content_type_id) REFERENCES erp.django_content_type(id) DEFERRABLE INITIALLY DEFERRED;


--
-- Name: django_admin_log django_admin_log_user_id_c564eba6_fk_auth_user_id; Type: FK CONSTRAINT; Schema: erp; Owner: erp_app
--

ALTER TABLE ONLY erp.django_admin_log
    ADD CONSTRAINT django_admin_log_user_id_c564eba6_fk_auth_user_id FOREIGN KEY (user_id) REFERENCES erp.auth_user(id) DEFERRABLE INITIALLY DEFERRED;


--
-- Name: document_approval_history document_approval_history_action_by_fkey; Type: FK CONSTRAINT; Schema: erp; Owner: postgres
--

ALTER TABLE ONLY erp.document_approval_history
    ADD CONSTRAINT document_approval_history_action_by_fkey FOREIGN KEY (action_by) REFERENCES erp.app_user(user_key);


--
-- Name: document_approval_history document_approval_history_instance_id_fkey; Type: FK CONSTRAINT; Schema: erp; Owner: postgres
--

ALTER TABLE ONLY erp.document_approval_history
    ADD CONSTRAINT document_approval_history_instance_id_fkey FOREIGN KEY (instance_id) REFERENCES erp.document_workflow_instance(instance_id) ON DELETE CASCADE;


--
-- Name: document_approval_history document_approval_history_step_id_fkey; Type: FK CONSTRAINT; Schema: erp; Owner: postgres
--

ALTER TABLE ONLY erp.document_approval_history
    ADD CONSTRAINT document_approval_history_step_id_fkey FOREIGN KEY (step_id) REFERENCES erp.workflow_step(step_id);


--
-- Name: document_workflow_instance document_workflow_instance_current_step_id_fkey; Type: FK CONSTRAINT; Schema: erp; Owner: postgres
--

ALTER TABLE ONLY erp.document_workflow_instance
    ADD CONSTRAINT document_workflow_instance_current_step_id_fkey FOREIGN KEY (current_step_id) REFERENCES erp.workflow_step(step_id);


--
-- Name: document_workflow_instance document_workflow_instance_requested_by_fkey; Type: FK CONSTRAINT; Schema: erp; Owner: postgres
--

ALTER TABLE ONLY erp.document_workflow_instance
    ADD CONSTRAINT document_workflow_instance_requested_by_fkey FOREIGN KEY (requested_by) REFERENCES erp.app_user(user_key);


--
-- Name: document_workflow_instance document_workflow_instance_workflow_id_fkey; Type: FK CONSTRAINT; Schema: erp; Owner: postgres
--

ALTER TABLE ONLY erp.document_workflow_instance
    ADD CONSTRAINT document_workflow_instance_workflow_id_fkey FOREIGN KEY (workflow_id) REFERENCES erp.workflow_definition(workflow_id);


--
-- Name: employee employee_cost_center_key_fkey; Type: FK CONSTRAINT; Schema: erp; Owner: postgres
--

ALTER TABLE ONLY erp.employee
    ADD CONSTRAINT employee_cost_center_key_fkey FOREIGN KEY (cost_center_key) REFERENCES erp.dim_cost_center(cost_center_key);


--
-- Name: employee employee_party_key_fkey; Type: FK CONSTRAINT; Schema: erp; Owner: postgres
--

ALTER TABLE ONLY erp.employee
    ADD CONSTRAINT employee_party_key_fkey FOREIGN KEY (party_key) REFERENCES erp.party(party_key);


--
-- Name: fiscal_period fiscal_period_company_key_fkey; Type: FK CONSTRAINT; Schema: erp; Owner: postgres
--

ALTER TABLE ONLY erp.fiscal_period
    ADD CONSTRAINT fiscal_period_company_key_fkey FOREIGN KEY (company_key) REFERENCES erp.dim_company(company_key);


--
-- Name: fixed_asset fixed_asset_asset_category_key_fkey; Type: FK CONSTRAINT; Schema: erp; Owner: postgres
--

ALTER TABLE ONLY erp.fixed_asset
    ADD CONSTRAINT fixed_asset_asset_category_key_fkey FOREIGN KEY (asset_category_key) REFERENCES erp.asset_category(asset_category_key);


--
-- Name: fixed_asset fixed_asset_company_key_fkey; Type: FK CONSTRAINT; Schema: erp; Owner: postgres
--

ALTER TABLE ONLY erp.fixed_asset
    ADD CONSTRAINT fixed_asset_company_key_fkey FOREIGN KEY (company_key) REFERENCES erp.dim_company(company_key);


--
-- Name: fixed_asset fixed_asset_cost_center_key_fkey; Type: FK CONSTRAINT; Schema: erp; Owner: postgres
--

ALTER TABLE ONLY erp.fixed_asset
    ADD CONSTRAINT fixed_asset_cost_center_key_fkey FOREIGN KEY (cost_center_key) REFERENCES erp.dim_cost_center(cost_center_key);


--
-- Name: fixed_asset fixed_asset_created_by_fkey; Type: FK CONSTRAINT; Schema: erp; Owner: postgres
--

ALTER TABLE ONLY erp.fixed_asset
    ADD CONSTRAINT fixed_asset_created_by_fkey FOREIGN KEY (created_by) REFERENCES erp.app_user(user_key);


--
-- Name: fixed_asset_depreciation_line fixed_asset_depreciation_line_dep_run_id_fkey; Type: FK CONSTRAINT; Schema: erp; Owner: postgres
--

ALTER TABLE ONLY erp.fixed_asset_depreciation_line
    ADD CONSTRAINT fixed_asset_depreciation_line_dep_run_id_fkey FOREIGN KEY (dep_run_id) REFERENCES erp.fixed_asset_depreciation_run(dep_run_id) ON DELETE CASCADE;


--
-- Name: fixed_asset_depreciation_line fixed_asset_depreciation_line_fixed_asset_key_fkey; Type: FK CONSTRAINT; Schema: erp; Owner: postgres
--

ALTER TABLE ONLY erp.fixed_asset_depreciation_line
    ADD CONSTRAINT fixed_asset_depreciation_line_fixed_asset_key_fkey FOREIGN KEY (fixed_asset_key) REFERENCES erp.fixed_asset(fixed_asset_key);


--
-- Name: fixed_asset_depreciation_line fixed_asset_depreciation_line_gl_id_fkey; Type: FK CONSTRAINT; Schema: erp; Owner: postgres
--

ALTER TABLE ONLY erp.fixed_asset_depreciation_line
    ADD CONSTRAINT fixed_asset_depreciation_line_gl_id_fkey FOREIGN KEY (gl_id) REFERENCES erp.gl_journal(gl_id);


--
-- Name: fixed_asset_depreciation_run fixed_asset_depreciation_run_created_by_fkey; Type: FK CONSTRAINT; Schema: erp; Owner: postgres
--

ALTER TABLE ONLY erp.fixed_asset_depreciation_run
    ADD CONSTRAINT fixed_asset_depreciation_run_created_by_fkey FOREIGN KEY (created_by) REFERENCES erp.app_user(user_key);


--
-- Name: fixed_asset fixed_asset_related_item_key_fkey; Type: FK CONSTRAINT; Schema: erp; Owner: postgres
--

ALTER TABLE ONLY erp.fixed_asset
    ADD CONSTRAINT fixed_asset_related_item_key_fkey FOREIGN KEY (related_item_key) REFERENCES erp.dim_item(item_key);


--
-- Name: gl_line fk_gl_line_project_job; Type: FK CONSTRAINT; Schema: erp; Owner: postgres
--

ALTER TABLE ONLY erp.gl_line
    ADD CONSTRAINT fk_gl_line_project_job FOREIGN KEY (project_job_id) REFERENCES erp.project_job(project_job_id);


--
-- Name: inventory_transaction fk_inv_txn_project_job; Type: FK CONSTRAINT; Schema: erp; Owner: postgres
--

ALTER TABLE ONLY erp.inventory_transaction
    ADD CONSTRAINT fk_inv_txn_project_job FOREIGN KEY (project_job_id) REFERENCES erp.project_job(project_job_id);


--
-- Name: invoice_line fk_invoice_line_project_job; Type: FK CONSTRAINT; Schema: erp; Owner: postgres
--

ALTER TABLE ONLY erp.invoice_line
    ADD CONSTRAINT fk_invoice_line_project_job FOREIGN KEY (project_job_id) REFERENCES erp.project_job(project_job_id);


--
-- Name: gl_journal gl_journal_company_key_fkey; Type: FK CONSTRAINT; Schema: erp; Owner: postgres
--

ALTER TABLE ONLY erp.gl_journal
    ADD CONSTRAINT gl_journal_company_key_fkey FOREIGN KEY (company_key) REFERENCES erp.dim_company(company_key);


--
-- Name: gl_journal gl_journal_created_by_fkey; Type: FK CONSTRAINT; Schema: erp; Owner: postgres
--

ALTER TABLE ONLY erp.gl_journal
    ADD CONSTRAINT gl_journal_created_by_fkey FOREIGN KEY (created_by) REFERENCES erp.app_user(user_key);


--
-- Name: gl_journal gl_journal_period_key_fkey; Type: FK CONSTRAINT; Schema: erp; Owner: postgres
--

ALTER TABLE ONLY erp.gl_journal
    ADD CONSTRAINT gl_journal_period_key_fkey FOREIGN KEY (period_key) REFERENCES erp.fiscal_period(period_key);


--
-- Name: gl_line gl_line_account_key_fkey; Type: FK CONSTRAINT; Schema: erp; Owner: postgres
--

ALTER TABLE ONLY erp.gl_line
    ADD CONSTRAINT gl_line_account_key_fkey FOREIGN KEY (account_key) REFERENCES erp.chart_of_accounts(account_key);


--
-- Name: gl_line gl_line_cost_center_key_fkey; Type: FK CONSTRAINT; Schema: erp; Owner: postgres
--

ALTER TABLE ONLY erp.gl_line
    ADD CONSTRAINT gl_line_cost_center_key_fkey FOREIGN KEY (cost_center_key) REFERENCES erp.dim_cost_center(cost_center_key);


--
-- Name: gl_line gl_line_gl_id_fkey; Type: FK CONSTRAINT; Schema: erp; Owner: postgres
--

ALTER TABLE ONLY erp.gl_line
    ADD CONSTRAINT gl_line_gl_id_fkey FOREIGN KEY (gl_id) REFERENCES erp.gl_journal(gl_id) ON DELETE CASCADE;


--
-- Name: inventory_balance inventory_balance_batch_key_fkey; Type: FK CONSTRAINT; Schema: erp; Owner: postgres
--

ALTER TABLE ONLY erp.inventory_balance
    ADD CONSTRAINT inventory_balance_batch_key_fkey FOREIGN KEY (batch_key) REFERENCES erp.dim_batch(batch_key);


--
-- Name: inventory_balance inventory_balance_bin_key_fkey; Type: FK CONSTRAINT; Schema: erp; Owner: postgres
--

ALTER TABLE ONLY erp.inventory_balance
    ADD CONSTRAINT inventory_balance_bin_key_fkey FOREIGN KEY (bin_key) REFERENCES erp.warehouse_bin(bin_key);


--
-- Name: inventory_balance inventory_balance_company_key_fkey; Type: FK CONSTRAINT; Schema: erp; Owner: postgres
--

ALTER TABLE ONLY erp.inventory_balance
    ADD CONSTRAINT inventory_balance_company_key_fkey FOREIGN KEY (company_key) REFERENCES erp.dim_company(company_key);


--
-- Name: inventory_balance inventory_balance_item_key_fkey; Type: FK CONSTRAINT; Schema: erp; Owner: postgres
--

ALTER TABLE ONLY erp.inventory_balance
    ADD CONSTRAINT inventory_balance_item_key_fkey FOREIGN KEY (item_key) REFERENCES erp.dim_item(item_key);


--
-- Name: inventory_balance inventory_balance_warehouse_key_fkey; Type: FK CONSTRAINT; Schema: erp; Owner: postgres
--

ALTER TABLE ONLY erp.inventory_balance
    ADD CONSTRAINT inventory_balance_warehouse_key_fkey FOREIGN KEY (warehouse_key) REFERENCES erp.warehouse(warehouse_key);


--
-- Name: inventory_transaction inventory_transaction_batch_key_fkey; Type: FK CONSTRAINT; Schema: erp; Owner: postgres
--

ALTER TABLE ONLY erp.inventory_transaction
    ADD CONSTRAINT inventory_transaction_batch_key_fkey FOREIGN KEY (batch_key) REFERENCES erp.dim_batch(batch_key);


--
-- Name: inventory_transaction inventory_transaction_bin_key_fkey; Type: FK CONSTRAINT; Schema: erp; Owner: postgres
--

ALTER TABLE ONLY erp.inventory_transaction
    ADD CONSTRAINT inventory_transaction_bin_key_fkey FOREIGN KEY (bin_key) REFERENCES erp.warehouse_bin(bin_key);


--
-- Name: inventory_transaction inventory_transaction_company_key_fkey; Type: FK CONSTRAINT; Schema: erp; Owner: postgres
--

ALTER TABLE ONLY erp.inventory_transaction
    ADD CONSTRAINT inventory_transaction_company_key_fkey FOREIGN KEY (company_key) REFERENCES erp.dim_company(company_key);


--
-- Name: inventory_transaction inventory_transaction_item_key_fkey; Type: FK CONSTRAINT; Schema: erp; Owner: postgres
--

ALTER TABLE ONLY erp.inventory_transaction
    ADD CONSTRAINT inventory_transaction_item_key_fkey FOREIGN KEY (item_key) REFERENCES erp.dim_item(item_key);


--
-- Name: inventory_transaction inventory_transaction_warehouse_key_fkey; Type: FK CONSTRAINT; Schema: erp; Owner: postgres
--

ALTER TABLE ONLY erp.inventory_transaction
    ADD CONSTRAINT inventory_transaction_warehouse_key_fkey FOREIGN KEY (warehouse_key) REFERENCES erp.warehouse(warehouse_key);


--
-- Name: invoice invoice_company_key_fkey; Type: FK CONSTRAINT; Schema: erp; Owner: postgres
--

ALTER TABLE ONLY erp.invoice
    ADD CONSTRAINT invoice_company_key_fkey FOREIGN KEY (company_key) REFERENCES erp.dim_company(company_key);


--
-- Name: invoice invoice_created_by_fkey; Type: FK CONSTRAINT; Schema: erp; Owner: postgres
--

ALTER TABLE ONLY erp.invoice
    ADD CONSTRAINT invoice_created_by_fkey FOREIGN KEY (created_by) REFERENCES erp.app_user(user_key);


--
-- Name: invoice invoice_currency_code_fkey; Type: FK CONSTRAINT; Schema: erp; Owner: postgres
--

ALTER TABLE ONLY erp.invoice
    ADD CONSTRAINT invoice_currency_code_fkey FOREIGN KEY (currency_code) REFERENCES erp.dim_currency(currency_code);


--
-- Name: invoice_line invoice_line_cost_center_key_fkey; Type: FK CONSTRAINT; Schema: erp; Owner: postgres
--

ALTER TABLE ONLY erp.invoice_line
    ADD CONSTRAINT invoice_line_cost_center_key_fkey FOREIGN KEY (cost_center_key) REFERENCES erp.dim_cost_center(cost_center_key);


--
-- Name: invoice_line invoice_line_invoice_id_fkey; Type: FK CONSTRAINT; Schema: erp; Owner: postgres
--

ALTER TABLE ONLY erp.invoice_line
    ADD CONSTRAINT invoice_line_invoice_id_fkey FOREIGN KEY (invoice_id) REFERENCES erp.invoice(invoice_id) ON DELETE CASCADE;


--
-- Name: invoice_line invoice_line_item_key_fkey; Type: FK CONSTRAINT; Schema: erp; Owner: postgres
--

ALTER TABLE ONLY erp.invoice_line
    ADD CONSTRAINT invoice_line_item_key_fkey FOREIGN KEY (item_key) REFERENCES erp.dim_item(item_key);


--
-- Name: invoice_line invoice_line_tax_key_fkey; Type: FK CONSTRAINT; Schema: erp; Owner: postgres
--

ALTER TABLE ONLY erp.invoice_line
    ADD CONSTRAINT invoice_line_tax_key_fkey FOREIGN KEY (tax_key) REFERENCES erp.dim_tax_code(tax_key);


--
-- Name: invoice invoice_party_key_fkey; Type: FK CONSTRAINT; Schema: erp; Owner: postgres
--

ALTER TABLE ONLY erp.invoice
    ADD CONSTRAINT invoice_party_key_fkey FOREIGN KEY (party_key) REFERENCES erp.party(party_key);


--
-- Name: lims_test_result lims_test_result_batch_key_fkey; Type: FK CONSTRAINT; Schema: erp; Owner: postgres
--

ALTER TABLE ONLY erp.lims_test_result
    ADD CONSTRAINT lims_test_result_batch_key_fkey FOREIGN KEY (batch_key) REFERENCES erp.dim_batch(batch_key);


--
-- Name: payment_allocation payment_allocation_invoice_id_fkey; Type: FK CONSTRAINT; Schema: erp; Owner: postgres
--

ALTER TABLE ONLY erp.payment_allocation
    ADD CONSTRAINT payment_allocation_invoice_id_fkey FOREIGN KEY (invoice_id) REFERENCES erp.invoice(invoice_id);


--
-- Name: payment_allocation payment_allocation_payment_id_fkey; Type: FK CONSTRAINT; Schema: erp; Owner: postgres
--

ALTER TABLE ONLY erp.payment_allocation
    ADD CONSTRAINT payment_allocation_payment_id_fkey FOREIGN KEY (payment_id) REFERENCES erp.payment(payment_id) ON DELETE CASCADE;


--
-- Name: payment payment_company_key_fkey; Type: FK CONSTRAINT; Schema: erp; Owner: postgres
--

ALTER TABLE ONLY erp.payment
    ADD CONSTRAINT payment_company_key_fkey FOREIGN KEY (company_key) REFERENCES erp.dim_company(company_key);


--
-- Name: payment payment_created_by_fkey; Type: FK CONSTRAINT; Schema: erp; Owner: postgres
--

ALTER TABLE ONLY erp.payment
    ADD CONSTRAINT payment_created_by_fkey FOREIGN KEY (created_by) REFERENCES erp.app_user(user_key);


--
-- Name: payment payment_party_key_fkey; Type: FK CONSTRAINT; Schema: erp; Owner: postgres
--

ALTER TABLE ONLY erp.payment
    ADD CONSTRAINT payment_party_key_fkey FOREIGN KEY (party_key) REFERENCES erp.party(party_key);


--
-- Name: payroll_component_line payroll_component_line_component_type_id_fkey; Type: FK CONSTRAINT; Schema: erp; Owner: postgres
--

ALTER TABLE ONLY erp.payroll_component_line
    ADD CONSTRAINT payroll_component_line_component_type_id_fkey FOREIGN KEY (component_type_id) REFERENCES erp.payroll_component_type(component_type_id);


--
-- Name: payroll_component_line payroll_component_line_cost_center_key_fkey; Type: FK CONSTRAINT; Schema: erp; Owner: postgres
--

ALTER TABLE ONLY erp.payroll_component_line
    ADD CONSTRAINT payroll_component_line_cost_center_key_fkey FOREIGN KEY (cost_center_key) REFERENCES erp.dim_cost_center(cost_center_key);


--
-- Name: payroll_component_line payroll_component_line_pe_id_fkey; Type: FK CONSTRAINT; Schema: erp; Owner: postgres
--

ALTER TABLE ONLY erp.payroll_component_line
    ADD CONSTRAINT payroll_component_line_pe_id_fkey FOREIGN KEY (pe_id) REFERENCES erp.payroll_entry(pe_id) ON DELETE CASCADE;


--
-- Name: payroll_component_line payroll_component_line_project_job_id_fkey; Type: FK CONSTRAINT; Schema: erp; Owner: postgres
--

ALTER TABLE ONLY erp.payroll_component_line
    ADD CONSTRAINT payroll_component_line_project_job_id_fkey FOREIGN KEY (project_job_id) REFERENCES erp.project_job(project_job_id);


--
-- Name: payroll_component_type payroll_component_type_account_key_fkey; Type: FK CONSTRAINT; Schema: erp; Owner: postgres
--

ALTER TABLE ONLY erp.payroll_component_type
    ADD CONSTRAINT payroll_component_type_account_key_fkey FOREIGN KEY (account_key) REFERENCES erp.chart_of_accounts(account_key);


--
-- Name: payroll_component_type payroll_component_type_created_by_fkey; Type: FK CONSTRAINT; Schema: erp; Owner: postgres
--

ALTER TABLE ONLY erp.payroll_component_type
    ADD CONSTRAINT payroll_component_type_created_by_fkey FOREIGN KEY (created_by) REFERENCES erp.app_user(user_key);


--
-- Name: payroll_entry payroll_entry_employee_id_fkey; Type: FK CONSTRAINT; Schema: erp; Owner: postgres
--

ALTER TABLE ONLY erp.payroll_entry
    ADD CONSTRAINT payroll_entry_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES erp.employee(employee_id);


--
-- Name: payroll_entry payroll_entry_payroll_run_id_fkey; Type: FK CONSTRAINT; Schema: erp; Owner: postgres
--

ALTER TABLE ONLY erp.payroll_entry
    ADD CONSTRAINT payroll_entry_payroll_run_id_fkey FOREIGN KEY (payroll_run_id) REFERENCES erp.payroll_run(payroll_run_id) ON DELETE CASCADE;


--
-- Name: payroll_run payroll_run_company_key_fkey; Type: FK CONSTRAINT; Schema: erp; Owner: postgres
--

ALTER TABLE ONLY erp.payroll_run
    ADD CONSTRAINT payroll_run_company_key_fkey FOREIGN KEY (company_key) REFERENCES erp.dim_company(company_key);


--
-- Name: payroll_run payroll_run_created_by_fkey; Type: FK CONSTRAINT; Schema: erp; Owner: postgres
--

ALTER TABLE ONLY erp.payroll_run
    ADD CONSTRAINT payroll_run_created_by_fkey FOREIGN KEY (created_by) REFERENCES erp.app_user(user_key);


--
-- Name: product_costing product_costing_company_key_fkey; Type: FK CONSTRAINT; Schema: erp; Owner: erp_app
--

ALTER TABLE ONLY erp.product_costing
    ADD CONSTRAINT product_costing_company_key_fkey FOREIGN KEY (company_key) REFERENCES erp.dim_company(company_key);


--
-- Name: product_costing product_costing_item_key_fkey; Type: FK CONSTRAINT; Schema: erp; Owner: erp_app
--

ALTER TABLE ONLY erp.product_costing
    ADD CONSTRAINT product_costing_item_key_fkey FOREIGN KEY (item_key) REFERENCES erp.dim_item(item_key);


--
-- Name: production_batch production_batch_batch_key_fkey; Type: FK CONSTRAINT; Schema: erp; Owner: postgres
--

ALTER TABLE ONLY erp.production_batch
    ADD CONSTRAINT production_batch_batch_key_fkey FOREIGN KEY (batch_key) REFERENCES erp.dim_batch(batch_key);


--
-- Name: production_batch production_batch_bom_key_fkey; Type: FK CONSTRAINT; Schema: erp; Owner: postgres
--

ALTER TABLE ONLY erp.production_batch
    ADD CONSTRAINT production_batch_bom_key_fkey FOREIGN KEY (bom_key) REFERENCES erp.bom(bom_key);


--
-- Name: production_batch production_batch_company_key_fkey; Type: FK CONSTRAINT; Schema: erp; Owner: postgres
--

ALTER TABLE ONLY erp.production_batch
    ADD CONSTRAINT production_batch_company_key_fkey FOREIGN KEY (company_key) REFERENCES erp.dim_company(company_key);


--
-- Name: production_batch production_batch_created_by_fkey; Type: FK CONSTRAINT; Schema: erp; Owner: postgres
--

ALTER TABLE ONLY erp.production_batch
    ADD CONSTRAINT production_batch_created_by_fkey FOREIGN KEY (created_by) REFERENCES erp.app_user(user_key);


--
-- Name: production_batch production_batch_routing_key_fkey; Type: FK CONSTRAINT; Schema: erp; Owner: postgres
--

ALTER TABLE ONLY erp.production_batch
    ADD CONSTRAINT production_batch_routing_key_fkey FOREIGN KEY (routing_key) REFERENCES erp.routing(routing_key);


--
-- Name: project_billing project_billing_created_by_fkey; Type: FK CONSTRAINT; Schema: erp; Owner: postgres
--

ALTER TABLE ONLY erp.project_billing
    ADD CONSTRAINT project_billing_created_by_fkey FOREIGN KEY (created_by) REFERENCES erp.app_user(user_key);


--
-- Name: project_billing project_billing_invoice_id_fkey; Type: FK CONSTRAINT; Schema: erp; Owner: postgres
--

ALTER TABLE ONLY erp.project_billing
    ADD CONSTRAINT project_billing_invoice_id_fkey FOREIGN KEY (invoice_id) REFERENCES erp.invoice(invoice_id);


--
-- Name: project_billing project_billing_project_job_id_fkey; Type: FK CONSTRAINT; Schema: erp; Owner: postgres
--

ALTER TABLE ONLY erp.project_billing
    ADD CONSTRAINT project_billing_project_job_id_fkey FOREIGN KEY (project_job_id) REFERENCES erp.project_job(project_job_id) ON DELETE CASCADE;


--
-- Name: project_job_budget project_job_budget_created_by_fkey; Type: FK CONSTRAINT; Schema: erp; Owner: postgres
--

ALTER TABLE ONLY erp.project_job_budget
    ADD CONSTRAINT project_job_budget_created_by_fkey FOREIGN KEY (created_by) REFERENCES erp.app_user(user_key);


--
-- Name: project_job_budget project_job_budget_project_job_id_fkey; Type: FK CONSTRAINT; Schema: erp; Owner: postgres
--

ALTER TABLE ONLY erp.project_job_budget
    ADD CONSTRAINT project_job_budget_project_job_id_fkey FOREIGN KEY (project_job_id) REFERENCES erp.project_job(project_job_id) ON DELETE CASCADE;


--
-- Name: project_job project_job_company_key_fkey; Type: FK CONSTRAINT; Schema: erp; Owner: postgres
--

ALTER TABLE ONLY erp.project_job
    ADD CONSTRAINT project_job_company_key_fkey FOREIGN KEY (company_key) REFERENCES erp.dim_company(company_key);


--
-- Name: project_job project_job_cost_center_key_fkey; Type: FK CONSTRAINT; Schema: erp; Owner: postgres
--

ALTER TABLE ONLY erp.project_job
    ADD CONSTRAINT project_job_cost_center_key_fkey FOREIGN KEY (cost_center_key) REFERENCES erp.dim_cost_center(cost_center_key);


--
-- Name: project_job project_job_created_by_fkey; Type: FK CONSTRAINT; Schema: erp; Owner: postgres
--

ALTER TABLE ONLY erp.project_job
    ADD CONSTRAINT project_job_created_by_fkey FOREIGN KEY (created_by) REFERENCES erp.app_user(user_key);


--
-- Name: project_job project_job_currency_code_fkey; Type: FK CONSTRAINT; Schema: erp; Owner: postgres
--

ALTER TABLE ONLY erp.project_job
    ADD CONSTRAINT project_job_currency_code_fkey FOREIGN KEY (currency_code) REFERENCES erp.dim_currency(currency_code);


--
-- Name: project_job project_job_customer_key_fkey; Type: FK CONSTRAINT; Schema: erp; Owner: postgres
--

ALTER TABLE ONLY erp.project_job
    ADD CONSTRAINT project_job_customer_key_fkey FOREIGN KEY (customer_key) REFERENCES erp.party(party_key);


--
-- Name: project_retention project_retention_created_by_fkey; Type: FK CONSTRAINT; Schema: erp; Owner: postgres
--

ALTER TABLE ONLY erp.project_retention
    ADD CONSTRAINT project_retention_created_by_fkey FOREIGN KEY (created_by) REFERENCES erp.app_user(user_key);


--
-- Name: project_retention project_retention_project_job_id_fkey; Type: FK CONSTRAINT; Schema: erp; Owner: postgres
--

ALTER TABLE ONLY erp.project_retention
    ADD CONSTRAINT project_retention_project_job_id_fkey FOREIGN KEY (project_job_id) REFERENCES erp.project_job(project_job_id) ON DELETE CASCADE;


--
-- Name: project_retention project_retention_release_invoice_id_fkey; Type: FK CONSTRAINT; Schema: erp; Owner: postgres
--

ALTER TABLE ONLY erp.project_retention
    ADD CONSTRAINT project_retention_release_invoice_id_fkey FOREIGN KEY (release_invoice_id) REFERENCES erp.invoice(invoice_id);


--
-- Name: project_retention project_retention_source_billing_id_fkey; Type: FK CONSTRAINT; Schema: erp; Owner: postgres
--

ALTER TABLE ONLY erp.project_retention
    ADD CONSTRAINT project_retention_source_billing_id_fkey FOREIGN KEY (source_billing_id) REFERENCES erp.project_billing(billing_id);


--
-- Name: purchase_order purchase_order_company_key_fkey; Type: FK CONSTRAINT; Schema: erp; Owner: postgres
--

ALTER TABLE ONLY erp.purchase_order
    ADD CONSTRAINT purchase_order_company_key_fkey FOREIGN KEY (company_key) REFERENCES erp.dim_company(company_key);


--
-- Name: purchase_order purchase_order_created_by_fkey; Type: FK CONSTRAINT; Schema: erp; Owner: postgres
--

ALTER TABLE ONLY erp.purchase_order
    ADD CONSTRAINT purchase_order_created_by_fkey FOREIGN KEY (created_by) REFERENCES erp.app_user(user_key);


--
-- Name: purchase_order purchase_order_currency_code_fkey; Type: FK CONSTRAINT; Schema: erp; Owner: postgres
--

ALTER TABLE ONLY erp.purchase_order
    ADD CONSTRAINT purchase_order_currency_code_fkey FOREIGN KEY (currency_code) REFERENCES erp.dim_currency(currency_code);


--
-- Name: purchase_order_line purchase_order_line_item_key_fkey; Type: FK CONSTRAINT; Schema: erp; Owner: postgres
--

ALTER TABLE ONLY erp.purchase_order_line
    ADD CONSTRAINT purchase_order_line_item_key_fkey FOREIGN KEY (item_key) REFERENCES erp.dim_item(item_key);


--
-- Name: purchase_order_line purchase_order_line_po_id_fkey; Type: FK CONSTRAINT; Schema: erp; Owner: postgres
--

ALTER TABLE ONLY erp.purchase_order_line
    ADD CONSTRAINT purchase_order_line_po_id_fkey FOREIGN KEY (po_id) REFERENCES erp.purchase_order(po_id) ON DELETE CASCADE;


--
-- Name: purchase_order_line purchase_order_line_tax_key_fkey; Type: FK CONSTRAINT; Schema: erp; Owner: postgres
--

ALTER TABLE ONLY erp.purchase_order_line
    ADD CONSTRAINT purchase_order_line_tax_key_fkey FOREIGN KEY (tax_key) REFERENCES erp.dim_tax_code(tax_key);


--
-- Name: purchase_order purchase_order_supplier_key_fkey; Type: FK CONSTRAINT; Schema: erp; Owner: postgres
--

ALTER TABLE ONLY erp.purchase_order
    ADD CONSTRAINT purchase_order_supplier_key_fkey FOREIGN KEY (supplier_key) REFERENCES erp.party(party_key);


--
-- Name: role_permission role_permission_role_key_fkey; Type: FK CONSTRAINT; Schema: erp; Owner: postgres
--

ALTER TABLE ONLY erp.role_permission
    ADD CONSTRAINT role_permission_role_key_fkey FOREIGN KEY (role_key) REFERENCES erp.user_role(role_key);


--
-- Name: routing routing_parent_item_key_fkey; Type: FK CONSTRAINT; Schema: erp; Owner: postgres
--

ALTER TABLE ONLY erp.routing
    ADD CONSTRAINT routing_parent_item_key_fkey FOREIGN KEY (parent_item_key) REFERENCES erp.dim_item(item_key);


--
-- Name: sales_order sales_order_company_key_fkey; Type: FK CONSTRAINT; Schema: erp; Owner: postgres
--

ALTER TABLE ONLY erp.sales_order
    ADD CONSTRAINT sales_order_company_key_fkey FOREIGN KEY (company_key) REFERENCES erp.dim_company(company_key);


--
-- Name: sales_order sales_order_created_by_fkey; Type: FK CONSTRAINT; Schema: erp; Owner: postgres
--

ALTER TABLE ONLY erp.sales_order
    ADD CONSTRAINT sales_order_created_by_fkey FOREIGN KEY (created_by) REFERENCES erp.app_user(user_key);


--
-- Name: sales_order sales_order_currency_code_fkey; Type: FK CONSTRAINT; Schema: erp; Owner: postgres
--

ALTER TABLE ONLY erp.sales_order
    ADD CONSTRAINT sales_order_currency_code_fkey FOREIGN KEY (currency_code) REFERENCES erp.dim_currency(currency_code);


--
-- Name: sales_order sales_order_customer_key_fkey; Type: FK CONSTRAINT; Schema: erp; Owner: postgres
--

ALTER TABLE ONLY erp.sales_order
    ADD CONSTRAINT sales_order_customer_key_fkey FOREIGN KEY (customer_key) REFERENCES erp.party(party_key);


--
-- Name: sales_order_line sales_order_line_item_key_fkey; Type: FK CONSTRAINT; Schema: erp; Owner: postgres
--

ALTER TABLE ONLY erp.sales_order_line
    ADD CONSTRAINT sales_order_line_item_key_fkey FOREIGN KEY (item_key) REFERENCES erp.dim_item(item_key);


--
-- Name: sales_order_line sales_order_line_so_id_fkey; Type: FK CONSTRAINT; Schema: erp; Owner: postgres
--

ALTER TABLE ONLY erp.sales_order_line
    ADD CONSTRAINT sales_order_line_so_id_fkey FOREIGN KEY (so_id) REFERENCES erp.sales_order(so_id) ON DELETE CASCADE;


--
-- Name: sales_order_line sales_order_line_tax_key_fkey; Type: FK CONSTRAINT; Schema: erp; Owner: postgres
--

ALTER TABLE ONLY erp.sales_order_line
    ADD CONSTRAINT sales_order_line_tax_key_fkey FOREIGN KEY (tax_key) REFERENCES erp.dim_tax_code(tax_key);


--
-- Name: tax_transaction tax_transaction_company_key_fkey; Type: FK CONSTRAINT; Schema: erp; Owner: postgres
--

ALTER TABLE ONLY erp.tax_transaction
    ADD CONSTRAINT tax_transaction_company_key_fkey FOREIGN KEY (company_key) REFERENCES erp.dim_company(company_key);


--
-- Name: tax_transaction tax_transaction_invoice_id_fkey; Type: FK CONSTRAINT; Schema: erp; Owner: postgres
--

ALTER TABLE ONLY erp.tax_transaction
    ADD CONSTRAINT tax_transaction_invoice_id_fkey FOREIGN KEY (invoice_id) REFERENCES erp.invoice(invoice_id);


--
-- Name: tax_transaction tax_transaction_invoice_line_id_fkey; Type: FK CONSTRAINT; Schema: erp; Owner: postgres
--

ALTER TABLE ONLY erp.tax_transaction
    ADD CONSTRAINT tax_transaction_invoice_line_id_fkey FOREIGN KEY (invoice_line_id) REFERENCES erp.invoice_line(line_id);


--
-- Name: tax_transaction tax_transaction_tax_key_fkey; Type: FK CONSTRAINT; Schema: erp; Owner: postgres
--

ALTER TABLE ONLY erp.tax_transaction
    ADD CONSTRAINT tax_transaction_tax_key_fkey FOREIGN KEY (tax_key) REFERENCES erp.dim_tax_code(tax_key);


--
-- Name: warehouse_bin warehouse_bin_warehouse_key_fkey; Type: FK CONSTRAINT; Schema: erp; Owner: postgres
--

ALTER TABLE ONLY erp.warehouse_bin
    ADD CONSTRAINT warehouse_bin_warehouse_key_fkey FOREIGN KEY (warehouse_key) REFERENCES erp.warehouse(warehouse_key);


--
-- Name: warehouse warehouse_company_key_fkey; Type: FK CONSTRAINT; Schema: erp; Owner: postgres
--

ALTER TABLE ONLY erp.warehouse
    ADD CONSTRAINT warehouse_company_key_fkey FOREIGN KEY (company_key) REFERENCES erp.dim_company(company_key);


--
-- Name: withholding_tax_setup withholding_tax_setup_account_key_fkey; Type: FK CONSTRAINT; Schema: erp; Owner: postgres
--

ALTER TABLE ONLY erp.withholding_tax_setup
    ADD CONSTRAINT withholding_tax_setup_account_key_fkey FOREIGN KEY (account_key) REFERENCES erp.chart_of_accounts(account_key);


--
-- Name: withholding_tax_transaction withholding_tax_transaction_invoice_id_fkey; Type: FK CONSTRAINT; Schema: erp; Owner: postgres
--

ALTER TABLE ONLY erp.withholding_tax_transaction
    ADD CONSTRAINT withholding_tax_transaction_invoice_id_fkey FOREIGN KEY (invoice_id) REFERENCES erp.invoice(invoice_id);


--
-- Name: withholding_tax_transaction withholding_tax_transaction_party_key_fkey; Type: FK CONSTRAINT; Schema: erp; Owner: postgres
--

ALTER TABLE ONLY erp.withholding_tax_transaction
    ADD CONSTRAINT withholding_tax_transaction_party_key_fkey FOREIGN KEY (party_key) REFERENCES erp.party(party_key);


--
-- Name: withholding_tax_transaction withholding_tax_transaction_wht_id_fkey; Type: FK CONSTRAINT; Schema: erp; Owner: postgres
--

ALTER TABLE ONLY erp.withholding_tax_transaction
    ADD CONSTRAINT withholding_tax_transaction_wht_id_fkey FOREIGN KEY (wht_id) REFERENCES erp.withholding_tax_setup(wht_id);


--
-- Name: workflow_definition workflow_definition_created_by_fkey; Type: FK CONSTRAINT; Schema: erp; Owner: postgres
--

ALTER TABLE ONLY erp.workflow_definition
    ADD CONSTRAINT workflow_definition_created_by_fkey FOREIGN KEY (created_by) REFERENCES erp.app_user(user_key);


--
-- Name: workflow_step workflow_step_workflow_id_fkey; Type: FK CONSTRAINT; Schema: erp; Owner: postgres
--

ALTER TABLE ONLY erp.workflow_step
    ADD CONSTRAINT workflow_step_workflow_id_fkey FOREIGN KEY (workflow_id) REFERENCES erp.workflow_definition(workflow_id) ON DELETE CASCADE;


--
-- Name: TABLE app_user; Type: ACL; Schema: erp; Owner: postgres
--

GRANT ALL ON TABLE erp.app_user TO erp_app;


--
-- Name: TABLE app_user_role; Type: ACL; Schema: erp; Owner: postgres
--

GRANT ALL ON TABLE erp.app_user_role TO erp_app;


--
-- Name: SEQUENCE app_user_user_key_seq; Type: ACL; Schema: erp; Owner: postgres
--

GRANT ALL ON SEQUENCE erp.app_user_user_key_seq TO erp_app;


--
-- Name: TABLE asset_category; Type: ACL; Schema: erp; Owner: postgres
--

GRANT ALL ON TABLE erp.asset_category TO erp_app;


--
-- Name: SEQUENCE asset_category_asset_category_key_seq; Type: ACL; Schema: erp; Owner: postgres
--

GRANT ALL ON SEQUENCE erp.asset_category_asset_category_key_seq TO erp_app;


--
-- Name: TABLE audit_trail; Type: ACL; Schema: erp; Owner: postgres
--

GRANT ALL ON TABLE erp.audit_trail TO erp_app;


--
-- Name: SEQUENCE audit_trail_audit_id_seq; Type: ACL; Schema: erp; Owner: postgres
--

GRANT ALL ON SEQUENCE erp.audit_trail_audit_id_seq TO erp_app;


--
-- Name: TABLE batch_cost_detail; Type: ACL; Schema: erp; Owner: postgres
--

GRANT ALL ON TABLE erp.batch_cost_detail TO erp_app;


--
-- Name: SEQUENCE batch_cost_detail_batch_cost_id_seq; Type: ACL; Schema: erp; Owner: postgres
--

GRANT ALL ON SEQUENCE erp.batch_cost_detail_batch_cost_id_seq TO erp_app;


--
-- Name: TABLE bom; Type: ACL; Schema: erp; Owner: postgres
--

GRANT ALL ON TABLE erp.bom TO erp_app;


--
-- Name: SEQUENCE bom_bom_key_seq; Type: ACL; Schema: erp; Owner: postgres
--

GRANT ALL ON SEQUENCE erp.bom_bom_key_seq TO erp_app;


--
-- Name: TABLE bom_component; Type: ACL; Schema: erp; Owner: postgres
--

GRANT ALL ON TABLE erp.bom_component TO erp_app;


--
-- Name: SEQUENCE bom_component_bom_component_key_seq; Type: ACL; Schema: erp; Owner: postgres
--

GRANT ALL ON SEQUENCE erp.bom_component_bom_component_key_seq TO erp_app;


--
-- Name: TABLE chart_of_accounts; Type: ACL; Schema: erp; Owner: postgres
--

GRANT ALL ON TABLE erp.chart_of_accounts TO erp_app;


--
-- Name: SEQUENCE chart_of_accounts_account_key_seq; Type: ACL; Schema: erp; Owner: postgres
--

GRANT ALL ON SEQUENCE erp.chart_of_accounts_account_key_seq TO erp_app;


--
-- Name: TABLE crm_activity; Type: ACL; Schema: erp; Owner: postgres
--

GRANT ALL ON TABLE erp.crm_activity TO erp_app;


--
-- Name: SEQUENCE crm_activity_activity_id_seq; Type: ACL; Schema: erp; Owner: postgres
--

GRANT ALL ON SEQUENCE erp.crm_activity_activity_id_seq TO erp_app;


--
-- Name: TABLE crm_lead; Type: ACL; Schema: erp; Owner: postgres
--

GRANT ALL ON TABLE erp.crm_lead TO erp_app;


--
-- Name: SEQUENCE crm_lead_lead_id_seq; Type: ACL; Schema: erp; Owner: postgres
--

GRANT ALL ON SEQUENCE erp.crm_lead_lead_id_seq TO erp_app;


--
-- Name: TABLE delivery_note; Type: ACL; Schema: erp; Owner: postgres
--

GRANT ALL ON TABLE erp.delivery_note TO erp_app;


--
-- Name: SEQUENCE delivery_note_dn_id_seq; Type: ACL; Schema: erp; Owner: postgres
--

GRANT ALL ON SEQUENCE erp.delivery_note_dn_id_seq TO erp_app;


--
-- Name: TABLE delivery_note_line; Type: ACL; Schema: erp; Owner: postgres
--

GRANT ALL ON TABLE erp.delivery_note_line TO erp_app;


--
-- Name: SEQUENCE delivery_note_line_dn_line_id_seq; Type: ACL; Schema: erp; Owner: postgres
--

GRANT ALL ON SEQUENCE erp.delivery_note_line_dn_line_id_seq TO erp_app;


--
-- Name: TABLE dim_batch; Type: ACL; Schema: erp; Owner: postgres
--

GRANT ALL ON TABLE erp.dim_batch TO erp_app;


--
-- Name: SEQUENCE dim_batch_batch_key_seq; Type: ACL; Schema: erp; Owner: postgres
--

GRANT ALL ON SEQUENCE erp.dim_batch_batch_key_seq TO erp_app;


--
-- Name: TABLE dim_company; Type: ACL; Schema: erp; Owner: postgres
--

GRANT ALL ON TABLE erp.dim_company TO erp_app;


--
-- Name: SEQUENCE dim_company_company_key_seq; Type: ACL; Schema: erp; Owner: postgres
--

GRANT ALL ON SEQUENCE erp.dim_company_company_key_seq TO erp_app;


--
-- Name: TABLE dim_cost_center; Type: ACL; Schema: erp; Owner: postgres
--

GRANT ALL ON TABLE erp.dim_cost_center TO erp_app;


--
-- Name: SEQUENCE dim_cost_center_cost_center_key_seq; Type: ACL; Schema: erp; Owner: postgres
--

GRANT ALL ON SEQUENCE erp.dim_cost_center_cost_center_key_seq TO erp_app;


--
-- Name: TABLE dim_currency; Type: ACL; Schema: erp; Owner: postgres
--

GRANT ALL ON TABLE erp.dim_currency TO erp_app;


--
-- Name: TABLE dim_item; Type: ACL; Schema: erp; Owner: postgres
--

GRANT ALL ON TABLE erp.dim_item TO erp_app;


--
-- Name: SEQUENCE dim_item_item_key_seq; Type: ACL; Schema: erp; Owner: postgres
--

GRANT ALL ON SEQUENCE erp.dim_item_item_key_seq TO erp_app;


--
-- Name: TABLE dim_tax_code; Type: ACL; Schema: erp; Owner: postgres
--

GRANT ALL ON TABLE erp.dim_tax_code TO erp_app;


--
-- Name: SEQUENCE dim_tax_code_tax_key_seq; Type: ACL; Schema: erp; Owner: postgres
--

GRANT ALL ON SEQUENCE erp.dim_tax_code_tax_key_seq TO erp_app;


--
-- Name: TABLE document_approval_history; Type: ACL; Schema: erp; Owner: postgres
--

GRANT ALL ON TABLE erp.document_approval_history TO erp_app;


--
-- Name: SEQUENCE document_approval_history_approval_id_seq; Type: ACL; Schema: erp; Owner: postgres
--

GRANT ALL ON SEQUENCE erp.document_approval_history_approval_id_seq TO erp_app;


--
-- Name: TABLE document_workflow_instance; Type: ACL; Schema: erp; Owner: postgres
--

GRANT ALL ON TABLE erp.document_workflow_instance TO erp_app;


--
-- Name: SEQUENCE document_workflow_instance_instance_id_seq; Type: ACL; Schema: erp; Owner: postgres
--

GRANT ALL ON SEQUENCE erp.document_workflow_instance_instance_id_seq TO erp_app;


--
-- Name: TABLE employee; Type: ACL; Schema: erp; Owner: postgres
--

GRANT ALL ON TABLE erp.employee TO erp_app;


--
-- Name: SEQUENCE employee_employee_id_seq; Type: ACL; Schema: erp; Owner: postgres
--

GRANT ALL ON SEQUENCE erp.employee_employee_id_seq TO erp_app;


--
-- Name: TABLE fiscal_period; Type: ACL; Schema: erp; Owner: postgres
--

GRANT ALL ON TABLE erp.fiscal_period TO erp_app;


--
-- Name: SEQUENCE fiscal_period_period_key_seq; Type: ACL; Schema: erp; Owner: postgres
--

GRANT ALL ON SEQUENCE erp.fiscal_period_period_key_seq TO erp_app;


--
-- Name: TABLE fixed_asset; Type: ACL; Schema: erp; Owner: postgres
--

GRANT ALL ON TABLE erp.fixed_asset TO erp_app;


--
-- Name: TABLE fixed_asset_depreciation_line; Type: ACL; Schema: erp; Owner: postgres
--

GRANT ALL ON TABLE erp.fixed_asset_depreciation_line TO erp_app;


--
-- Name: SEQUENCE fixed_asset_depreciation_line_dep_line_id_seq; Type: ACL; Schema: erp; Owner: postgres
--

GRANT ALL ON SEQUENCE erp.fixed_asset_depreciation_line_dep_line_id_seq TO erp_app;


--
-- Name: TABLE fixed_asset_depreciation_run; Type: ACL; Schema: erp; Owner: postgres
--

GRANT ALL ON TABLE erp.fixed_asset_depreciation_run TO erp_app;


--
-- Name: SEQUENCE fixed_asset_depreciation_run_dep_run_id_seq; Type: ACL; Schema: erp; Owner: postgres
--

GRANT ALL ON SEQUENCE erp.fixed_asset_depreciation_run_dep_run_id_seq TO erp_app;


--
-- Name: SEQUENCE fixed_asset_fixed_asset_key_seq; Type: ACL; Schema: erp; Owner: postgres
--

GRANT ALL ON SEQUENCE erp.fixed_asset_fixed_asset_key_seq TO erp_app;


--
-- Name: TABLE gl_journal; Type: ACL; Schema: erp; Owner: postgres
--

GRANT ALL ON TABLE erp.gl_journal TO erp_app;


--
-- Name: SEQUENCE gl_journal_gl_id_seq; Type: ACL; Schema: erp; Owner: postgres
--

GRANT ALL ON SEQUENCE erp.gl_journal_gl_id_seq TO erp_app;


--
-- Name: TABLE gl_line; Type: ACL; Schema: erp; Owner: postgres
--

GRANT ALL ON TABLE erp.gl_line TO erp_app;


--
-- Name: SEQUENCE gl_line_gl_line_id_seq; Type: ACL; Schema: erp; Owner: postgres
--

GRANT ALL ON SEQUENCE erp.gl_line_gl_line_id_seq TO erp_app;


--
-- Name: TABLE inventory_balance; Type: ACL; Schema: erp; Owner: postgres
--

GRANT ALL ON TABLE erp.inventory_balance TO erp_app;


--
-- Name: SEQUENCE inventory_balance_balance_id_seq; Type: ACL; Schema: erp; Owner: postgres
--

GRANT ALL ON SEQUENCE erp.inventory_balance_balance_id_seq TO erp_app;


--
-- Name: TABLE inventory_transaction; Type: ACL; Schema: erp; Owner: postgres
--

GRANT ALL ON TABLE erp.inventory_transaction TO erp_app;


--
-- Name: SEQUENCE inventory_transaction_inv_txn_id_seq; Type: ACL; Schema: erp; Owner: postgres
--

GRANT ALL ON SEQUENCE erp.inventory_transaction_inv_txn_id_seq TO erp_app;


--
-- Name: TABLE invoice; Type: ACL; Schema: erp; Owner: postgres
--

GRANT ALL ON TABLE erp.invoice TO erp_app;


--
-- Name: TABLE invoice_line; Type: ACL; Schema: erp; Owner: postgres
--

GRANT ALL ON TABLE erp.invoice_line TO erp_app;


--
-- Name: SEQUENCE invoice_line_line_id_seq; Type: ACL; Schema: erp; Owner: postgres
--

GRANT ALL ON SEQUENCE erp.invoice_line_line_id_seq TO erp_app;


--
-- Name: TABLE lims_test_result; Type: ACL; Schema: erp; Owner: postgres
--

GRANT ALL ON TABLE erp.lims_test_result TO erp_app;


--
-- Name: SEQUENCE lims_test_result_test_id_seq; Type: ACL; Schema: erp; Owner: postgres
--

GRANT ALL ON SEQUENCE erp.lims_test_result_test_id_seq TO erp_app;


--
-- Name: TABLE party; Type: ACL; Schema: erp; Owner: postgres
--

GRANT ALL ON TABLE erp.party TO erp_app;


--
-- Name: SEQUENCE party_party_key_seq; Type: ACL; Schema: erp; Owner: postgres
--

GRANT ALL ON SEQUENCE erp.party_party_key_seq TO erp_app;


--
-- Name: TABLE payment; Type: ACL; Schema: erp; Owner: postgres
--

GRANT ALL ON TABLE erp.payment TO erp_app;


--
-- Name: TABLE payment_allocation; Type: ACL; Schema: erp; Owner: postgres
--

GRANT ALL ON TABLE erp.payment_allocation TO erp_app;


--
-- Name: SEQUENCE payment_allocation_allocation_id_seq; Type: ACL; Schema: erp; Owner: postgres
--

GRANT ALL ON SEQUENCE erp.payment_allocation_allocation_id_seq TO erp_app;


--
-- Name: SEQUENCE payment_payment_id_seq; Type: ACL; Schema: erp; Owner: postgres
--

GRANT ALL ON SEQUENCE erp.payment_payment_id_seq TO erp_app;


--
-- Name: TABLE payroll_component_line; Type: ACL; Schema: erp; Owner: postgres
--

GRANT ALL ON TABLE erp.payroll_component_line TO erp_app;


--
-- Name: SEQUENCE payroll_component_line_component_line_id_seq; Type: ACL; Schema: erp; Owner: postgres
--

GRANT ALL ON SEQUENCE erp.payroll_component_line_component_line_id_seq TO erp_app;


--
-- Name: TABLE payroll_component_type; Type: ACL; Schema: erp; Owner: postgres
--

GRANT ALL ON TABLE erp.payroll_component_type TO erp_app;


--
-- Name: SEQUENCE payroll_component_type_component_type_id_seq; Type: ACL; Schema: erp; Owner: postgres
--

GRANT ALL ON SEQUENCE erp.payroll_component_type_component_type_id_seq TO erp_app;


--
-- Name: TABLE payroll_entry; Type: ACL; Schema: erp; Owner: postgres
--

GRANT ALL ON TABLE erp.payroll_entry TO erp_app;


--
-- Name: SEQUENCE payroll_entry_pe_id_seq; Type: ACL; Schema: erp; Owner: postgres
--

GRANT ALL ON SEQUENCE erp.payroll_entry_pe_id_seq TO erp_app;


--
-- Name: TABLE payroll_run; Type: ACL; Schema: erp; Owner: postgres
--

GRANT ALL ON TABLE erp.payroll_run TO erp_app;


--
-- Name: SEQUENCE payroll_run_payroll_run_id_seq; Type: ACL; Schema: erp; Owner: postgres
--

GRANT ALL ON SEQUENCE erp.payroll_run_payroll_run_id_seq TO erp_app;


--
-- Name: TABLE production_batch; Type: ACL; Schema: erp; Owner: postgres
--

GRANT ALL ON TABLE erp.production_batch TO erp_app;


--
-- Name: SEQUENCE production_batch_prod_batch_key_seq; Type: ACL; Schema: erp; Owner: postgres
--

GRANT ALL ON SEQUENCE erp.production_batch_prod_batch_key_seq TO erp_app;


--
-- Name: TABLE project_billing; Type: ACL; Schema: erp; Owner: postgres
--

GRANT ALL ON TABLE erp.project_billing TO erp_app;


--
-- Name: SEQUENCE project_billing_billing_id_seq; Type: ACL; Schema: erp; Owner: postgres
--

GRANT ALL ON SEQUENCE erp.project_billing_billing_id_seq TO erp_app;


--
-- Name: TABLE project_job; Type: ACL; Schema: erp; Owner: postgres
--

GRANT ALL ON TABLE erp.project_job TO erp_app;


--
-- Name: TABLE project_job_budget; Type: ACL; Schema: erp; Owner: postgres
--

GRANT ALL ON TABLE erp.project_job_budget TO erp_app;


--
-- Name: SEQUENCE project_job_budget_budget_id_seq; Type: ACL; Schema: erp; Owner: postgres
--

GRANT ALL ON SEQUENCE erp.project_job_budget_budget_id_seq TO erp_app;


--
-- Name: SEQUENCE project_job_project_job_id_seq; Type: ACL; Schema: erp; Owner: postgres
--

GRANT ALL ON SEQUENCE erp.project_job_project_job_id_seq TO erp_app;


--
-- Name: TABLE project_retention; Type: ACL; Schema: erp; Owner: postgres
--

GRANT ALL ON TABLE erp.project_retention TO erp_app;


--
-- Name: SEQUENCE project_retention_retention_id_seq; Type: ACL; Schema: erp; Owner: postgres
--

GRANT ALL ON SEQUENCE erp.project_retention_retention_id_seq TO erp_app;


--
-- Name: TABLE purchase_order; Type: ACL; Schema: erp; Owner: postgres
--

GRANT ALL ON TABLE erp.purchase_order TO erp_app;


--
-- Name: TABLE purchase_order_line; Type: ACL; Schema: erp; Owner: postgres
--

GRANT ALL ON TABLE erp.purchase_order_line TO erp_app;


--
-- Name: SEQUENCE purchase_order_line_po_line_id_seq; Type: ACL; Schema: erp; Owner: postgres
--

GRANT ALL ON SEQUENCE erp.purchase_order_line_po_line_id_seq TO erp_app;


--
-- Name: SEQUENCE purchase_order_po_id_seq; Type: ACL; Schema: erp; Owner: postgres
--

GRANT ALL ON SEQUENCE erp.purchase_order_po_id_seq TO erp_app;


--
-- Name: TABLE role_permission; Type: ACL; Schema: erp; Owner: postgres
--

GRANT ALL ON TABLE erp.role_permission TO erp_app;


--
-- Name: SEQUENCE role_permission_permission_key_seq; Type: ACL; Schema: erp; Owner: postgres
--

GRANT ALL ON SEQUENCE erp.role_permission_permission_key_seq TO erp_app;


--
-- Name: TABLE routing; Type: ACL; Schema: erp; Owner: postgres
--

GRANT ALL ON TABLE erp.routing TO erp_app;


--
-- Name: SEQUENCE routing_routing_key_seq; Type: ACL; Schema: erp; Owner: postgres
--

GRANT ALL ON SEQUENCE erp.routing_routing_key_seq TO erp_app;


--
-- Name: TABLE sales_order; Type: ACL; Schema: erp; Owner: postgres
--

GRANT ALL ON TABLE erp.sales_order TO erp_app;


--
-- Name: TABLE sales_order_line; Type: ACL; Schema: erp; Owner: postgres
--

GRANT ALL ON TABLE erp.sales_order_line TO erp_app;


--
-- Name: SEQUENCE sales_order_line_so_line_id_seq; Type: ACL; Schema: erp; Owner: postgres
--

GRANT ALL ON SEQUENCE erp.sales_order_line_so_line_id_seq TO erp_app;


--
-- Name: SEQUENCE sales_order_so_id_seq; Type: ACL; Schema: erp; Owner: postgres
--

GRANT ALL ON SEQUENCE erp.sales_order_so_id_seq TO erp_app;


--
-- Name: TABLE tax_transaction; Type: ACL; Schema: erp; Owner: postgres
--

GRANT ALL ON TABLE erp.tax_transaction TO erp_app;


--
-- Name: SEQUENCE tax_transaction_tax_txn_id_seq; Type: ACL; Schema: erp; Owner: postgres
--

GRANT ALL ON SEQUENCE erp.tax_transaction_tax_txn_id_seq TO erp_app;


--
-- Name: TABLE user_role; Type: ACL; Schema: erp; Owner: postgres
--

GRANT ALL ON TABLE erp.user_role TO erp_app;


--
-- Name: SEQUENCE user_role_role_key_seq; Type: ACL; Schema: erp; Owner: postgres
--

GRANT ALL ON SEQUENCE erp.user_role_role_key_seq TO erp_app;


--
-- Name: TABLE vw_batch_cost_summary; Type: ACL; Schema: erp; Owner: postgres
--

GRANT ALL ON TABLE erp.vw_batch_cost_summary TO erp_app;


--
-- Name: TABLE vw_project_job_profitability; Type: ACL; Schema: erp; Owner: postgres
--

GRANT ALL ON TABLE erp.vw_project_job_profitability TO erp_app;


--
-- Name: TABLE warehouse; Type: ACL; Schema: erp; Owner: postgres
--

GRANT ALL ON TABLE erp.warehouse TO erp_app;


--
-- Name: TABLE warehouse_bin; Type: ACL; Schema: erp; Owner: postgres
--

GRANT ALL ON TABLE erp.warehouse_bin TO erp_app;


--
-- Name: SEQUENCE warehouse_bin_bin_key_seq; Type: ACL; Schema: erp; Owner: postgres
--

GRANT ALL ON SEQUENCE erp.warehouse_bin_bin_key_seq TO erp_app;


--
-- Name: SEQUENCE warehouse_warehouse_key_seq; Type: ACL; Schema: erp; Owner: postgres
--

GRANT ALL ON SEQUENCE erp.warehouse_warehouse_key_seq TO erp_app;


--
-- Name: TABLE withholding_tax_setup; Type: ACL; Schema: erp; Owner: postgres
--

GRANT ALL ON TABLE erp.withholding_tax_setup TO erp_app;


--
-- Name: SEQUENCE withholding_tax_setup_wht_id_seq; Type: ACL; Schema: erp; Owner: postgres
--

GRANT ALL ON SEQUENCE erp.withholding_tax_setup_wht_id_seq TO erp_app;


--
-- Name: TABLE withholding_tax_transaction; Type: ACL; Schema: erp; Owner: postgres
--

GRANT ALL ON TABLE erp.withholding_tax_transaction TO erp_app;


--
-- Name: SEQUENCE withholding_tax_transaction_wht_txn_id_seq; Type: ACL; Schema: erp; Owner: postgres
--

GRANT ALL ON SEQUENCE erp.withholding_tax_transaction_wht_txn_id_seq TO erp_app;


--
-- Name: TABLE workflow_definition; Type: ACL; Schema: erp; Owner: postgres
--

GRANT ALL ON TABLE erp.workflow_definition TO erp_app;


--
-- Name: SEQUENCE workflow_definition_workflow_id_seq; Type: ACL; Schema: erp; Owner: postgres
--

GRANT ALL ON SEQUENCE erp.workflow_definition_workflow_id_seq TO erp_app;


--
-- Name: TABLE workflow_step; Type: ACL; Schema: erp; Owner: postgres
--

GRANT ALL ON TABLE erp.workflow_step TO erp_app;


--
-- Name: SEQUENCE workflow_step_step_id_seq; Type: ACL; Schema: erp; Owner: postgres
--

GRANT ALL ON SEQUENCE erp.workflow_step_step_id_seq TO erp_app;


--
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: erp; Owner: postgres
--

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA erp GRANT ALL ON SEQUENCES TO erp_app;


--
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: erp; Owner: postgres
--

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA erp GRANT ALL ON TABLES TO erp_app;


--
-- PostgreSQL database dump complete
--

\unrestrict AS2s41TZWhHQceDJpJgBQaLYGV9EBi2na4uO4k6hVyCZ3XUKMq444F1EbEuBR2m


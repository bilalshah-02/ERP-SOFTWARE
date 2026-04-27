# backend/erp_api/validators.py
"""
ERP VALIDATION UTILITIES - PRODUCTION READY

Centralized validation functions used across all modules:
1. Document number uniqueness
2. GL entry balance validation
3. Period open/closed checks
4. Referential integrity
5. Business rule validation
"""

from decimal import Decimal
from django.core.exceptions import ValidationError
from django.db.models import Sum, Q
from datetime import datetime, date
from . import models


def model_by_table(table: str):
    """Helper to get model by table name"""
    for name in dir(models):
        cls = getattr(models, name)
        if hasattr(cls, "_meta") and getattr(cls._meta, "db_table", None) == table:
            return cls
    raise LookupError(f"Model for table '{table}' not found in erp_api.models")


# Get models
FiscalPeriod = model_by_table("fiscal_period")
ChartOfAccounts = model_by_table("chart_of_accounts")
GlJournal = model_by_table("gl_journal")
GlLine = model_by_table("gl_line")
PurchaseOrder = model_by_table("purchase_order")
SalesOrder = model_by_table("sales_order")
Invoice = model_by_table("invoice")
DimItem = model_by_table("dim_item")
Party = model_by_table("party")
Warehouse = model_by_table("warehouse")


# ==================== DOCUMENT NUMBER VALIDATION ====================

def validate_unique_po_number(company_key, po_number, exclude_id=None):
    """
    Ensure PO number is unique within company.
    
    Args:
        company_key: Company ID
        po_number: PO number to check
        exclude_id: PO ID to exclude (for updates)
    
    Raises:
        ValidationError: If PO number already exists
    """
    query = PurchaseOrder.objects.filter(
        company_key=company_key,
        po_number=po_number
    )
    
    if exclude_id:
        query = query.exclude(po_id=exclude_id)
    
    if query.exists():
        raise ValidationError(
            f"Purchase Order number '{po_number}' already exists for this company"
        )
    
    return True


def validate_unique_so_number(company_key, so_number, exclude_id=None):
    """Ensure SO number is unique within company"""
    query = SalesOrder.objects.filter(
        company_key=company_key,
        so_number=so_number
    )
    
    if exclude_id:
        query = query.exclude(so_id=exclude_id)
    
    if query.exists():
        raise ValidationError(
            f"Sales Order number '{so_number}' already exists for this company"
        )
    
    return True


def validate_unique_invoice_number(company_key, invoice_number, invoice_type, exclude_id=None):
    """Ensure invoice number is unique within company and type"""
    query = Invoice.objects.filter(
        company_key=company_key,
        invoice_number=invoice_number,
        invoice_type=invoice_type
    )
    
    if exclude_id:
        query = query.exclude(invoice_id=exclude_id)
    
    if query.exists():
        raise ValidationError(
            f"{invoice_type} Invoice number '{invoice_number}' already exists for this company"
        )
    
    return True


def validate_unique_journal_number(company_key, journal_number, exclude_id=None):
    """Ensure journal number is unique within company"""
    query = GlJournal.objects.filter(
        company_key=company_key,
        journal_number=journal_number
    )
    
    if exclude_id:
        query = query.exclude(gl_id=exclude_id)
    
    if query.exists():
        raise ValidationError(
            f"Journal number '{journal_number}' already exists for this company"
        )
    
    return True


# ==================== GL VALIDATION ====================

def validate_gl_balance(lines_data):
    """
    Validate that GL entry is balanced (total debit = total credit).
    
    Args:
        lines_data: List of dicts with 'debit' and 'credit' keys
    
    Raises:
        ValidationError: If debits don't equal credits
    """
    total_debit = Decimal('0')
    total_credit = Decimal('0')
    
    for line in lines_data:
        total_debit += Decimal(str(line.get('debit', 0) or 0))
        total_credit += Decimal(str(line.get('credit', 0) or 0))
    
    # Allow for small rounding differences (1 cent)
    difference = abs(total_debit - total_credit)
    
    if difference > Decimal('0.01'):
        raise ValidationError(
            f"GL entry is not balanced. Debit: {total_debit}, Credit: {total_credit}, "
            f"Difference: {difference}"
        )
    
    return True


def validate_account_is_posting(account_key):
    """
    Validate that account is a posting account (can have transactions).
    
    Args:
        account_key: Account ID
    
    Raises:
        ValidationError: If account is not a posting account
    """
    account = ChartOfAccounts.objects.filter(account_key=account_key).first()
    
    if not account:
        raise ValidationError(f"Account {account_key} does not exist")
    
    if not account.is_posting:
        raise ValidationError(
            f"Account '{account.account_code} - {account.account_name}' is not a posting account. "
            f"Transactions can only be posted to posting accounts."
        )
    
    return True


def validate_account_is_active(account_key):
    """Validate that account is active"""
    account = ChartOfAccounts.objects.filter(account_key=account_key).first()
    
    if not account:
        raise ValidationError(f"Account {account_key} does not exist")
    
    if not account.is_active:
        raise ValidationError(
            f"Account '{account.account_code} - {account.account_name}' is inactive. "
            f"Transactions can only be posted to active accounts."
        )
    
    return True


def validate_gl_line(account_key, debit, credit):
    """
    Validate a single GL line.
    
    Checks:
    - Account exists
    - Account is posting account
    - Account is active
    - Either debit or credit (not both)
    """
    # Validate account
    validate_account_is_posting(account_key)
    validate_account_is_active(account_key)
    
    # Validate debit/credit
    debit = Decimal(str(debit or 0))
    credit = Decimal(str(credit or 0))
    
    if debit > 0 and credit > 0:
        raise ValidationError(
            "GL line cannot have both debit and credit amounts. "
            "Use debit OR credit, not both."
        )
    
    if debit == 0 and credit == 0:
        raise ValidationError("GL line must have either debit or credit amount")
    
    return True


# ==================== PERIOD VALIDATION ====================

def get_open_period(company_key, transaction_date):
    """
    Get the open fiscal period for a transaction date.
    
    Args:
        company_key: Company ID
        transaction_date: Date of transaction
    
    Returns:
        FiscalPeriod object
    
    Raises:
        ValidationError: If no open period exists for date
    """
    # Convert to date if datetime
    if isinstance(transaction_date, datetime):
        transaction_date = transaction_date.date()
    elif isinstance(transaction_date, str):
        transaction_date = datetime.strptime(transaction_date, '%Y-%m-%d').date()
    
    # Find period that contains this date
    period = FiscalPeriod.objects.filter(
        company_key=company_key,
        start_date__lte=transaction_date,
        end_date__gte=transaction_date
    ).first()
    
    if not period:
        raise ValidationError(
            f"No fiscal period found for date {transaction_date}. "
            f"Please create a fiscal period that includes this date."
        )
    
    # Check if period is closed
    if hasattr(period, 'is_closed') and period.is_closed:
        raise ValidationError(
            f"Period {period.period_code} is closed. "
            f"Cannot post transactions to closed periods."
        )
    
    return period


def validate_period_is_open(company_key, transaction_date):
    """
    Validate that the period for this date is open.
    
    Raises:
        ValidationError: If period is closed or doesn't exist
    """
    get_open_period(company_key, transaction_date)
    return True


def validate_date_not_future(transaction_date, field_name="Transaction date"):
    """Validate that date is not in the future"""
    # Convert to date if datetime
    if isinstance(transaction_date, datetime):
        transaction_date = transaction_date.date()
    elif isinstance(transaction_date, str):
        transaction_date = datetime.strptime(transaction_date, '%Y-%m-%d').date()
    
    today = date.today()
    
    if transaction_date > today:
        raise ValidationError(
            f"{field_name} cannot be in the future. "
            f"Date: {transaction_date}, Today: {today}"
        )
    
    return True


# ==================== REFERENTIAL INTEGRITY ====================

def validate_item_exists(item_key):
    """Validate that item exists"""
    if not DimItem.objects.filter(item_key=item_key).exists():
        raise ValidationError(f"Item {item_key} does not exist")
    return True


def validate_item_is_active(item_key):
    """Validate that item is active"""
    item = DimItem.objects.filter(item_key=item_key).first()
    
    if not item:
        raise ValidationError(f"Item {item_key} does not exist")
    
    if not item.is_active:
        raise ValidationError(
            f"Item '{item.item_code} - {item.name}' is inactive. "
            f"Transactions can only be created for active items."
        )
    
    return True


def validate_party_exists(party_key):
    """Validate that customer/vendor exists"""
    if not Party.objects.filter(party_key=party_key).exists():
        raise ValidationError(f"Customer/Vendor {party_key} does not exist")
    return True


def validate_warehouse_exists(warehouse_key):
    """Validate that warehouse exists"""
    if not Warehouse.objects.filter(warehouse_key=warehouse_key).exists():
        raise ValidationError(f"Warehouse {warehouse_key} does not exist")
    return True


def validate_company_exists(company_key):
    """Validate that company exists"""
    Company = model_by_table("dim_company")
    if not Company.objects.filter(company_key=company_key).exists():
        raise ValidationError(f"Company {company_key} does not exist")
    return True


# ==================== BUSINESS RULE VALIDATION ====================

def validate_positive_amount(amount, field_name="Amount"):
    """Validate that amount is positive"""
    if Decimal(str(amount)) <= 0:
        raise ValidationError(f"{field_name} must be greater than zero")
    return True


def validate_positive_quantity(quantity, field_name="Quantity"):
    """Validate that quantity is positive"""
    if Decimal(str(quantity)) <= 0:
        raise ValidationError(f"{field_name} must be greater than zero")
    return True


def validate_email_format(email):
    """Basic email validation"""
    if email and '@' not in email:
        raise ValidationError(f"Invalid email format: {email}")
    return True


def validate_percentage(value, field_name="Percentage"):
    """Validate that value is between 0 and 100"""
    value = Decimal(str(value))
    if value < 0 or value > 100:
        raise ValidationError(f"{field_name} must be between 0 and 100")
    return True


# ==================== DOCUMENT STATE VALIDATION ====================

def validate_document_status(current_status, allowed_statuses, action):
    """
    Validate that document is in correct status for action.
    
    Args:
        current_status: Current document status
        allowed_statuses: List of allowed statuses for this action
        action: Description of action being performed
    
    Raises:
        ValidationError: If status not allowed
    """
    if current_status not in allowed_statuses:
        raise ValidationError(
            f"Cannot {action} from status '{current_status}'. "
            f"Allowed statuses: {', '.join(allowed_statuses)}"
        )
    
    return True


def validate_can_edit(document_status):
    """Validate that document can be edited (must be DRAFT)"""
    if document_status != 'DRAFT':
        raise ValidationError(
            f"Cannot edit document with status '{document_status}'. "
            f"Only DRAFT documents can be edited."
        )
    return True


def validate_can_delete(document_status):
    """Validate that document can be deleted (must be DRAFT)"""
    if document_status != 'DRAFT':
        raise ValidationError(
            f"Cannot delete document with status '{document_status}'. "
            f"Only DRAFT documents can be deleted."
        )
    return True


def validate_can_post(document_status):
    """Validate that document can be posted to GL"""
    allowed = ['DRAFT', 'APPROVED']
    if document_status not in allowed:
        raise ValidationError(
            f"Cannot post document with status '{document_status}'. "
            f"Document must be DRAFT or APPROVED to post."
        )
    return True


# ==================== COMPOSITE VALIDATORS ====================

def validate_transaction_complete(company_key, item_key, warehouse_key, 
                                  transaction_date, quantity):
    """
    Complete validation for a transaction.
    
    Validates:
    - Company exists
    - Item exists and is active
    - Warehouse exists
    - Period is open
    - Date not future
    - Quantity positive
    """
    validate_company_exists(company_key)
    validate_item_exists(item_key)
    validate_item_is_active(item_key)
    validate_warehouse_exists(warehouse_key)
    validate_period_is_open(company_key, transaction_date)
    validate_date_not_future(transaction_date)
    validate_positive_quantity(quantity)
    
    return True


def validate_gl_journal_complete(company_key, journal_date, lines):
    """
    Complete validation for GL journal.
    
    Validates:
    - Company exists
    - Period is open
    - Date not future
    - Lines are balanced
    - All accounts valid
    """
    validate_company_exists(company_key)
    validate_period_is_open(company_key, journal_date)
    validate_date_not_future(journal_date)
    validate_gl_balance(lines)
    
    # Validate each line
    for line in lines:
        validate_gl_line(
            line.get('account_key'),
            line.get('debit', 0),
            line.get('credit', 0)
        )
    
    return True
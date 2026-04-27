# backend/erp_api/account_config.py
"""
Account Configuration for GL Posting
Stores default accounts for automatic GL postings

Your Chart of Accounts:
[1] 1100 - Cash (ASSET)
[2] 1200 - Accounts Receivable (ASSET)
[3] 1500 - Inventory (ASSET)
[10] 1600 - Work in Progress (ASSET)
[4] 2100 - Accounts Payable (LIABILITY)
[9] 2200 - GR/IR Clearing (LIABILITY)
[5] 3000 - Owner Equity (EQUITY)
[6] 4000 - Sales Revenue (REVENUE)
[7] 5000 - Cost of Goods Sold (EXPENSE)
[11] 5100 - Inventory Variance (EXPENSE)
[8] 6000 - Operating Expenses (EXPENSE)
"""

from django.core.exceptions import ValidationError


def model_by_table(table: str):
    """Get model class by table name"""
    from . import models
    for name in dir(models):
        cls = getattr(models, name)
        if hasattr(cls, "_meta") and getattr(cls._meta, "db_table", None) == table:
            return cls
    raise LookupError(f"Model for table '{table}' not found")

ACCOUNT_DEFAULTS = {
    1: {
        'inventory_asset': 42,
        'cogs': 43,
        'revenue': 51,
        'accounts_receivable': 44,
        'accounts_payable': 45,
        'cash': 46,
        'grir_clearing': 47,
        'wip': 48,
        'inventory_variance': 49,
        'expense_purchase': 50,
    }
}



def get_default_account(company_key, account_type):
    """
    Get default account for a company and account type
    
    Args:
        company_key: Company ID
        account_type: Type of account (inventory_asset, cogs, etc.)
    
    Returns:
        Account key (int)
    
    Raises:
        ValidationError if account not configured
    """
    ChartOfAccounts = model_by_table("chart_of_accounts")
    
    company_defaults = ACCOUNT_DEFAULTS.get(company_key)
    
    if not company_defaults:
        raise ValidationError(
            f"No account defaults configured for company {company_key}. "
            f"Please configure in account_config.py"
        )
    
    account_key = company_defaults.get(account_type)
    
    if not account_key:
        raise ValidationError(
            f"No default account configured for {account_type} in company {company_key}. "
            f"Please configure in account_config.py"
        )
    
    # Validate account exists and is active
    try:
        account = ChartOfAccounts.objects.get(account_key=account_key)
        if not account.is_active:
            raise ValidationError(
                f"Account {account_key} ({account.account_name}) is inactive"
            )
        if not account.is_posting:
            raise ValidationError(
                f"Account {account_key} ({account.account_name}) is not a posting account"
            )
        return account_key
    except ChartOfAccounts.DoesNotExist:
        raise ValidationError(
            f"Account {account_key} for {account_type} does not exist in Chart of Accounts"
        )


def validate_account_config(company_key):
    """
    Validate that all required accounts are configured for a company
    
    Args:
        company_key: Company ID
    
    Returns:
        dict: {account_type: account_key} if valid
    
    Raises:
        ValidationError if any required account missing
    """
    required_accounts = [
        'inventory_asset',
        'cogs',
        'revenue',
        'accounts_receivable',
        'accounts_payable',
        'cash',
        'grir_clearing',
        'wip',
        'inventory_variance',
    ]
    
    config = {}
    errors = []
    
    for account_type in required_accounts:
        try:
            config[account_type] = get_default_account(company_key, account_type)
        except ValidationError as e:
            errors.append(str(e))
    
    if errors:
        raise ValidationError("\n".join(errors))
    
    return config


def get_account_info(company_key, account_type):
    """
    Get full account information for a given account type
    
    Args:
        company_key: Company ID
        account_type: Type of account
    
    Returns:
        dict with account details
    """
    ChartOfAccounts = model_by_table("chart_of_accounts")
    
    account_key = get_default_account(company_key, account_type)
    account = ChartOfAccounts.objects.get(account_key=account_key)
    
    return {
        'account_key': account.account_key,
        'account_code': account.account_code,
        'account_name': account.account_name,
        'account_type': account.account_type,
    }
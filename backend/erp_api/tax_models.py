# backend/erp_api/tax_models.py - PHASE 6 COMPLETE
"""
✅ PHASE 6: Tax Engine Models and Configuration

Tax system supporting:
- Multiple tax types (VAT, GST, Sales Tax, etc.)
- Tax rates by jurisdiction
- Input tax (recoverable on purchases)
- Output tax (collected on sales)
- Automatic GL posting
- Tax reports

Add these models to your models.py or create as separate migration
"""

from django.db import models
from decimal import Decimal


# ==================== TAX CONFIGURATION MODELS ====================

class TaxType(models.Model):
    """
    Tax Type Configuration
    
    Examples:
    - VAT (Value Added Tax)
    - GST (Goods and Services Tax)
    - Sales Tax
    - Excise Tax
    """
    tax_type_key = models.AutoField(primary_key=True)
    company_key = models.ForeignKey('DimCompany', on_delete=models.CASCADE)
    
    tax_code = models.CharField(max_length=20, unique=True)
    tax_name = models.CharField(max_length=100)
    tax_description = models.TextField(blank=True, null=True)
    
    # Tax characteristics
    is_recoverable = models.BooleanField(
        default=False,
        help_text="Can input tax be recovered? (VAT/GST = Yes, Sales Tax = No)"
    )
    
    # GL Accounts for automatic posting
    output_tax_account = models.ForeignKey(
        'ChartOfAccounts',
        on_delete=models.PROTECT,
        related_name='output_tax_types',
        help_text="Account for tax collected on sales (LIABILITY)"
    )
    
    input_tax_account = models.ForeignKey(
        'ChartOfAccounts',
        on_delete=models.PROTECT,
        related_name='input_tax_types',
        blank=True, null=True,
        help_text="Account for tax paid on purchases (ASSET if recoverable)"
    )
    
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'tax_type'
        
    def __str__(self):
        return f"{self.tax_code} - {self.tax_name}"


class TaxRate(models.Model):
    """
    Tax Rates by Type
    
    Supports:
    - Standard rate (e.g., 15%)
    - Reduced rate (e.g., 5% for essential goods)
    - Zero rate (e.g., exports)
    - Exempt (no tax)
    """
    tax_rate_key = models.AutoField(primary_key=True)
    tax_type = models.ForeignKey(TaxType, on_delete=models.CASCADE)
    
    rate_code = models.CharField(max_length=20)
    rate_name = models.CharField(max_length=100)
    rate_percentage = models.DecimalField(
        max_digits=5, 
        decimal_places=2,
        help_text="Tax rate as percentage (e.g., 15.00 for 15%)"
    )
    
    # Effective dates
    effective_from = models.DateField()
    effective_to = models.DateField(blank=True, null=True)
    
    # Category
    rate_category = models.CharField(
        max_length=20,
        choices=[
            ('STANDARD', 'Standard Rate'),
            ('REDUCED', 'Reduced Rate'),
            ('ZERO', 'Zero Rate'),
            ('EXEMPT', 'Exempt'),
        ],
        default='STANDARD'
    )
    
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'tax_rate'
        unique_together = [['tax_type', 'rate_code']]
        
    def __str__(self):
        return f"{self.rate_code} - {self.rate_percentage}%"


# ==================== SQL MIGRATION ====================

"""
-- Add to your migrations or run directly:

-- Tax Type Table
CREATE TABLE IF NOT EXISTS erp.tax_type (
    tax_type_key SERIAL PRIMARY KEY,
    company_key INTEGER NOT NULL REFERENCES erp.dim_company(company_key),
    tax_code VARCHAR(20) NOT NULL UNIQUE,
    tax_name VARCHAR(100) NOT NULL,
    tax_description TEXT,
    is_recoverable BOOLEAN DEFAULT FALSE,
    output_tax_account INTEGER NOT NULL REFERENCES erp.chart_of_accounts(account_key),
    input_tax_account INTEGER REFERENCES erp.chart_of_accounts(account_key),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tax Rate Table
CREATE TABLE IF NOT EXISTS erp.tax_rate (
    tax_rate_key SERIAL PRIMARY KEY,
    tax_type_key INTEGER NOT NULL REFERENCES erp.tax_type(tax_type_key),
    rate_code VARCHAR(20) NOT NULL,
    rate_name VARCHAR(100) NOT NULL,
    rate_percentage NUMERIC(5,2) NOT NULL,
    effective_from DATE NOT NULL,
    effective_to DATE,
    rate_category VARCHAR(20) DEFAULT 'STANDARD',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(tax_type_key, rate_code)
);

-- Create tax accounts if they don't exist
INSERT INTO erp.chart_of_accounts (company_key, account_code, account_name, account_type, is_posting, is_active)
VALUES 
    (1, '2300', 'Sales Tax Payable', 'LIABILITY', TRUE, TRUE),
    (1, '1700', 'Input Tax Recoverable', 'ASSET', TRUE, TRUE)
ON CONFLICT DO NOTHING;

-- Sample tax configuration
INSERT INTO erp.tax_type (company_key, tax_code, tax_name, is_recoverable, output_tax_account, input_tax_account)
SELECT 
    1,
    'VAT',
    'Value Added Tax',
    TRUE,
    (SELECT account_key FROM erp.chart_of_accounts WHERE account_code = '2300' AND company_key = 1),
    (SELECT account_key FROM erp.chart_of_accounts WHERE account_code = '1700' AND company_key = 1)
WHERE NOT EXISTS (SELECT 1 FROM erp.tax_type WHERE tax_code = 'VAT');

-- Sample tax rates
INSERT INTO erp.tax_rate (tax_type_key, rate_code, rate_name, rate_percentage, effective_from, rate_category)
SELECT 
    (SELECT tax_type_key FROM erp.tax_type WHERE tax_code = 'VAT'),
    'STANDARD',
    'Standard VAT Rate',
    15.00,
    '2024-01-01',
    'STANDARD'
WHERE NOT EXISTS (SELECT 1 FROM erp.tax_rate WHERE rate_code = 'STANDARD');

INSERT INTO erp.tax_rate (tax_type_key, rate_code, rate_name, rate_percentage, effective_from, rate_category)
SELECT 
    (SELECT tax_type_key FROM erp.tax_type WHERE tax_code = 'VAT'),
    'ZERO',
    'Zero-Rated',
    0.00,
    '2024-01-01',
    'ZERO'
WHERE NOT EXISTS (SELECT 1 FROM erp.tax_rate WHERE rate_code = 'ZERO');
"""
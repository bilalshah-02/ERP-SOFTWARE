# backend/erp_api/tax_engine.py - PHASE 6 COMPLETE
"""
✅ PHASE 6: Tax Calculation Engine

Automatic tax calculation for:
- Sales invoices (output tax - collected from customers)
- Purchase invoices (input tax - paid to suppliers)
- Credit notes
- Tax reports

Features:
- Automatic rate lookup by date
- Multiple tax support
- Recoverable vs non-recoverable tax
- GL posting integration
"""

from decimal import Decimal
from datetime import date
from django.core.exceptions import ValidationError


class TaxEngine:
    """
    Tax calculation engine with automatic rate lookup
    """
    
    def __init__(self):
        from . import models
        self.models = models
    
    def calculate_tax(self, 
                     amount: Decimal,
                     tax_rate_key: int,
                     transaction_date: date = None) -> dict:
        """
        Calculate tax amount
        
        Args:
            amount: Base amount (before tax)
            tax_rate_key: Tax rate to apply
            transaction_date: Date for rate lookup (defaults to today)
        
        Returns:
            {
                'tax_rate_key': 1,
                'tax_code': 'STANDARD',
                'tax_percentage': 15.00,
                'base_amount': 1000.00,
                'tax_amount': 150.00,
                'total_amount': 1150.00,
                'is_recoverable': True
            }
        """
        if transaction_date is None:
            transaction_date = date.today()
        
        # Get tax rate
        TaxRate = self._get_model('tax_rate')
        
        try:
            tax_rate = TaxRate.objects.select_related('tax_type').get(
                tax_rate_key=tax_rate_key,
                is_active=True
            )
        except TaxRate.DoesNotExist:
            raise ValidationError(f"Tax rate {tax_rate_key} not found or inactive")
        
        # Validate effective date
        if transaction_date < tax_rate.effective_from:
            raise ValidationError(
                f"Tax rate {tax_rate.rate_code} not yet effective on {transaction_date}"
            )
        
        if tax_rate.effective_to and transaction_date > tax_rate.effective_to:
            raise ValidationError(
                f"Tax rate {tax_rate.rate_code} expired on {tax_rate.effective_to}"
            )
        
        # Calculate tax
        tax_amount = (amount * tax_rate.rate_percentage / 100).quantize(Decimal('0.01'))
        total_amount = amount + tax_amount
        
        return {
            'tax_rate_key': tax_rate.tax_rate_key,
            'tax_type_key': tax_rate.tax_type.tax_type_key,
            'tax_code': tax_rate.rate_code,
            'tax_name': tax_rate.rate_name,
            'tax_percentage': float(tax_rate.rate_percentage),
            'base_amount': float(amount),
            'tax_amount': float(tax_amount),
            'total_amount': float(total_amount),
            'is_recoverable': tax_rate.tax_type.is_recoverable,
            'output_tax_account': tax_rate.tax_type.output_tax_account_id,
            'input_tax_account': tax_rate.tax_type.input_tax_account_id,
        }
    
    def calculate_tax_inclusive(self,
                               total_amount: Decimal,
                               tax_rate_key: int,
                               transaction_date: date = None) -> dict:
        """
        Calculate tax from tax-inclusive amount
        
        If total = $115 and tax = 15%, then:
        - Base = $115 / 1.15 = $100
        - Tax = $115 - $100 = $15
        
        Args:
            total_amount: Total amount (including tax)
            tax_rate_key: Tax rate to apply
            transaction_date: Date for rate lookup
        
        Returns:
            Same format as calculate_tax()
        """
        if transaction_date is None:
            transaction_date = date.today()
        
        # Get tax rate
        TaxRate = self._get_model('tax_rate')
        
        try:
            tax_rate = TaxRate.objects.select_related('tax_type').get(
                tax_rate_key=tax_rate_key,
                is_active=True
            )
        except TaxRate.DoesNotExist:
            raise ValidationError(f"Tax rate {tax_rate_key} not found or inactive")
        
        # Calculate base amount from inclusive total
        divisor = 1 + (tax_rate.rate_percentage / 100)
        base_amount = (total_amount / divisor).quantize(Decimal('0.01'))
        tax_amount = total_amount - base_amount
        
        return {
            'tax_rate_key': tax_rate.tax_rate_key,
            'tax_type_key': tax_rate.tax_type.tax_type_key,
            'tax_code': tax_rate.rate_code,
            'tax_name': tax_rate.rate_name,
            'tax_percentage': float(tax_rate.rate_percentage),
            'base_amount': float(base_amount),
            'tax_amount': float(tax_amount),
            'total_amount': float(total_amount),
            'is_recoverable': tax_rate.tax_type.is_recoverable,
            'output_tax_account': tax_rate.tax_type.output_tax_account_id,
            'input_tax_account': tax_rate.tax_type.input_tax_account_id,
        }
    
    def get_tax_gl_entries(self,
                          tax_calculation: dict,
                          transaction_type: str = 'SALE') -> list:
        """
        Generate GL entries for tax
        
        Args:
            tax_calculation: Result from calculate_tax()
            transaction_type: 'SALE' or 'PURCHASE'
        
        Returns:
            List of GL line dicts for posting
        """
        tax_amount = Decimal(str(tax_calculation['tax_amount']))
        
        if tax_amount == 0:
            return []
        
        if transaction_type == 'SALE':
            # Output tax (collected from customer - LIABILITY)
            return [{
                'account_key': tax_calculation['output_tax_account'],
                'debit': Decimal('0'),
                'credit': tax_amount,
                'description': f"Sales Tax - {tax_calculation['tax_code']}"
            }]
        
        elif transaction_type == 'PURCHASE':
            # Input tax (paid to supplier)
            if tax_calculation['is_recoverable']:
                # Recoverable - ASSET (can claim back)
                return [{
                    'account_key': tax_calculation['input_tax_account'],
                    'debit': tax_amount,
                    'credit': Decimal('0'),
                    'description': f"Input Tax - {tax_calculation['tax_code']}"
                }]
            else:
                # Non-recoverable - add to expense
                return []  # Tax included in expense amount
        
        else:
            raise ValidationError(f"Invalid transaction type: {transaction_type}")
    
    def get_available_tax_rates(self, company_key: int, as_of_date: date = None) -> list:
        """
        Get all active tax rates for a company
        
        Returns list of available tax rates for selection
        """
        if as_of_date is None:
            as_of_date = date.today()
        
        TaxRate = self._get_model('tax_rate')
        
        rates = TaxRate.objects.filter(
            tax_type__company_key=company_key,
            is_active=True,
            effective_from__lte=as_of_date
        ).filter(
            models.Q(effective_to__isnull=True) | 
            models.Q(effective_to__gte=as_of_date)
        ).select_related('tax_type').order_by('rate_percentage')
        
        return [{
            'tax_rate_key': rate.tax_rate_key,
            'tax_code': rate.rate_code,
            'tax_name': rate.rate_name,
            'tax_type': rate.tax_type.tax_name,
            'rate_percentage': float(rate.rate_percentage),
            'is_recoverable': rate.tax_type.is_recoverable
        } for rate in rates]
    
    def _get_model(self, table_name: str):
        """Get model by table name"""
        for name in dir(self.models):
            cls = getattr(self.models, name)
            if hasattr(cls, "_meta") and getattr(cls._meta, "db_table", None) == table_name:
                return cls
        raise LookupError(f"Model for table '{table_name}' not found")


# ==================== TAX REPORTING ====================

class TaxReporter:
    """
    Tax reporting and analysis
    """
    
    def __init__(self):
        from . import models
        self.models = models
    
    def generate_tax_report(self,
                          company_key: int,
                          start_date: date,
                          end_date: date,
                          tax_type_key: int = None) -> dict:
        """
        Generate tax report (VAT return style)
        
        Returns:
        {
            'output_tax': {  # Tax collected on sales
                'total_sales': 100000,
                'tax_amount': 15000
            },
            'input_tax': {  # Tax paid on purchases
                'total_purchases': 60000,
                'tax_amount': 9000
            },
            'net_tax_payable': 6000  # Amount owed to tax authority
        }
        """
        GlLine = self._get_model('gl_line')
        TaxType = self._get_model('tax_type')
        
        # Get tax type
        if tax_type_key:
            tax_types = [TaxType.objects.get(tax_type_key=tax_type_key)]
        else:
            tax_types = TaxType.objects.filter(company_key=company_key, is_active=True)
        
        report = {
            'company_key': company_key,
            'period': {
                'start_date': str(start_date),
                'end_date': str(end_date)
            },
            'tax_types': []
        }
        
        for tax_type in tax_types:
            # Get output tax (sales)
            output_tax = GlLine.objects.filter(
                gl__company_key=company_key,
                gl__journal_date__gte=start_date,
                gl__journal_date__lte=end_date,
                gl__status='POSTED',
                account_key=tax_type.output_tax_account
            ).aggregate(
                total=models.Sum('credit')
            )['total'] or Decimal('0')
            
            # Get input tax (purchases)
            input_tax = Decimal('0')
            if tax_type.input_tax_account:
                input_tax = GlLine.objects.filter(
                    gl__company_key=company_key,
                    gl__journal_date__gte=start_date,
                    gl__journal_date__lte=end_date,
                    gl__status='POSTED',
                    account_key=tax_type.input_tax_account
                ).aggregate(
                    total=models.Sum('debit')
                )['total'] or Decimal('0')
            
            net_tax = output_tax - input_tax
            
            report['tax_types'].append({
                'tax_code': tax_type.tax_code,
                'tax_name': tax_type.tax_name,
                'output_tax': float(output_tax),
                'input_tax': float(input_tax),
                'net_tax_payable': float(net_tax),
                'is_recoverable': tax_type.is_recoverable
            })
        
        # Calculate totals
        report['totals'] = {
            'total_output_tax': sum(t['output_tax'] for t in report['tax_types']),
            'total_input_tax': sum(t['input_tax'] for t in report['tax_types']),
            'total_net_tax_payable': sum(t['net_tax_payable'] for t in report['tax_types'])
        }
        
        return report
    
    def _get_model(self, table_name: str):
        """Get model by table name"""
        for name in dir(self.models):
            cls = getattr(self.models, name)
            if hasattr(cls, "_meta") and getattr(cls._meta, "db_table", None) == table_name:
                return cls
        raise LookupError(f"Model for table '{table_name}' not found")


# ==================== GLOBAL INSTANCES ====================

tax_engine = TaxEngine()
tax_reporter = TaxReporter()
# backend/erp_api/serializers.py - FIXED VERSION
from rest_framework import serializers
from django.db import transaction
from . import models


def model_by_table(table: str):
    for name in dir(models):
        cls = getattr(models, name)
        if hasattr(cls, "_meta") and getattr(cls._meta, "db_table", None) == table:
            return cls
    raise LookupError(f"Model for table '{table}' not found in erp_api.models")


# Core models
DimCompany = model_by_table("dim_company")
DimItem = model_by_table("dim_item")
Party = model_by_table("party")
ProductCosting = model_by_table("product_costing")

GlJournal = model_by_table("gl_journal")
GlLine = model_by_table("gl_line")

ChartOfAccounts = model_by_table("chart_of_accounts")
DimCostCenter = model_by_table("dim_cost_center")
ProjectJob = model_by_table("project_job")
FiscalPeriod = model_by_table("fiscal_period")


# ==================== EXISTING SERIALIZERS ====================

class CompanySerializer(serializers.ModelSerializer):
    class Meta:
        model = DimCompany
        fields = "__all__"


class ProductCostingSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductCosting
        fields = "__all__"
        read_only_fields = ("total_cost", "product_costing_id")


# ==================== LOOKUP SERIALIZERS ====================

class LookupAccountSerializer(serializers.ModelSerializer):
    class Meta:
        model = ChartOfAccounts
        fields = ("account_key", "account_code", "account_name", "account_type", "is_posting", "is_active")


class LookupCostCenterSerializer(serializers.ModelSerializer):
    class Meta:
        model = DimCostCenter
        fields = ("cost_center_key", "code", "name", "cost_center_type", "is_active")


class LookupProjectSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProjectJob
        fields = ("project_job_id", "project_code", "name", "company_key")


# ==================== VENDOR SERIALIZERS (NEW) ====================

class VendorSerializer(serializers.ModelSerializer):
    """Vendor = Party with party_type='SUPPLIER'"""
    
    class Meta:
        model = Party
        fields = (
            'party_key', 'party_code', 'name', 'party_type',
            'tax_id', 'phone', 'email', 
            'address_line1', 'address_line2', 'city', 'country',
            'created_at'
        )
        read_only_fields = ('party_key', 'created_at', 'party_type')  # ← Make party_type read-only
    
    def create(self, validated_data):
        validated_data['party_type'] = 'SUPPLIER'
        return super().create(validated_data)
    
    def update(self, instance, validated_data):
        validated_data['party_type'] = 'SUPPLIER'
        return super().update(instance, validated_data)

# ==================== ITEM SERIALIZERS (NEW) ====================
class ItemSerializer(serializers.ModelSerializer):
    """Item master data (products/raw materials)"""
    
    class Meta:
        model = DimItem
        fields = (
            'item_key', 'item_code', 'name', 'description',
            'item_class', 'uom', 'costing_method',
            'is_batch_tracked', 'is_active', 'created_at'
        )
        read_only_fields = ('item_key', 'created_at')
    
    def validate_item_class(self, value):
        """Ensure item_class is valid"""
        valid_classes = ['INVENTORY', 'MANUFACTURED', 'SERVICE', 'NON_INVENTORY', 'KIT', 'FIXED_ASSET']
        if value not in valid_classes:
            raise serializers.ValidationError(f"Invalid item_class. Must be one of: {valid_classes}")
        return value
    
    def validate_costing_method(self, value):
        """Ensure costing_method is valid if provided"""
        if value:
            valid_methods = ['FIFO', 'LIFO', 'AVERAGE', 'STANDARD', 'SPECIFIC']
            if value not in valid_methods:
                raise serializers.ValidationError(f"Invalid costing_method. Must be one of: {valid_methods}")
        return value
# ==================== CUSTOMER SERIALIZERS (NEW) ====================

class CustomerSerializer(serializers.ModelSerializer):
    """Customer = Party with party_type='CUSTOMER'"""
    
    class Meta:
        model = Party
        fields = (
            'party_key', 'party_code', 'name', 'party_type',
            'tax_id', 'phone', 'email',
            'address_line1', 'address_line2', 'city', 'country',
            'created_at'
        )
        read_only_fields = ('party_key', 'created_at', 'party_type')  # ← Make party_type read-only
    
    def create(self, validated_data):
        validated_data['party_type'] = 'CUSTOMER'
        return super().create(validated_data)
    
    def update(self, instance, validated_data):
        validated_data['party_type'] = 'CUSTOMER'
        return super().update(instance, validated_data)

# ==================== JOURNAL ENTRY SERIALIZERS ====================

class JournalLineInputSerializer(serializers.Serializer):
    """Input for a single GL line"""
    account_key = serializers.IntegerField()
    debit = serializers.DecimalField(max_digits=18, decimal_places=2, default=0)
    credit = serializers.DecimalField(max_digits=18, decimal_places=2, default=0)
    cost_center_key = serializers.IntegerField(required=False, allow_null=True)
    project_job_id = serializers.IntegerField(required=False, allow_null=True)
    description = serializers.CharField(required=False, allow_blank=True, allow_null=True)


class JournalEntryCreateSerializer(serializers.Serializer):
    """
    Journal Entry (replaces Expense Voucher)
    Creates gl_journal + gl_lines with balanced debit/credit
    """
    company_key = serializers.IntegerField()
    journal_date = serializers.DateField()
    description = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    status = serializers.ChoiceField(choices=["DRAFT", "POSTED"], default="DRAFT")
    created_by = serializers.IntegerField(required=False, allow_null=True)
    lines = JournalLineInputSerializer(many=True)

    def validate(self, data):
        lines = data.get("lines") or []
        if not lines:
            raise serializers.ValidationError("At least one line is required.")
        
        # Validate balance
        total_debit = sum(float(ln.get('debit', 0)) for ln in lines)
        total_credit = sum(float(ln.get('credit', 0)) for ln in lines)
        
        if abs(total_debit - total_credit) > 0.01:
            raise serializers.ValidationError(
                f"Journal entry must be balanced. Debit: {total_debit}, Credit: {total_credit}"
            )
        
        # Validate accounts
        for i, ln in enumerate(lines, start=1):
            acc = ChartOfAccounts.objects.filter(account_key=ln['account_key']).first()
            if not acc:
                raise serializers.ValidationError(f"Line {i}: Account not found")
            if not acc.is_active or not acc.is_posting:
                raise serializers.ValidationError(f"Line {i}: Account must be active and posting")
            
            debit = float(ln.get('debit', 0))
            credit = float(ln.get('credit', 0))
            
            if debit > 0 and credit > 0:
                raise serializers.ValidationError(f"Line {i}: Cannot have both debit and credit")
            if debit == 0 and credit == 0:
                raise serializers.ValidationError(f"Line {i}: Must have either debit or credit")
        
        return data

    def _resolve_period(self, company_key, journal_date):
        qs = FiscalPeriod.objects.filter(
            company_key=company_key,
            start_date__lte=journal_date,
            end_date__gte=journal_date,
        )
        if hasattr(FiscalPeriod, "is_closed"):
            qs = qs.filter(is_closed=False)
        return qs.order_by("-start_date").first()

    @transaction.atomic
    def create(self, validated_data):
        company_key = validated_data["company_key"]
        journal_date = validated_data["journal_date"]
        desc = validated_data.get("description") or "Journal Entry"
        created_by = validated_data.get("created_by")
        status = validated_data.get("status", "DRAFT")

        period = self._resolve_period(company_key, journal_date)

        # Create GL header
        j = GlJournal.objects.create(
            company_key_id=company_key,
            journal_number="JV-TEMP",
            journal_date=journal_date,
            period_key=period,
            description=desc,
            status=status,
            created_by_id=created_by if created_by else None,
        )

        # Generate human-readable voucher number
        j.journal_number = f"JV-{journal_date.strftime('%Y%m%d')}-{j.gl_id}"
        j.save(update_fields=["journal_number"])

        # Create GL lines
        for i, ln in enumerate(validated_data["lines"], start=1):
            GlLine.objects.create(
                gl=j,
                line_no=i,
                account_key_id=ln["account_key"],
                cost_center_key_id=ln.get("cost_center_key"),
                project_job_id=ln.get("project_job_id"),
                description=ln.get("description") or desc,
                debit=ln.get("debit", 0),
                credit=ln.get("credit", 0),
            )

        return j


class GlLineSerializer(serializers.ModelSerializer):
    class Meta:
        model = GlLine
        fields = "__all__"


class GlJournalDetailSerializer(serializers.ModelSerializer):
    lines = serializers.SerializerMethodField()

    class Meta:
        model = GlJournal
        fields = "__all__"

    def get_lines(self, obj):
        qs = GlLine.objects.filter(gl=obj).order_by("line_no")
        return GlLineSerializer(qs, many=True).data


# ==================== BANK SERIALIZERS (NEW) ====================

# Get the Bank model (assuming it's in chart_of_accounts or we'll use a metadata approach)
# For now, we'll create a simple model using Party table with type='BANK'

# ==================== BANK SERIALIZERS (NEW - SIMPLE VERSION) ====================

class BankSerializer(serializers.Serializer):
    """Bank Account using Party table with party_type='BANK'"""
    
    party_key = serializers.IntegerField(read_only=True)
    party_code = serializers.CharField(max_length=50)
    name = serializers.CharField(max_length=255)
    tax_id = serializers.CharField(max_length=100, required=False, allow_blank=True)  # Account Number
    phone = serializers.CharField(max_length=50, required=False, allow_blank=True)    # Branch
    email = serializers.CharField(max_length=255, required=False, allow_blank=True)   # Swift/IBAN
    address_line1 = serializers.CharField(required=False, allow_blank=True)           # Bank Address
    city = serializers.CharField(max_length=100, required=False, allow_blank=True)
    country = serializers.CharField(max_length=100, required=False, allow_blank=True) # Currency
    created_at = serializers.DateTimeField(read_only=True)
    
    def create(self, validated_data):
        validated_data['party_type'] = 'BANK'
        return Party.objects.create(**validated_data)
    
    def update(self, instance, validated_data):
        for key, value in validated_data.items():
            setattr(instance, key, value)
        instance.party_type = 'BANK'
        instance.save()
        return instance
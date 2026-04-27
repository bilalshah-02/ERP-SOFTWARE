# This is an auto-generated Django model module.
# You'll have to do the following manually to clean this up:
#   * Rearrange models' order
#   * Make sure each model has one field with primary_key=True
#   * Make sure each ForeignKey and OneToOneField has `on_delete` set to the desired behavior
#   * Remove `managed = False` lines if you wish to allow Django to create, modify, and delete the table
# Feel free to rename the models, but don't rename db_table values or field names.
from django.db import models
from django.db.models import F


class AppUser(models.Model):
    user_key = models.BigAutoField(primary_key=True)
    username = models.CharField(unique=True, max_length=100)
    full_name = models.CharField(max_length=200, blank=True, null=True)
    email = models.CharField(unique=True, max_length=255, blank=True, null=True)
    password_hash = models.TextField()
    is_active = models.BooleanField(blank=True, null=True)
    created_at = models.DateTimeField(blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'app_user'


class AppUserRole(models.Model):
    pk = models.CompositePrimaryKey('user_key', 'role_key')
    user_key = models.ForeignKey(AppUser, models.DO_NOTHING, db_column='user_key')
    role_key = models.ForeignKey('UserRole', models.DO_NOTHING, db_column='role_key')

    class Meta:
        managed = False
        db_table = 'app_user_role'


class AssetCategory(models.Model):
    asset_category_key = models.BigAutoField(primary_key=True)
    category_code = models.CharField(unique=True, max_length=50)
    name = models.CharField(max_length=200)
    depreciation_method = models.TextField()  # This field type is a guess.
    useful_life_months = models.IntegerField(blank=True, null=True)
    depreciation_account_key = models.ForeignKey('ChartOfAccounts', models.DO_NOTHING, db_column='depreciation_account_key', blank=True, null=True)
    accumulated_dep_account_key = models.ForeignKey('ChartOfAccounts', models.DO_NOTHING, db_column='accumulated_dep_account_key', related_name='assetcategory_accumulated_dep_account_key_set', blank=True, null=True)
    disposal_gain_account_key = models.ForeignKey('ChartOfAccounts', models.DO_NOTHING, db_column='disposal_gain_account_key', related_name='assetcategory_disposal_gain_account_key_set', blank=True, null=True)
    disposal_loss_account_key = models.ForeignKey('ChartOfAccounts', models.DO_NOTHING, db_column='disposal_loss_account_key', related_name='assetcategory_disposal_loss_account_key_set', blank=True, null=True)
    created_at = models.DateTimeField(blank=True, null=True)
    created_by = models.ForeignKey(AppUser, models.DO_NOTHING, db_column='created_by', blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'asset_category'


class AuditTrail(models.Model):
    audit_id = models.BigAutoField(primary_key=True)
    table_name = models.CharField(max_length=200)
    record_pk = models.TextField(blank=True, null=True)
    action = models.CharField(max_length=20)
    changed_by = models.ForeignKey(AppUser, models.DO_NOTHING, db_column='changed_by', blank=True, null=True)
    changed_at = models.DateTimeField(blank=True, null=True)
    old_data = models.JSONField(blank=True, null=True)
    new_data = models.JSONField(blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'audit_trail'


class BatchCostDetail(models.Model):
    batch_cost_id = models.BigAutoField(primary_key=True)
    prod_batch_key = models.ForeignKey('ProductionBatch', models.DO_NOTHING, db_column='prod_batch_key')
    cost_head = models.TextField()  # This field type is a guess.
    amount = models.DecimalField(max_digits=18, decimal_places=2)
    source_doc_type = models.CharField(max_length=50, blank=True, null=True)
    source_doc_pk_bigint = models.BigIntegerField(blank=True, null=True)
    source_doc_pk_uuid = models.UUIDField(blank=True, null=True)
    notes = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(blank=True, null=True)
    created_by = models.ForeignKey(AppUser, models.DO_NOTHING, db_column='created_by', blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'batch_cost_detail'


class Bom(models.Model):
    bom_key = models.BigAutoField(primary_key=True)
    parent_item_key = models.ForeignKey('DimItem', models.DO_NOTHING, db_column='parent_item_key')
    bom_code = models.CharField(max_length=50)
    description = models.TextField(blank=True, null=True)
    is_active = models.BooleanField(blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'bom'
        unique_together = (('parent_item_key', 'bom_code'),)


class BomComponent(models.Model):
    bom_component_key = models.BigAutoField(primary_key=True)
    bom_key = models.ForeignKey(Bom, models.DO_NOTHING, db_column='bom_key')
    component_item_key = models.ForeignKey('DimItem', models.DO_NOTHING, db_column='component_item_key')
    quantity_per = models.DecimalField(max_digits=18, decimal_places=6)
    scrap_percent = models.DecimalField(max_digits=5, decimal_places=2, blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'bom_component'


class ChartOfAccounts(models.Model):
    account_key = models.BigAutoField(primary_key=True)
    company_key = models.ForeignKey('DimCompany', models.DO_NOTHING, db_column='company_key')
    account_code = models.CharField(max_length=50)
    account_name = models.CharField(max_length=255)
    account_type = models.TextField()  # This field type is a guess.
    parent_key = models.ForeignKey('self', models.DO_NOTHING, db_column='parent_key', blank=True, null=True)
    is_posting = models.BooleanField(blank=True, null=True)
    is_active = models.BooleanField(blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'chart_of_accounts'
        unique_together = (('company_key', 'account_code'),)


class CrmActivity(models.Model):
    activity_id = models.BigAutoField(primary_key=True)
    lead = models.ForeignKey('CrmLead', models.DO_NOTHING, blank=True, null=True)
    party_key = models.ForeignKey('Party', models.DO_NOTHING, db_column='party_key', blank=True, null=True)
    activity_type = models.TextField(blank=True, null=True)  # This field type is a guess.
    subject = models.CharField(max_length=255, blank=True, null=True)
    notes = models.TextField(blank=True, null=True)
    due_at = models.DateTimeField(blank=True, null=True)
    completed_at = models.DateTimeField(blank=True, null=True)
    created_at = models.DateTimeField(blank=True, null=True)
    created_by = models.ForeignKey(AppUser, models.DO_NOTHING, db_column='created_by', blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'crm_activity'


class CrmLead(models.Model):
    lead_id = models.BigAutoField(primary_key=True)
    lead_code = models.CharField(unique=True, max_length=60, blank=True, null=True)
    lead_name = models.CharField(max_length=255)
    company_key = models.ForeignKey('DimCompany', models.DO_NOTHING, db_column='company_key', blank=True, null=True)
    contact_person = models.CharField(max_length=255, blank=True, null=True)
    email = models.CharField(max_length=255, blank=True, null=True)
    phone = models.CharField(max_length=50, blank=True, null=True)
    source = models.CharField(max_length=100, blank=True, null=True)
    status = models.TextField(blank=True, null=True)  # This field type is a guess.
    estimated_value = models.DecimalField(max_digits=18, decimal_places=2, blank=True, null=True)
    currency_code = models.ForeignKey('DimCurrency', models.DO_NOTHING, db_column='currency_code', blank=True, null=True)
    customer_party_key = models.ForeignKey('Party', models.DO_NOTHING, db_column='customer_party_key', blank=True, null=True)
    created_at = models.DateTimeField(blank=True, null=True)
    created_by = models.ForeignKey(AppUser, models.DO_NOTHING, db_column='created_by', blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'crm_lead'


class DimBatch(models.Model):
    batch_key = models.BigAutoField(primary_key=True)
    item_key = models.ForeignKey('DimItem', models.DO_NOTHING, db_column='item_key')
    batch_number = models.CharField(max_length=100)
    mfg_date = models.DateField(blank=True, null=True)
    exp_date = models.DateField(blank=True, null=True)
    qc_released = models.BooleanField(blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'dim_batch'
        unique_together = (('item_key', 'batch_number'),)


class DimCompany(models.Model):
    company_key = models.BigAutoField(primary_key=True)
    company_code = models.CharField(unique=True, max_length=50)
    name = models.CharField(max_length=255)
    legal_name = models.CharField(max_length=255, blank=True, null=True)
    tax_id = models.CharField(max_length=100, blank=True, null=True)
    base_currency = models.CharField(max_length=3, blank=True, null=True)
    created_at = models.DateTimeField(blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'dim_company'


class DimCostCenter(models.Model):
    cost_center_key = models.BigAutoField(primary_key=True)
    company_key = models.ForeignKey(DimCompany, models.DO_NOTHING, db_column='company_key')
    code = models.CharField(max_length=50)
    name = models.CharField(max_length=255)
    parent_key = models.ForeignKey('self', models.DO_NOTHING, db_column='parent_key', blank=True, null=True)
    cost_center_type = models.TextField(blank=True, null=True)  # This field type is a guess.
    is_active = models.BooleanField(blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'dim_cost_center'
        unique_together = (('company_key', 'code'),)


class DimCurrency(models.Model):
    currency_code = models.CharField(primary_key=True, max_length=3)
    currency_name = models.CharField(max_length=100, blank=True, null=True)
    symbol = models.CharField(max_length=10, blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'dim_currency'


class DimItem(models.Model):
    ITEM_CLASS_CHOICES = [
        ("INVENTORY", "INVENTORY"),
        ("MANUFACTURED", "MANUFACTURED"),
        ("SERVICE", "SERVICE"),
        ("NON_INVENTORY", "NON_INVENTORY"),
        ("KIT", "KIT"),
        ("FIXED_ASSET", "FIXED_ASSET"),
    ]

    COSTING_METHOD_CHOICES = [
        ("FIFO", "FIFO"),
        ("LIFO", "LIFO"),
        ("AVERAGE", "AVERAGE"),
        ("STANDARD", "STANDARD"),
        ("SPECIFIC", "SPECIFIC"),
    ]

    item_key = models.BigAutoField(primary_key=True)
    item_code = models.CharField(unique=True, max_length=50)
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True, null=True)

    item_class = models.CharField(max_length=30, choices=ITEM_CLASS_CHOICES)
    uom = models.CharField(max_length=20)

    costing_method = models.CharField(
        max_length=30, choices=COSTING_METHOD_CHOICES, blank=True, null=True
    )

    is_batch_tracked = models.BooleanField(blank=True, null=True)
    is_active = models.BooleanField(blank=True, null=True)
    created_at = models.DateTimeField(blank=True, null=True)

    class Meta:
        managed = False
        db_table = "dim_item"


class DimTaxCode(models.Model):
    tax_key = models.BigAutoField(primary_key=True)
    tax_code = models.CharField(unique=True, max_length=50)
    description = models.TextField(blank=True, null=True)
    rate = models.DecimalField(max_digits=8, decimal_places=4)
    is_vat = models.BooleanField(blank=True, null=True)
    is_withholding = models.BooleanField(blank=True, null=True)
    created_at = models.DateTimeField(blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'dim_tax_code'


class DocumentApprovalHistory(models.Model):
    approval_id = models.BigAutoField(primary_key=True)
    instance = models.ForeignKey('DocumentWorkflowInstance', models.DO_NOTHING)
    step = models.ForeignKey('WorkflowStep', models.DO_NOTHING, blank=True, null=True)
    action = models.CharField(max_length=20, blank=True, null=True)
    action_by = models.ForeignKey(AppUser, models.DO_NOTHING, db_column='action_by', blank=True, null=True)
    action_at = models.DateTimeField(blank=True, null=True)
    remarks = models.TextField(blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'document_approval_history'


class DocumentWorkflowInstance(models.Model):
    instance_id = models.BigAutoField(primary_key=True)
    workflow = models.ForeignKey('WorkflowDefinition', models.DO_NOTHING, blank=True, null=True)
    document_type = models.CharField(max_length=50)
    document_pk_bigint = models.BigIntegerField(blank=True, null=True)
    document_pk_uuid = models.UUIDField(blank=True, null=True)
    document_number = models.CharField(max_length=100, blank=True, null=True)
    current_step = models.ForeignKey('WorkflowStep', models.DO_NOTHING, blank=True, null=True)
    status = models.CharField(max_length=30, blank=True, null=True)
    requested_by = models.ForeignKey(AppUser, models.DO_NOTHING, db_column='requested_by', blank=True, null=True)
    requested_at = models.DateTimeField(blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'document_workflow_instance'


class Employee(models.Model):
    employee_id = models.BigAutoField(primary_key=True)
    party_key = models.OneToOneField('Party', models.DO_NOTHING, db_column='party_key', blank=True, null=True)
    employee_code = models.CharField(unique=True, max_length=50)
    first_name = models.CharField(max_length=100, blank=True, null=True)
    last_name = models.CharField(max_length=100, blank=True, null=True)
    hire_date = models.DateField(blank=True, null=True)
    termination_date = models.DateField(blank=True, null=True)
    cost_center_key = models.ForeignKey(DimCostCenter, models.DO_NOTHING, db_column='cost_center_key', blank=True, null=True)
    created_at = models.DateTimeField(blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'employee'


class FiscalPeriod(models.Model):
    period_key = models.BigAutoField(primary_key=True)
    company_key = models.ForeignKey(DimCompany, models.DO_NOTHING, db_column='company_key')
    period_code = models.CharField(max_length=20)
    start_date = models.DateField()
    end_date = models.DateField()
    is_closed = models.BooleanField(blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'fiscal_period'
        unique_together = (('company_key', 'period_code'),)


class FixedAsset(models.Model):
    fixed_asset_key = models.BigAutoField(primary_key=True)
    asset_code = models.CharField(unique=True, max_length=60)
    asset_name = models.CharField(max_length=255)
    company_key = models.ForeignKey(DimCompany, models.DO_NOTHING, db_column='company_key')
    asset_category_key = models.ForeignKey(AssetCategory, models.DO_NOTHING, db_column='asset_category_key')
    cost_center_key = models.ForeignKey(DimCostCenter, models.DO_NOTHING, db_column='cost_center_key', blank=True, null=True)
    related_item_key = models.ForeignKey(DimItem, models.DO_NOTHING, db_column='related_item_key', blank=True, null=True)
    purchase_date = models.DateField(blank=True, null=True)
    purchase_cost = models.DecimalField(max_digits=18, decimal_places=2, blank=True, null=True)
    salvage_value = models.DecimalField(max_digits=18, decimal_places=2, blank=True, null=True)
    start_depreciation_date = models.DateField(blank=True, null=True)
    status = models.TextField(blank=True, null=True)  # This field type is a guess.
    remarks = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(blank=True, null=True)
    created_by = models.ForeignKey(AppUser, models.DO_NOTHING, db_column='created_by', blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'fixed_asset'


class FixedAssetDepreciationLine(models.Model):
    dep_line_id = models.BigAutoField(primary_key=True)
    dep_run = models.ForeignKey('FixedAssetDepreciationRun', models.DO_NOTHING)
    fixed_asset_key = models.ForeignKey(FixedAsset, models.DO_NOTHING, db_column='fixed_asset_key')
    depreciation_amount = models.DecimalField(max_digits=18, decimal_places=2)
    period_start = models.DateField()
    period_end = models.DateField()
    gl = models.ForeignKey('GlJournal', models.DO_NOTHING, blank=True, null=True)
    created_at = models.DateTimeField(blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'fixed_asset_depreciation_line'


class FixedAssetDepreciationRun(models.Model):
    dep_run_id = models.BigAutoField(primary_key=True)
    run_date = models.DateField()
    period_start = models.DateField()
    period_end = models.DateField()
    status = models.CharField(max_length=30, blank=True, null=True)
    created_at = models.DateTimeField(blank=True, null=True)
    created_by = models.ForeignKey(AppUser, models.DO_NOTHING, db_column='created_by', blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'fixed_asset_depreciation_run'


class GlJournal(models.Model):
    gl_id = models.BigAutoField(primary_key=True)
    company_key = models.ForeignKey(DimCompany, models.DO_NOTHING, db_column='company_key')
    journal_number = models.CharField(max_length=50)
    journal_date = models.DateField()
    period_key = models.ForeignKey(FiscalPeriod, models.DO_NOTHING, db_column='period_key', blank=True, null=True)
    description = models.TextField(blank=True, null=True)
    status = models.TextField(blank=True, null=True)  # This field type is a guess.
    created_by = models.ForeignKey(AppUser, models.DO_NOTHING, db_column='created_by', blank=True, null=True)
    created_at = models.DateTimeField(blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'gl_journal'
        unique_together = (('company_key', 'journal_number'),)


class GlLine(models.Model):
    gl_line_id = models.BigAutoField(primary_key=True)
    gl = models.ForeignKey(GlJournal, models.DO_NOTHING)
    line_no = models.IntegerField()
    account_key = models.ForeignKey(ChartOfAccounts, models.DO_NOTHING, db_column='account_key')
    cost_center_key = models.ForeignKey(DimCostCenter, models.DO_NOTHING, db_column='cost_center_key', blank=True, null=True)
    project_job = models.ForeignKey('ProjectJob', models.DO_NOTHING, blank=True, null=True)
    description = models.TextField(blank=True, null=True)
    debit = models.DecimalField(max_digits=18, decimal_places=2, blank=True, null=True)
    credit = models.DecimalField(max_digits=18, decimal_places=2, blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'gl_line'
        unique_together = (('gl', 'line_no'),)


class InventoryBalance(models.Model):
    balance_id = models.BigAutoField(primary_key=True)
    company_key = models.ForeignKey(DimCompany, models.DO_NOTHING, db_column='company_key')
    item_key = models.ForeignKey(DimItem, models.DO_NOTHING, db_column='item_key')
    warehouse_key = models.ForeignKey('Warehouse', models.DO_NOTHING, db_column='warehouse_key')
    bin_key = models.ForeignKey('WarehouseBin', models.DO_NOTHING, db_column='bin_key', blank=True, null=True)
    batch_key = models.ForeignKey(DimBatch, models.DO_NOTHING, db_column='batch_key', blank=True, null=True)
    quantity_on_hand = models.DecimalField(max_digits=18, decimal_places=3, blank=True, null=True)
    quantity_reserved = models.DecimalField(max_digits=18, decimal_places=3, blank=True, null=True)
    avg_cost = models.DecimalField(max_digits=18, decimal_places=6, blank=True, null=True)
    total_value = models.DecimalField(max_digits=18, decimal_places=2, blank=True, null=True)

    # A unique constraint could not be introspected.
    class Meta:
        managed = False
        db_table = 'inventory_balance'
        unique_together = (('company_key', 'item_key', 'warehouse_key'),)


class InventoryTransaction(models.Model):
    inv_txn_id = models.BigAutoField(primary_key=True)
    company_key = models.ForeignKey(DimCompany, models.DO_NOTHING, db_column='company_key')
    item_key = models.ForeignKey(DimItem, models.DO_NOTHING, db_column='item_key')
    warehouse_key = models.ForeignKey('Warehouse', models.DO_NOTHING, db_column='warehouse_key')
    bin_key = models.ForeignKey('WarehouseBin', models.DO_NOTHING, db_column='bin_key', blank=True, null=True)
    batch_key = models.ForeignKey(DimBatch, models.DO_NOTHING, db_column='batch_key', blank=True, null=True)
    movement_type = models.TextField()  # This field type is a guess.
    quantity = models.DecimalField(max_digits=18, decimal_places=3)
    unit_cost = models.DecimalField(max_digits=18, decimal_places=6, blank=True, null=True)
    total_cost = models.DecimalField(max_digits=18, decimal_places=2, blank=True, null=True)
    tx_date = models.DateTimeField(blank=True, null=True)
    source_doc_type = models.CharField(max_length=50, blank=True, null=True)
    source_doc_id = models.TextField(blank=True, null=True)
    project_job = models.ForeignKey('ProjectJob', models.DO_NOTHING, blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'inventory_transaction'


class Invoice(models.Model):
    invoice_id = models.UUIDField(primary_key=True)
    company_key = models.ForeignKey(DimCompany, models.DO_NOTHING, db_column='company_key')
    invoice_number = models.CharField(max_length=50)
    invoice_type = models.CharField(max_length=20)
    party_key = models.ForeignKey('Party', models.DO_NOTHING, db_column='party_key')
    invoice_date = models.DateField()
    due_date = models.DateField(blank=True, null=True)
    status = models.TextField(blank=True, null=True)  # This field type is a guess.
    currency_code = models.ForeignKey(DimCurrency, models.DO_NOTHING, db_column='currency_code', blank=True, null=True)
    remarks = models.TextField(blank=True, null=True)
    created_by = models.ForeignKey(AppUser, models.DO_NOTHING, db_column='created_by', blank=True, null=True)
    created_at = models.DateTimeField(blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'invoice'
        unique_together = (('company_key', 'invoice_number', 'invoice_type'),)


class InvoiceLine(models.Model):
    line_id = models.BigAutoField(primary_key=True)
    invoice = models.ForeignKey(Invoice, models.DO_NOTHING)
    line_no = models.IntegerField()
    item_key = models.ForeignKey(DimItem, models.DO_NOTHING, db_column='item_key', blank=True, null=True)
    description = models.TextField(blank=True, null=True)
    quantity = models.DecimalField(max_digits=18, decimal_places=3, blank=True, null=True)
    unit_price = models.DecimalField(max_digits=18, decimal_places=4, blank=True, null=True)
    line_amount = models.DecimalField(max_digits=18, decimal_places=2)
    tax_amount = models.DecimalField(max_digits=18, decimal_places=2, blank=True, null=True)
    tax_key = models.ForeignKey(DimTaxCode, models.DO_NOTHING, db_column='tax_key', blank=True, null=True)
    cost_center_key = models.ForeignKey(DimCostCenter, models.DO_NOTHING, db_column='cost_center_key', blank=True, null=True)
    project_job = models.ForeignKey('ProjectJob', models.DO_NOTHING, blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'invoice_line'
        unique_together = (('invoice', 'line_no'),)


class LimsTestResult(models.Model):
    test_id = models.BigAutoField(primary_key=True)
    batch_key = models.ForeignKey(DimBatch, models.DO_NOTHING, db_column='batch_key')
    test_date = models.DateField()
    parameter = models.CharField(max_length=200)
    result_value = models.CharField(max_length=200, blank=True, null=True)
    passed = models.BooleanField(blank=True, null=True)
    remarks = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'lims_test_result'


class Party(models.Model):
    party_key = models.BigAutoField(primary_key=True)
    party_code = models.CharField(unique=True, max_length=50)
    name = models.CharField(max_length=255)
    party_type = models.CharField(max_length=50)
    tax_id = models.CharField(max_length=100, blank=True, null=True)
    phone = models.CharField(max_length=50, blank=True, null=True)
    email = models.CharField(max_length=255, blank=True, null=True)
    address_line1 = models.TextField(blank=True, null=True)
    address_line2 = models.TextField(blank=True, null=True)
    city = models.CharField(max_length=100, blank=True, null=True)
    country = models.CharField(max_length=100, blank=True, null=True)
    created_at = models.DateTimeField(blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'party'


class Payment(models.Model):
    payment_id = models.BigAutoField(primary_key=True)
    company_key = models.ForeignKey(DimCompany, models.DO_NOTHING, db_column='company_key')
    party_key = models.ForeignKey(Party, models.DO_NOTHING, db_column='party_key')
    payment_date = models.DateField()
    amount = models.DecimalField(max_digits=18, decimal_places=2)
    payment_method = models.CharField(max_length=50, blank=True, null=True)
    reference_no = models.CharField(max_length=100, blank=True, null=True)
    remarks = models.TextField(blank=True, null=True)
    created_by = models.ForeignKey(AppUser, models.DO_NOTHING, db_column='created_by', blank=True, null=True)
    created_at = models.DateTimeField(blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'payment'


class PaymentAllocation(models.Model):
    allocation_id = models.BigAutoField(primary_key=True)
    payment = models.ForeignKey(Payment, models.DO_NOTHING)
    invoice = models.ForeignKey(Invoice, models.DO_NOTHING)
    allocated_amount = models.DecimalField(max_digits=18, decimal_places=2)

    class Meta:
        managed = False
        db_table = 'payment_allocation'


class PayrollComponentLine(models.Model):
    component_line_id = models.BigAutoField(primary_key=True)
    pe = models.ForeignKey('PayrollEntry', models.DO_NOTHING)
    component_type = models.ForeignKey('PayrollComponentType', models.DO_NOTHING)
    amount = models.DecimalField(max_digits=18, decimal_places=2)
    cost_center_key = models.ForeignKey(DimCostCenter, models.DO_NOTHING, db_column='cost_center_key', blank=True, null=True)
    project_job = models.ForeignKey('ProjectJob', models.DO_NOTHING, blank=True, null=True)
    notes = models.TextField(blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'payroll_component_line'


class PayrollComponentType(models.Model):
    component_type_id = models.BigAutoField(primary_key=True)
    code = models.CharField(unique=True, max_length=50)
    name = models.CharField(max_length=200)
    kind = models.TextField()  # This field type is a guess.
    account_key = models.ForeignKey(ChartOfAccounts, models.DO_NOTHING, db_column='account_key', blank=True, null=True)
    taxable = models.BooleanField(blank=True, null=True)
    active = models.BooleanField(blank=True, null=True)
    created_at = models.DateTimeField(blank=True, null=True)
    created_by = models.ForeignKey(AppUser, models.DO_NOTHING, db_column='created_by', blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'payroll_component_type'


class PayrollEntry(models.Model):
    pe_id = models.BigAutoField(primary_key=True)
    payroll_run = models.ForeignKey('PayrollRun', models.DO_NOTHING)
    employee = models.ForeignKey(Employee, models.DO_NOTHING)
    gross_pay = models.DecimalField(max_digits=18, decimal_places=2)
    deductions = models.DecimalField(max_digits=18, decimal_places=2, blank=True, null=True)
    net_pay = models.DecimalField(max_digits=18, decimal_places=2)
    created_at = models.DateTimeField(blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'payroll_entry'


class PayrollRun(models.Model):
    payroll_run_id = models.BigAutoField(primary_key=True)
    company_key = models.ForeignKey(DimCompany, models.DO_NOTHING, db_column='company_key')
    period_start = models.DateField()
    period_end = models.DateField()
    pay_date = models.DateField()
    description = models.TextField(blank=True, null=True)
    status = models.TextField(blank=True, null=True)  # This field type is a guess.
    created_at = models.DateTimeField(blank=True, null=True)
    created_by = models.ForeignKey(AppUser, models.DO_NOTHING, db_column='created_by', blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'payroll_run'



class ProductCosting(models.Model):
    product_costing_id = models.BigAutoField(primary_key=True)
    company_key = models.ForeignKey(DimCompany, models.DO_NOTHING, db_column="company_key")
    item_key = models.ForeignKey(DimItem, models.DO_NOTHING, db_column="item_key")
    cost_version = models.TextField()
    effective_date = models.DateField()
    material_cost = models.DecimalField(max_digits=18, decimal_places=6)
    labor_cost = models.DecimalField(max_digits=18, decimal_places=6)
    overhead_cost = models.DecimalField(max_digits=18, decimal_places=6)

    total_cost = models.GeneratedField(
        expression=F("material_cost") + F("labor_cost") + F("overhead_cost"),
        output_field=models.DecimalField(max_digits=18, decimal_places=6),
        db_persist=True,   # total_cost STORED generated ise True
        editable=False,
    )

    notes = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField()
    updated_at = models.DateTimeField()

    class Meta:
        managed = False
        db_table = "product_costing"
        unique_together = (("company_key", "item_key", "cost_version", "effective_date"),)



class ProductionBatch(models.Model):
    prod_batch_key = models.BigAutoField(primary_key=True)
    company_key = models.ForeignKey(DimCompany, models.DO_NOTHING, db_column='company_key')
    batch_key = models.ForeignKey(DimBatch, models.DO_NOTHING, db_column='batch_key')
    bom_key = models.ForeignKey(Bom, models.DO_NOTHING, db_column='bom_key')
    routing_key = models.ForeignKey('Routing', models.DO_NOTHING, db_column='routing_key', blank=True, null=True)
    planned_qty = models.DecimalField(max_digits=18, decimal_places=3)
    actual_qty = models.DecimalField(max_digits=18, decimal_places=3, blank=True, null=True)
    start_date = models.DateField(blank=True, null=True)
    end_date = models.DateField(blank=True, null=True)
    status = models.TextField(blank=True, null=True)  # This field type is a guess.
    created_by = models.ForeignKey(AppUser, models.DO_NOTHING, db_column='created_by', blank=True, null=True)
    created_at = models.DateTimeField(blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'production_batch'


class ProjectBilling(models.Model):
    billing_id = models.BigAutoField(primary_key=True)
    project_job = models.ForeignKey('ProjectJob', models.DO_NOTHING)
    invoice = models.ForeignKey(Invoice, models.DO_NOTHING, blank=True, null=True)
    billing_date = models.DateField()
    description = models.TextField(blank=True, null=True)
    certified_amount = models.DecimalField(max_digits=18, decimal_places=2)
    retention_percent = models.DecimalField(max_digits=5, decimal_places=2, blank=True, null=True)
    retention_amount = models.DecimalField(max_digits=18, decimal_places=2, blank=True, null=True)
    status = models.CharField(max_length=30, blank=True, null=True)
    created_at = models.DateTimeField(blank=True, null=True)
    created_by = models.ForeignKey(AppUser, models.DO_NOTHING, db_column='created_by', blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'project_billing'


class ProjectJob(models.Model):
    project_job_id = models.BigAutoField(primary_key=True)
    project_code = models.CharField(unique=True, max_length=60)
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True, null=True)
    company_key = models.ForeignKey(DimCompany, models.DO_NOTHING, db_column='company_key')
    customer_key = models.ForeignKey(Party, models.DO_NOTHING, db_column='customer_key', blank=True, null=True)
    cost_center_key = models.OneToOneField(DimCostCenter, models.DO_NOTHING, db_column='cost_center_key', blank=True, null=True)
    site_location = models.TextField(blank=True, null=True)
    start_date = models.DateField(blank=True, null=True)
    end_date = models.DateField(blank=True, null=True)
    status = models.TextField(blank=True, null=True)  # This field type is a guess.
    contract_value = models.DecimalField(max_digits=18, decimal_places=2, blank=True, null=True)
    currency_code = models.ForeignKey(DimCurrency, models.DO_NOTHING, db_column='currency_code', blank=True, null=True)
    created_at = models.DateTimeField(blank=True, null=True)
    created_by = models.ForeignKey(AppUser, models.DO_NOTHING, db_column='created_by', blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'project_job'


class ProjectJobBudget(models.Model):
    budget_id = models.BigAutoField(primary_key=True)
    project_job = models.ForeignKey(ProjectJob, models.DO_NOTHING)
    cost_head = models.TextField()  # This field type is a guess.
    budget_amount = models.DecimalField(max_digits=18, decimal_places=2)
    notes = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(blank=True, null=True)
    created_by = models.ForeignKey(AppUser, models.DO_NOTHING, db_column='created_by', blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'project_job_budget'
        unique_together = (('project_job', 'cost_head'),)


class ProjectRetention(models.Model):
    retention_id = models.BigAutoField(primary_key=True)
    project_job = models.ForeignKey(ProjectJob, models.DO_NOTHING)
    source_billing = models.ForeignKey(ProjectBilling, models.DO_NOTHING, blank=True, null=True)
    original_retention_amount = models.DecimalField(max_digits=18, decimal_places=2)
    releasable_from = models.DateField(blank=True, null=True)
    released = models.BooleanField(blank=True, null=True)
    release_invoice = models.ForeignKey(Invoice, models.DO_NOTHING, blank=True, null=True)
    released_amount = models.DecimalField(max_digits=18, decimal_places=2, blank=True, null=True)
    released_at = models.DateTimeField(blank=True, null=True)
    created_at = models.DateTimeField(blank=True, null=True)
    created_by = models.ForeignKey(AppUser, models.DO_NOTHING, db_column='created_by', blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'project_retention'


class PurchaseOrder(models.Model):
    po_id = models.BigAutoField(primary_key=True)
    company_key = models.ForeignKey(DimCompany, models.DO_NOTHING, db_column='company_key')
    po_number = models.CharField(max_length=50)
    supplier_key = models.ForeignKey(Party, models.DO_NOTHING, db_column='supplier_key')
    order_date = models.DateField()
    expected_date = models.DateField(blank=True, null=True)
    status = models.TextField(blank=True, null=True)  # This field type is a guess.
    currency_code = models.ForeignKey(DimCurrency, models.DO_NOTHING, db_column='currency_code', blank=True, null=True)
    remarks = models.TextField(blank=True, null=True)
    created_by = models.ForeignKey(AppUser, models.DO_NOTHING, db_column='created_by', blank=True, null=True)
    created_at = models.DateTimeField(blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'purchase_order'
        unique_together = (('company_key', 'po_number'),)


class PurchaseOrderLine(models.Model):
    po_line_id = models.BigAutoField(primary_key=True)
    po = models.ForeignKey(PurchaseOrder, models.DO_NOTHING)
    line_no = models.IntegerField()
    item_key = models.ForeignKey(DimItem, models.DO_NOTHING, db_column='item_key')
    description = models.TextField(blank=True, null=True)
    quantity = models.DecimalField(max_digits=18, decimal_places=3)
    unit_price = models.DecimalField(max_digits=18, decimal_places=4)
    discount_amount = models.DecimalField(max_digits=18, decimal_places=2, blank=True, null=True)
    tax_key = models.ForeignKey(DimTaxCode, models.DO_NOTHING, db_column='tax_key', blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'purchase_order_line'
        unique_together = (('po', 'line_no'),)


class RolePermission(models.Model):
    permission_key = models.BigAutoField(primary_key=True)
    role_key = models.ForeignKey('UserRole', models.DO_NOTHING, db_column='role_key')
    module = models.CharField(max_length=100)
    permission = models.JSONField()
    allowed = models.BooleanField(blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'role_permission'


class Routing(models.Model):
    routing_key = models.BigAutoField(primary_key=True)
    parent_item_key = models.ForeignKey(DimItem, models.DO_NOTHING, db_column='parent_item_key')
    operation_no = models.IntegerField()
    operation_name = models.CharField(max_length=200)
    work_center = models.CharField(max_length=100, blank=True, null=True)
    std_setup_time = models.DecimalField(max_digits=18, decimal_places=2, blank=True, null=True)
    std_run_time = models.DecimalField(max_digits=18, decimal_places=2, blank=True, null=True)
    cost_rate_per_hour = models.DecimalField(max_digits=18, decimal_places=4, blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'routing'
        unique_together = (('parent_item_key', 'operation_no'),)


class SalesOrder(models.Model):
    so_id = models.BigAutoField(primary_key=True)
    company_key = models.ForeignKey(DimCompany, models.DO_NOTHING, db_column='company_key')
    so_number = models.CharField(max_length=50)
    customer_key = models.ForeignKey(Party, models.DO_NOTHING, db_column='customer_key')
    order_date = models.DateField()
    delivery_date = models.DateField(blank=True, null=True)
    status = models.TextField(blank=True, null=True)  # This field type is a guess.
    currency_code = models.ForeignKey(DimCurrency, models.DO_NOTHING, db_column='currency_code', blank=True, null=True)
    remarks = models.TextField(blank=True, null=True)
    created_by = models.ForeignKey(AppUser, models.DO_NOTHING, db_column='created_by', blank=True, null=True)
    created_at = models.DateTimeField(blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'sales_order'
        unique_together = (('company_key', 'so_number'),)


class SalesOrderLine(models.Model):
    so_line_id = models.BigAutoField(primary_key=True)
    so = models.ForeignKey(SalesOrder, models.DO_NOTHING)
    line_no = models.IntegerField()
    item_key = models.ForeignKey(DimItem, models.DO_NOTHING, db_column='item_key')
    description = models.TextField(blank=True, null=True)
    quantity = models.DecimalField(max_digits=18, decimal_places=3)
    unit_price = models.DecimalField(max_digits=18, decimal_places=4)
    discount_amount = models.DecimalField(max_digits=18, decimal_places=2, blank=True, null=True)
    tax_key = models.ForeignKey(DimTaxCode, models.DO_NOTHING, db_column='tax_key', blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'sales_order_line'
        unique_together = (('so', 'line_no'),)

class DeliveryNote(models.Model):
    """
    Delivery Note - Records goods shipped to customers
    Links to Sales Order and creates inventory transactions
    """
    dn_id = models.BigAutoField(primary_key=True)
    company_key = models.ForeignKey(DimCompany, models.DO_NOTHING, db_column='company_key')
    dn_number = models.CharField(max_length=50)
    so = models.ForeignKey('SalesOrder', models.DO_NOTHING, blank=True, null=True)
    delivery_date = models.DateField()
    warehouse_key = models.ForeignKey('Warehouse', models.DO_NOTHING, db_column='warehouse_key')
    status = models.TextField(blank=True, null=True)  # DRAFT, POSTED, CANCELLED
    notes = models.TextField(blank=True, null=True)
    created_by = models.ForeignKey(AppUser, models.DO_NOTHING, db_column='created_by', blank=True, null=True)
    created_at = models.DateTimeField(blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'delivery_note'
        unique_together = (('company_key', 'dn_number'),)


class DeliveryNoteLine(models.Model):
    """
    Delivery Note Line - Individual items delivered
    """
    dn_line_id = models.BigAutoField(primary_key=True)
    dn = models.ForeignKey(DeliveryNote, models.DO_NOTHING)
    line_no = models.IntegerField()
    item_key = models.ForeignKey('DimItem', models.DO_NOTHING, db_column='item_key')
    description = models.TextField(blank=True, null=True)
    quantity_delivered = models.DecimalField(max_digits=18, decimal_places=3)
    unit_cost = models.DecimalField(max_digits=18, decimal_places=6, blank=True, null=True)
    total_cost = models.DecimalField(max_digits=18, decimal_places=2, blank=True, null=True)
    so_line = models.ForeignKey('SalesOrderLine', models.DO_NOTHING, blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'delivery_note_line'
        unique_together = (('dn', 'line_no'),)

class TaxTransaction(models.Model):
    tax_txn_id = models.BigAutoField(primary_key=True)
    invoice = models.ForeignKey(Invoice, models.DO_NOTHING, blank=True, null=True)
    invoice_line = models.ForeignKey(InvoiceLine, models.DO_NOTHING, blank=True, null=True)
    tax_key = models.ForeignKey(DimTaxCode, models.DO_NOTHING, db_column='tax_key')
    company_key = models.ForeignKey(DimCompany, models.DO_NOTHING, db_column='company_key', blank=True, null=True)
    tax_base_amount = models.DecimalField(max_digits=18, decimal_places=2)
    tax_amount = models.DecimalField(max_digits=18, decimal_places=2)
    tax_direction = models.CharField(max_length=10, blank=True, null=True)
    posting_date = models.DateField()
    created_at = models.DateTimeField(blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'tax_transaction'


class UserRole(models.Model):
    role_key = models.BigAutoField(primary_key=True)
    role_name = models.CharField(unique=True, max_length=100)
    description = models.TextField(blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'user_role'


class Warehouse(models.Model):
    warehouse_key = models.BigAutoField(primary_key=True)
    company_key = models.ForeignKey(DimCompany, models.DO_NOTHING, db_column='company_key')
    code = models.CharField(max_length=50)
    name = models.CharField(max_length=255)
    address = models.TextField(blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'warehouse'
        unique_together = (('company_key', 'code'),)


class WarehouseBin(models.Model):
    bin_key = models.BigAutoField(primary_key=True)
    warehouse_key = models.ForeignKey(Warehouse, models.DO_NOTHING, db_column='warehouse_key')
    bin_code = models.CharField(max_length=50)
    description = models.TextField(blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'warehouse_bin'
        unique_together = (('warehouse_key', 'bin_code'),)


class WithholdingTaxSetup(models.Model):
    wht_id = models.BigAutoField(primary_key=True)
    code = models.CharField(unique=True, max_length=50)
    description = models.TextField(blank=True, null=True)
    rate = models.DecimalField(max_digits=8, decimal_places=4)
    applies_to = models.CharField(max_length=20, blank=True, null=True)
    min_amount = models.DecimalField(max_digits=18, decimal_places=2, blank=True, null=True)
    account_key = models.ForeignKey(ChartOfAccounts, models.DO_NOTHING, db_column='account_key', blank=True, null=True)
    active = models.BooleanField(blank=True, null=True)
    created_at = models.DateTimeField(blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'withholding_tax_setup'


class WithholdingTaxTransaction(models.Model):
    wht_txn_id = models.BigAutoField(primary_key=True)
    wht = models.ForeignKey(WithholdingTaxSetup, models.DO_NOTHING)
    invoice = models.ForeignKey(Invoice, models.DO_NOTHING, blank=True, null=True)
    party_key = models.ForeignKey(Party, models.DO_NOTHING, db_column='party_key', blank=True, null=True)
    base_amount = models.DecimalField(max_digits=18, decimal_places=2)
    wht_amount = models.DecimalField(max_digits=18, decimal_places=2)
    posting_date = models.DateField()
    created_at = models.DateTimeField(blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'withholding_tax_transaction'


class WorkflowDefinition(models.Model):
    workflow_id = models.BigAutoField(primary_key=True)
    name = models.CharField(max_length=200)
    document_type = models.CharField(max_length=50)
    is_active = models.BooleanField(blank=True, null=True)
    created_at = models.DateTimeField(blank=True, null=True)
    created_by = models.ForeignKey(AppUser, models.DO_NOTHING, db_column='created_by', blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'workflow_definition'


class WorkflowStep(models.Model):
    step_id = models.BigAutoField(primary_key=True)
    workflow = models.ForeignKey(WorkflowDefinition, models.DO_NOTHING)
    step_order = models.IntegerField()
    role_required = models.CharField(max_length=100, blank=True, null=True)
    min_amount = models.DecimalField(max_digits=18, decimal_places=2, blank=True, null=True)
    max_amount = models.DecimalField(max_digits=18, decimal_places=2, blank=True, null=True)
    description = models.TextField(blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'workflow_step'
        unique_together = (('workflow', 'step_order'),)

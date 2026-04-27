from django.contrib import admin
from .models import DimCompany, DimItem, ProductCosting


@admin.register(DimCompany)
class DimCompanyAdmin(admin.ModelAdmin):
    list_display = ("company_key", "company_code", "name", "base_currency", "created_at")
    search_fields = ("company_code", "name")
    list_filter = ("base_currency",)


@admin.register(DimItem)
class DimItemAdmin(admin.ModelAdmin):
    list_display = ("item_key", "item_code", "name", "item_class", "uom", "is_active", "created_at")
    search_fields = ("item_code", "name")
    list_filter = ("item_class", "is_active", "uom")


@admin.register(ProductCosting)
class ProductCostingAdmin(admin.ModelAdmin):
    list_display = (
        "product_costing_id",
        "company_key",
        "item_key",
        "cost_version",
        "effective_date",
        "material_cost",
        "labor_cost",
        "overhead_cost",
        "total_cost",
    )
    readonly_fields = ("total_cost",)
    exclude = ("total_cost",)

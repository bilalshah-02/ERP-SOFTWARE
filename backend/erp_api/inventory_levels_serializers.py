# backend/erp_api/inventory_levels_serializers.py
"""
Inventory Levels & Reorder Management Serializers
Implements EXACT formulas as specified by client
"""

from rest_framework import serializers
from decimal import Decimal
from . import models


def model_by_table(table: str):
    for name in dir(models):
        cls = getattr(models, name)
        if hasattr(cls, "_meta") and getattr(cls._meta, "db_table", None) == table:
            return cls
    raise LookupError(f"Model for table '{table}' not found in erp_api.models")


DimItem = model_by_table("dim_item")


class InventoryLevelsSerializer(serializers.Serializer):
    """
    Inventory Levels Configuration
    
    Calculates reorder levels and min/max stock levels
    based on usage patterns and lead times
    """
    
    # Input fields
    item_key = serializers.IntegerField()
    
    # Daily usage
    avg_daily_usage = serializers.DecimalField(max_digits=18, decimal_places=4, required=False, default=0)
    min_daily_usage = serializers.DecimalField(max_digits=18, decimal_places=4, required=False, default=0)
    max_daily_usage = serializers.DecimalField(max_digits=18, decimal_places=4, required=False, default=0)
    
    # Lead time (days)
    avg_lead_time_days = serializers.IntegerField(required=False, default=0)
    min_lead_time_days = serializers.IntegerField(required=False, default=0)
    max_lead_time_days = serializers.IntegerField(required=False, default=0)
    
    # EOQ
    economic_order_qty = serializers.DecimalField(max_digits=18, decimal_places=4, required=False, default=0)
    
    # Calculated fields (read-only in response)
    reorder_level = serializers.DecimalField(max_digits=18, decimal_places=4, read_only=True)
    min_stock_absolute = serializers.DecimalField(max_digits=18, decimal_places=4, read_only=True)
    min_stock_normal = serializers.DecimalField(max_digits=18, decimal_places=4, read_only=True)
    max_stock_absolute = serializers.DecimalField(max_digits=18, decimal_places=4, read_only=True)
    max_stock_normal = serializers.DecimalField(max_digits=18, decimal_places=4, read_only=True)
    
    def validate_item_key(self, value):
        """Ensure item exists"""
        if not DimItem.objects.filter(item_key=value).exists():
            raise serializers.ValidationError(f"Item {value} does not exist")
        return value
    
    def validate(self, data):
        """Validate usage and lead time values"""
        # Ensure max >= avg >= min for usage
        min_usage = Decimal(str(data.get('min_daily_usage', 0)))
        avg_usage = Decimal(str(data.get('avg_daily_usage', 0)))
        max_usage = Decimal(str(data.get('max_daily_usage', 0)))
        
        if max_usage > 0:
            if not (min_usage <= avg_usage <= max_usage):
                raise serializers.ValidationError(
                    "Daily usage must follow: MIN <= AVG <= MAX"
                )
        
        # Ensure max >= avg >= min for lead time
        min_lead = data.get('min_lead_time_days', 0)
        avg_lead = data.get('avg_lead_time_days', 0)
        max_lead = data.get('max_lead_time_days', 0)
        
        if max_lead > 0:
            if not (min_lead <= avg_lead <= max_lead):
                raise serializers.ValidationError(
                    "Lead time must follow: MIN <= AVG <= MAX"
                )
        
        return data
    
    def calculate_levels(self, validated_data):
        """
        Calculate inventory levels using EXACT client formulas
        
        CLIENT FORMULAS (EXACT):
        1. Reorder Level = Max Usage × Max Lead Time
        2. Min Absolute = Reorder Level - (Max Usage × Max Lead Time)  
        3. Min Normal = Reorder Level - (Avg Usage × Avg Lead Time)
        4. Max Absolute = Reorder Level - (Min Usage × Min Lead Time) + EOQ
        5. Max Normal = Reorder Level - (Avg Usage × Avg Lead Time) + EOQ
        """
        
        # Convert to Decimal for precision
        max_usage = Decimal(str(validated_data.get('max_daily_usage', 0)))
        avg_usage = Decimal(str(validated_data.get('avg_daily_usage', 0)))
        min_usage = Decimal(str(validated_data.get('min_daily_usage', 0)))
        
        max_lead_time = Decimal(str(validated_data.get('max_lead_time_days', 0)))
        avg_lead_time = Decimal(str(validated_data.get('avg_lead_time_days', 0)))
        min_lead_time = Decimal(str(validated_data.get('min_lead_time_days', 0)))
        
        eoq = Decimal(str(validated_data.get('economic_order_qty', 0)))
        
        # 1. Reorder Level = Max Usage × Max Lead Time
        reorder_level = max_usage * max_lead_time
        
        # 2. Min Absolute = Reorder Level - (Max Usage × Max Lead Time)
        # NOTE: This equals ZERO per client formula, but implementing exactly as specified
        min_absolute = reorder_level - (max_usage * max_lead_time)
        
        # 3. Min Normal = Reorder Level - (Avg Usage × Avg Lead Time)
        min_normal = reorder_level - (avg_usage * avg_lead_time)
        
        # 4. Max Absolute = Reorder Level - (Min Usage × Min Lead Time) + EOQ
        # NOTE: Using MINUS as client specified
        max_absolute = reorder_level - (min_usage * min_lead_time) + eoq
        
        # 5. Max Normal = Reorder Level - (Avg Usage × Avg Lead Time) + EOQ
        max_normal = reorder_level - (avg_usage * avg_lead_time) + eoq
        
        return {
            'reorder_level': reorder_level,
            'min_stock_absolute': min_absolute,
            'min_stock_normal': min_normal,
            'max_stock_absolute': max_absolute,
            'max_stock_normal': max_normal,
        }
    
    def create(self, validated_data):
        """Update item with inventory levels"""
        item_key = validated_data['item_key']
        item = DimItem.objects.get(item_key=item_key)
        
        # Calculate levels
        calculated = self.calculate_levels(validated_data)
        
        # Update item
        item.avg_daily_usage = validated_data.get('avg_daily_usage', 0)
        item.min_daily_usage = validated_data.get('min_daily_usage', 0)
        item.max_daily_usage = validated_data.get('max_daily_usage', 0)
        
        item.avg_lead_time_days = validated_data.get('avg_lead_time_days', 0)
        item.min_lead_time_days = validated_data.get('min_lead_time_days', 0)
        item.max_lead_time_days = validated_data.get('max_lead_time_days', 0)
        
        item.economic_order_qty = validated_data.get('economic_order_qty', 0)
        
        item.reorder_level = calculated['reorder_level']
        item.min_stock_absolute = calculated['min_stock_absolute']
        item.min_stock_normal = calculated['min_stock_normal']
        item.max_stock_absolute = calculated['max_stock_absolute']
        item.max_stock_normal = calculated['max_stock_normal']
        
        item.save()
        
        return {
            **validated_data,
            **calculated,
        }
    
    def update(self, instance, validated_data):
        """Update existing inventory levels"""
        return self.create(validated_data)


class ItemInventoryLevelsSummarySerializer(serializers.Serializer):
    """
    Read-only serializer for displaying item with inventory levels
    """
    item_key = serializers.IntegerField()
    item_code = serializers.CharField()
    name = serializers.CharField()
    
    # Usage
    avg_daily_usage = serializers.DecimalField(max_digits=18, decimal_places=4)
    min_daily_usage = serializers.DecimalField(max_digits=18, decimal_places=4)
    max_daily_usage = serializers.DecimalField(max_digits=18, decimal_places=4)
    
    # Lead time
    avg_lead_time_days = serializers.IntegerField()
    min_lead_time_days = serializers.IntegerField()
    max_lead_time_days = serializers.IntegerField()
    
    # EOQ
    economic_order_qty = serializers.DecimalField(max_digits=18, decimal_places=4)
    
    # Calculated levels
    reorder_level = serializers.DecimalField(max_digits=18, decimal_places=4)
    min_stock_absolute = serializers.DecimalField(max_digits=18, decimal_places=4)
    min_stock_normal = serializers.DecimalField(max_digits=18, decimal_places=4)
    max_stock_absolute = serializers.DecimalField(max_digits=18, decimal_places=4)
    max_stock_normal = serializers.DecimalField(max_digits=18, decimal_places=4)
    
    # Current stock (from stock balance)
    current_stock = serializers.DecimalField(max_digits=18, decimal_places=4, required=False, allow_null=True)
    
    # Status indicators
    needs_reorder = serializers.BooleanField(required=False)
    stock_status = serializers.CharField(required=False)  # 'OK', 'LOW', 'CRITICAL', 'OVERSTOCK'
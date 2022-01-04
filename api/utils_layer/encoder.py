"""
JSON Encoder use for DynamoDB responses
"""
from decimal import Decimal
import json


class JSONEncoder(json.JSONEncoder):
    """Extends Json encoder to support other types"""
    def default(self, o):
        if isinstance(o, Decimal):
            return int(o)

        return super().default(o)

"""
API response functions
"""

import json
import logging
from typing import Dict, Any, Union
from .encoder import JSONEncoder

logger = logging.getLogger()
logger.setLevel(logging.INFO)


def success_response(result: Dict[str, Any]) -> str:
    """API Successful Response Object"""

    value = {
        "statusCode": 200,
        "body": json.dumps(result, cls=JSONEncoder),
    }
    logger.info(value)
    return value


def fail_response(exc: Union[Exception, str], http_status_code=500) -> str:
    """API Fail Respone Object"""

    value = {
        "statusCode": http_status_code,
        "body": json.dumps(
            {
                "message": str(exc),
                "statusCode": http_status_code,
            }
        ),
    }
    logger.info(value)
    return value

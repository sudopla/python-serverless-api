"""
API response functions
"""

import json
import logging
from typing import Dict, Any, Union
from aws_lambda_typing import responses
from utils_layer.encoder import JSONEncoder

logger = logging.getLogger()
logger.setLevel(logging.INFO)


def success_response(result: Dict[str, Any]) -> responses.APIGatewayProxyResponseV2:
    """API Successful Response Object"""

    value: responses.APIGatewayProxyResponseV2 = {
        "statusCode": 200,
        "body": json.dumps(result, cls=JSONEncoder),
    }
    logger.info(value)
    return value


def fail_response(exc: Union[Exception, str], http_status_code=500) -> responses.APIGatewayProxyResponseV2:
    """API Fail Respone Object"""

    value: responses.APIGatewayProxyResponseV2 = {
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

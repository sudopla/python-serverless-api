"""
Delete Item Lambda
"""
import json
import os
import traceback
import logging
import boto3

from jsonschema import validate, ValidationError
from aws_lambda_typing import context as context_, events, responses
from utils_layer.responses import success_response, fail_response

# Initialize logger
logger = logging.getLogger()
logger.setLevel(logging.INFO)

# Initialize boto3 client
TABLE_NAME = os.environ["TABLE_NAME"]
dynamodb = boto3.resource("dynamodb")
table = dynamodb.Table(TABLE_NAME)

# Input schema
pathParameterSchema = {
    "type": "object",
    "properties": {
        "album_name": {"type": "string"}
    },
    "required": ["album_name"]
}
queryStringSchema = {
    "type": "object",
    "properties": {
        "artist_name": {"type": "string"}
    },
    "required": ["artist_name"]
}


def handler(event: events.APIGatewayProxyEventV2, context: context_.Context) -> responses.APIGatewayProxyResponseV2:
    # pylint: disable=unused-argument
    """
    Lambda handler

    Parameters
    ----------
    event: dict, required
        API Gateway Lambda Proxy Input Format
        Event doc: https://docs.aws.amazon.com/apigateway/latest/developerguide/
        set-up-lambda-proxy-integrations.html#api-gateway-simple-proxy-for-lambda-input-format
    context: object, required
        Lambda Context runtime methods and attributes
        Context doc: https://docs.aws.amazon.com/lambda/latest/dg/python-context-object.html
    Returns
    ------
    API Gateway Lambda Proxy Output Format: dict
        Return doc: https://docs.aws.amazon.com/apigateway/latest/developerguide/set-up-lambda-proxy-integrations.html
    """

    logger.info("Event")
    logger.info(event)

    try:
        path_parameter = event["pathParameters"]
        query_strings = event["queryStringParameters"]
        validate(instance=path_parameter, schema=pathParameterSchema)
        validate(instance=query_strings, schema=queryStringSchema)

        partition_key = f"ARTIST#{query_strings['artist_name']}"
        sort_key = f"ALBUM#{path_parameter['album_name']}"

        table.delete_item(Key={
            'PK': partition_key,
            'SK': sort_key
        })

        return success_response(
            {
                "message": "Item was deleted successfully",
            }
        )

    except ValidationError as exc:
        return fail_response(exc, 400)
    except Exception as exc:  # pylint: disable=broad-except
        logger.error("Error")
        logger.error(traceback.format_exc())
        return fail_response(exc)

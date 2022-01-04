"""
Unit tests for item resource methods
"""
import sys

sys.path.append("./api")
import json
import boto3
from unittest.mock import MagicMock


ITEM = {
    "artist_name": "Arctic Monkeys",
    "album_name": "AM",
    "release_year": 2013,
    "num_songs": 12,
    "sales": 1304096,
    "record_label": "Domino Recording Co.",
}


def test_create_item_lambda_handler():
    """Test create_item lambda handler"""
    from Item.CreateItem import lambda_handler

    event = {
        "queryStringParameters": {},
        "pathParameters": {},
        "body": json.dumps(ITEM),
    }

    result = lambda_handler.handler(event, {})
    assert result["statusCode"] == 200


def test_get_item_lambda_handler_exist():
    """Test get_item lambda handler when item exists in the table"""
    from Item.GetItem import lambda_handler

    event = {
        "pathParameters": {"album_name": "AM"},
        "queryStringParameters": {"artist_name": "Arctic Monkeys"},
        "body": "",
    }

    result = lambda_handler.handler(event, {})
    assert result["statusCode"] == 200


def test_get_item_lambda_handler_does_not_exist():
    """Test get_item lambda handler when item exists in the table"""
    from Item.GetItem import lambda_handler

    event = {
        "pathParameters": {"album_name": "AM"},
        "queryStringParameters": {"artist_name": "Artist One"},
        "body": "",
    }

    result = lambda_handler.handler(event, {})
    assert result["statusCode"] == 500


def test_update_item_lambda_handler():
    """Test update_item lambda handler"""
    from Item.UpdateItem import lambda_handler

    event = {
        "queryStringParameters": {},
        "pathParameters": {},
        "body": json.dumps(ITEM),
    }

    result = lambda_handler.handler(event, {})
    assert result["statusCode"] == 200


def test_delete_item_lambda_handler():
    """Test delete_item lambda handler"""
    from Item.DeleteItem import lambda_handler

    event = {
        "pathParameters": {"album_name": "AM"},
        "queryStringParameters": {"artist_name": "Arctic Monkeys"},
        "body": "",
    }

    result = lambda_handler.handler(event, {})
    assert result["statusCode"] == 200

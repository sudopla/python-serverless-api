from sys import modules
import pytest
import boto3
from moto import mock_dynamodb2


@pytest.fixture(autouse=True)
def set_env_variables(monkeypatch):
    """Set environment variables for Lambdas"""
    monkeypatch.setenv("TABLE_NAME", "dynamo-table")


@pytest.fixture(scope="module", autouse=True)
def set_up_dynamo():

    with mock_dynamodb2():
        dynamodb = boto3.resource("dynamodb", "us-east-1")

        dynamodb.create_table(
            TableName="dynamo-table",
            KeySchema=[
                {"AttributeName": "PK", "KeyType": "HASH"},
                {"AttributeName": "SK", "KeyType": "RANGE"},
            ],
            AttributeDefinitions=[
                {"AttributeName": "PK", "AttributeType": "S"},
                {"AttributeName": "SK", "AttributeType": "S"},
            ],
            BillingMode="PAY_PER_REQUEST",
        )

        yield

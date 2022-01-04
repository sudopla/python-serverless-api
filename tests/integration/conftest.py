import pytest
import os
import boto3
from aws_requests_auth.boto_utils import BotoAWSRequestsAuth


@pytest.fixture(scope="module")
def get_api_parameters():
    ssm = boto3.client("ssm")

    api_url = ssm.get_parameter(Name="/app_name_api/API_URL", WithDecryption=True)[
        "Parameter"
    ]["Value"]
    api_id = ssm.get_parameter(Name="/app_name_api/API_ID", WithDecryption=True)[
        "Parameter"
    ]["Value"]
    return api_url, api_id


@pytest.fixture(scope="module")
def get_aws_region():
    return os.environ.get("AWS_REGION", "us-east-1")


@pytest.fixture(scope="module")
def get_api_auth(get_api_parameters, get_aws_region):
    """Create Authentication object for API requests"""
    _, api_id = get_api_parameters
    aws_region = get_aws_region
    api_host = f"{api_id}.execute-api.{aws_region}.amazonaws.com"

    auth = BotoAWSRequestsAuth(
        aws_host=api_host, aws_region=aws_region, aws_service="execute-api"
    )
    return auth

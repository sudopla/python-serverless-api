

import os
import boto3
from aws_requests_auth.boto_utils import BotoAWSRequestsAuth
import requests
import urllib

ssm = boto3.client("ssm")

api_url = ssm.get_parameter(Name="/app_name_api/API_URL", WithDecryption=True)["Parameter"]["Value"]
api_id = ssm.get_parameter(Name="/app_name_api/API_ID", WithDecryption=True)["Parameter"]["Value"]
aws_region = 'us-east-1'

print(api_url)

api_host = f'{api_id}.execute-api.{aws_region}.amazonaws.com'

auth = BotoAWSRequestsAuth(
    aws_host=api_host, aws_region=aws_region, aws_service="execute-api"
)

ITEM = {
   "artist_name": "Arctic Monkeys",
   "album_name": "AM",
   "release_year": 2013,
   "num_songs": 12,
   "sales": 1304096,
   "record_label": "Domino Recording Co."
}

# response = requests.post(
#     f"{api_url}/item", json=ITEM, auth=auth
# )

params = {"artist_name": ITEM["artist_name"]}
params = urllib.parse.urlencode(params, quote_via=urllib.parse.quote)
response = requests.get(
    f"{api_url}/item/{ITEM['album_name']}", params=params, auth=auth
)

print(response.status_code)
print(response.json())

"""
Utils for dynamo
"""
from typing import Dict, Any, Tuple

ATTRIBUTES_DYNAMO_API_MAPPING = {
    "ArtistName": "artist_name",
    "AlbumName": "album_name",
    "ReleaseYear": "release_year",
    "NumSongs": "num_songs",
    "Sales": "sales",
    "RecordLabel": "record_label",
}

ATTRIBUTES_VALUES_MAPPING = {
    "ArtistName": ":an",
    "AlbumName": ":aln",
    "ReleaseYear": ":ry",
    "NumSongs": ":ns",
    "Sales": ":s",
    "RecordLabel": ":rl"
}


def build_update_expressions(obj: Dict[str, Any]) -> Tuple[str, Dict[str, str]]:
    """Build UpdateExpression and ExpressionAttributeValues for dynamo update method"""

    update_expression = "set "
    expression_attribute_values = {}
    for dynamo_attr, api_attr in ATTRIBUTES_DYNAMO_API_MAPPING.items():
        if api_attr in obj:
            update_expression += dynamo_attr+"="+ATTRIBUTES_VALUES_MAPPING[dynamo_attr]+", "
            expression_attribute_values[ATTRIBUTES_VALUES_MAPPING[dynamo_attr]] = obj[api_attr]

    return update_expression[:-2], expression_attribute_values

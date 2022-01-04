import requests
import urllib

ITEM = {
    "artist_name": "Arctic Monkeys",
    "album_name": "AM",
    "release_year": 2013,
    "num_songs": 12,
    "sales": 1304096,
    "record_label": "Domino Recording Co.",
}


def test_create_item_endpoint(get_api_parameters, get_api_auth):
    """Call POST /item endpoint"""

    api_url, _ = get_api_parameters
    auth = get_api_auth

    response = requests.post(f"{api_url}/item", json=ITEM, auth=auth)

    assert response.status_code == 200


def test_get_item_endpoint(get_api_parameters, get_api_auth):
    """Call GET item/{album_name}?artist_name=<artist_name>"""

    api_url, _ = get_api_parameters
    auth = get_api_auth
    params = {"artist_name": ITEM["artist_name"]}
    params = urllib.parse.urlencode(params, quote_via=urllib.parse.quote)

    response = requests.get(
        f"{api_url}/item/{ITEM['album_name']}", params=params, auth=auth
    )

    assert response.status_code == 200
    response = response.json()
    assert response["item"]["ArtistName"] == ITEM["artist_name"]
    assert response["item"]["AlbumName"] == ITEM["album_name"]
    assert response["item"]["ReleaseYear"] == ITEM["release_year"]
    assert response["item"]["NumSongs"] == ITEM["num_songs"]
    assert response["item"]["Sales"] == ITEM["sales"]
    assert response["item"]["RecordLabel"] == ITEM["record_label"]


def test_update_item_endpoint(get_api_parameters, get_api_auth):
    """Call PATCH /item"""

    api_url, _ = get_api_parameters
    auth = get_api_auth
    ITEM["release_year"] = 2014
    response = requests.patch(f"{api_url}/item", json=ITEM, auth=auth)

    assert response.status_code == 200

    # verify item was updated successfully
    params = {"artist_name": ITEM["artist_name"]}
    params = urllib.parse.urlencode(params, quote_via=urllib.parse.quote)
    response = requests.get(
        f"{api_url}/item/{ITEM['album_name']}", params=params, auth=auth
    )
    response = response.json()
    assert response["item"]["ReleaseYear"] == ITEM["release_year"]

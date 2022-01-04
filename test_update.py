import boto3


dynamodb = boto3.resource("dynamodb")
table = dynamodb.Table('app_name_table')

update_expression = 'set ArtistName=:an, AlbumName=:aln, ReleaseYear=:ry, NumSongs=:ns, Sales=:s, RecordLabel=:rl'
att_values = {':an': 'Arctic Monkeys', ':aln': 'AM', ':ry': 2014, ':ns': 12, ':s': 1304096, ':rl': 'Domino Recording Co.'}

response = table.update_item(
    Key={
        'PK': 'ARTIST#Arctic Monkeys',
        'SK': 'ALBUM#AM'
    },
    UpdateExpression=update_expression,
    ExpressionAttributeValues=att_values,
    ReturnValues="UPDATED_NEW"
)

print(response)

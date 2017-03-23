RESOURCE_METHODS = ['GET', 'POST'] # dla calej kolekcji

ITEM_METHODS = ['GET','PUT','DELETE'] # dla konkretnego id

X_DOMAINS = '*'
X_HEADERS = ['Authorization','If-Match','Access-Control-Expose-Headers','Content-Type','Pragma','Cache-Control']
X_EXPOSE_HEADERS = ['Origin', 'X-Requested-With', 'Content-Type', 'Accept']
CACHE_CONTROL = 'max-age=1,must-revalidate'

IF_MATCH = False # TODO

users = {
    'item_title': 'user',
    'additional_lookup': {
        'url': 'regex("[\w]+")',
        'field': 'nick',
    },
    'datasource': {
        'projection': {'password': 0}
    },
    'schema': {
        'nick': {
            'type': 'string',
            'required': True
        },
        'email': {
            'type': 'string',
            'unique': True
        },
        'password': {
            'type': 'string',
            'required': True
        },
        'dht_id': {
            'type': 'string'
        }        
    }
}

dht_schema = {
    'infohash': {
        'type': 'string',
        'required': True
    }
}

dht = {
    'item_title': 'dht',
    'pagination': False,
    'schema': dht_schema
}

DOMAIN = {
    'dht': dht,
    'users': users
}
RESOURCE_METHODS = ['GET', 'POST'] # dla calej kolekcji

ITEM_METHODS = ['GET','PUT','DELETE'] # dla konkretnego id

X_DOMAINS = '*'
X_HEADERS = ['Authorization','If-Match','Access-Control-Expose-Headers','Content-Type','Pragma','Cache-Control']
X_EXPOSE_HEADERS = ['Origin', 'X-Requested-With', 'Content-Type', 'Accept']
CACHE_CONTROL = 'max-age=1,must-revalidate'

IF_MATCH = False # TODO

# TODO 
#MONGO_USERNAME = '<your username>'
#MONGO_PASSWORD = '<your password>'

users = {
    'item_title': 'user',
    'additional_lookup': {
        'url': 'regex("[\w]+")',
        'field': 'username',
    },
    'datasource': {
        'projection': {'password': 0}
    },
    'public_methods': ['POST'],
    'schema': {
        'username': {
            'type': 'string',
            'required': True,
            'unique': True
        },
        'email': {
            'type': 'string',
            'required': True,
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
    'schema': dht_schema,
    'authentication': None
}

DOMAIN = {
    'dht': dht,
    'users': users
}
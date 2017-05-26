import os
import bcrypt
from eve import Eve
from eve.auth import BasicAuth

import base64
from datetime import timedelta
from flask import make_response, request, current_app, jsonify
from functools import update_wrapper

import uuid

# Heroku support: bind to PORT if defined, otherwise default to 5000.
if 'PORT' in os.environ:
    port = int(os.environ.get('PORT'))
    # use '0.0.0.0' to ensure your REST API is reachable from all your
    # network (and not only your computer).
    host = '0.0.0.0'
else:
    port = 5000
    host = '0.0.0.0'

# snippet for flask crossdomain
def crossdomain(origin=None, methods=None, headers=None, max_age=21600, attach_to_all=True, automatic_options=True):
    if methods is not None:
        methods = ', '.join(sorted(x.upper() for x in methods))
    if headers is not None and not isinstance(headers, basestring):
        headers = ', '.join(x.upper() for x in headers)
    if not isinstance(origin, basestring):
        origin = ', '.join(origin)
    if isinstance(max_age, timedelta):
        max_age = max_age.total_seconds()

    def get_methods():
        if methods is not None:
            return methods

        options_resp = current_app.make_default_options_response()
        return options_resp.headers['allow']

    def decorator(f):
        def wrapped_function(*args, **kwargs):
            if automatic_options and request.method == 'OPTIONS':
                resp = current_app.make_default_options_response()
            else:
                resp = make_response(f(*args, **kwargs))
            if not attach_to_all and request.method != 'OPTIONS':
                return resp

            h = resp.headers

            h['Access-Control-Allow-Origin'] = origin
            h['Access-Control-Allow-Methods'] = get_methods()
            h['Access-Control-Max-Age'] = str(max_age)
            if headers is not None:
                h['Access-Control-Allow-Headers'] = headers
            return resp

        f.provide_automatic_options = False
        return update_wrapper(wrapped_function, f)
    return decorator
# end of snippet for flask crossdomain


class BCryptAuth(BasicAuth):
    def check_auth(self, email, password, allowed_roles, resource, method):
        users = app.data.driver.db['users']
        user = users.find_one({'email': email})
        return user and bcrypt.hashpw(password.encode('utf-8'), user['salt'].encode('utf-8')) == user['password']


app = Eve(auth=BCryptAuth)


@app.route('/login', methods = ['POST', 'OPTIONS'])
@crossdomain(origin='*',headers=['Content-Type','Authorization'])
def login():
    data = request.get_json()
    email = data.get('email')
    password = data.get('password')
    users = app.data.driver.db['users']
    user = users.find_one({'email': email})
    if user and bcrypt.hashpw(password.encode('utf-8'), user['salt'].encode('utf-8')) == user['password']:
        hashed = base64.b64encode(email+":"+password)
        resp = jsonify(id = str(user.get('_id')), auth = 'Basic '+hashed, role = user['role'], 
            username = user['username'])
        resp.status_code = 200
        return resp
    else:
        resp = jsonify(error = 'Wrong email or password.')
        resp.status_code = 401
        return resp


# change password to hash with salt before registering new user
def create_user(documents):
    for document in documents:
        document['salt'] = bcrypt.gensalt().encode('utf-8')
        password = document['password'].encode('utf-8')
        document['password'] = bcrypt.hashpw(password, document['salt'])
        document['role'] = 'user'

def check_conversation_id(documents):
    for document in documents:
        if document['conversation_id'] == 'dummy':
            document['conversation_id'] = str(uuid.uuid4())


app.on_insert_users += create_user
app.on_insert_conversations += check_conversation_id


if __name__ == '__main__':
    app.run(threaded=True,host=host,port=port)

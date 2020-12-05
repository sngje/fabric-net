import os
import time
from datetime import timedelta
from flask import Flask, session
from flask_sqlalchemy import SQLAlchemy
from flask_bcrypt import Bcrypt
from flask_login import LoginManager

app = Flask(__name__)
app.config['SECRET_KEY'] = 'c18caca2c8ecee93eda44c67b08c6ec1'
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///site.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['SQLALCHEMY_ECHO'] = False
app.url_map.strict_slashes = False
# app.config.update(

#     #Set the secret key to a sufficiently random value
#     SECRET_KEY=os.urandom(24),

#     #Set the session cookie to be secure
#     SESSION_COOKIE_SECURE=True,

# 	#Set templates to reload
# 	TEMPLATES_AUTO_RELOAD = True,

#     #Set the session cookie for our app to a unique name
#     SESSION_COOKIE_NAME='Hyperledgerfabric-WebSession',

#     #Set CSRF tokens to be valid for the duration of the session. This assumes you’re using WTF-CSRF protection
#     WTF_CSRF_TIME_LIMIT=None

# )

db = SQLAlchemy(app)
db.create_all()
bcrpyt = Bcrypt(app)
login_manager = LoginManager(app)
login_manager.login_view = 'login'
login_manager.login_message_category = 'info'
# login_manager.refresh_view = 'relogin'
# login_manager.needs_refresh_message = (u"Session timedout, please re-login")
# login_manager.needs_refresh_message_category = "info"

# @app.before_request
# def before_request():
#     session.permanent = True
#     app.permanent_session_lifetime = timedelta(minutes=1)

# Helper function to parse a raw timestamp to a desired format of "H:M:S dd/mm/yyy"
def myTimeFunc(timestamp):
	t = time.strftime('%Y-%m-%d %H:%M:%S', time.localtime(timestamp))
	return t

# Helper function to return header information with token
def header_info(token):
	headers = {
				'Access-Control-Allow-Origin': '*',
				'Content-Type': 'application/json',
				'Authorization': f'Bearer {token}'
			}
	return headers

# This allows using the above 3 functions in-line from the HTML templates 
app.jinja_env.globals.update(myTimeFunc=myTimeFunc) 
app.jinja_env.globals.update(header_info=header_info) 

from application import routes
from flask import Flask, session
from flask_sqlalchemy import SQLAlchemy
from flask_bcrypt import Bcrypt
from flask_login import LoginManager
from application.config import Config
from application.utils import myTimeFunc, header_info, daysCount, generate_QR

API_SERVER = 'http://localhost:3000/api'
db = SQLAlchemy()
bcrpyt = Bcrypt()
login_manager = LoginManager()
login_manager.login_view = 'users.login'
login_manager.login_message_category = 'info'


def create_app(config_class=Config):
    app = Flask(__name__)
    app.config.from_object(Config)

    db.init_app(app)
    bcrpyt.init_app(app)
    login_manager.init_app(app)

    @app.before_first_request
    def create_user():
        db.create_all()

    # This allows using the above 3 functions in-line from the HTML templates 
    app.jinja_env.globals.update(myTimeFunc=myTimeFunc) 
    app.jinja_env.globals.update(header_info=header_info)
    app.jinja_env.globals.update(daysCount=daysCount)
    app.jinja_env.globals.update(generate_QR=generate_QR)
    

    from application.users.routes import users
    from application.asset.routes import asset
    from application.grower.routes import grower
    from application.cultivator.routes import cultivator
    from application.supplier.routes import supplier

    app.register_blueprint(users)
    app.register_blueprint(asset)
    app.register_blueprint(grower)
    app.register_blueprint(cultivator)
    app.register_blueprint(supplier)

    return app

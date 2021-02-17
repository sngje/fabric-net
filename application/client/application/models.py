from datetime import datetime
from application import db, login_manager
from flask_login import UserMixin

@login_manager.user_loader
def load_user(user_id):
    return User.query.get(int(user_id))

class User(db.Model, UserMixin):
    # Set table name
    __tablename__ = "users"

    # Set column names and formats
    id = db.Column('id', db.Integer, primary_key = True)
    first_name = db.Column(db.String(100), nullable=True)
    last_name = db.Column(db.String(100), nullable=True)
    email = db.Column(db.String(100), unique=True, nullable=False)
    orgname = db.Column(db.String(50), nullable=False)
    location = db.Column(db.String(150), nullable=True)
    phone = db.Column(db.Integer, unique=True, nullable=True)
    password = db.Column(db.String(60), nullable=False)
    date_registred = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    image_file = db.Column(db.String(20), nullable=False, default='default.jpg')
    token = db.Column(db.String(250), nullable=True)

    # Model representor
    def __repr__(self):
        return f"User('{self.email}', '{self.orgname}', '{self.token}')"
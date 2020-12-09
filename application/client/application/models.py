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
    username = db.Column(db.String(100), unique=True, nullable=False)
    password = db.Column(db.String(60), nullable=False)
    orgname = db.Column(db.String(50), nullable=False)
    token = db.Column(db.String(250), nullable=True)

    # Model representor
    def __repr__(self):
        return f"User('{self.username}', '{self.orgname}', '{self.token}')"
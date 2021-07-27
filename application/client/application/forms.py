
from flask_wtf import FlaskForm
from flask_wtf.file import FileField, FileAllowed
from flask_login import current_user
from wtforms import StringField, PasswordField, SubmitField, BooleanField, TextAreaField, SelectField, IntegerField, DecimalField
from wtforms.validators import DataRequired, Length, Email, EqualTo, ValidationError, NumberRange
from application.models import User


class RegistirationForm(FlaskForm):
    # username = StringField('Username',validators=[DataRequired(), Length(min=2, max=20)])
    email = StringField('Email', validators=[DataRequired(), Email()])
    password = PasswordField('Password', validators=[DataRequired()])
    confirm_password = PasswordField('Confirm password', validators=[DataRequired(), EqualTo('password')])
    orgname = SelectField('Please choose your organization', validators=[DataRequired()],
                        choices=[('Org1', 'Grower farm'),
                                 ('Org2', 'Cultivator'),
                                 ('Org3', 'Supplier')])
    submit = SubmitField('Sign Up')

    # def validate_username(self, username):
    #     user = User.query.filter_by(username=username.data).first()
    #     if user:
    #         raise ValidationError('Tha username is taken for chosen organization, please choose another one!')
        
    def validate_email(self, email):
        user = User.query.filter_by(email=email.data).first()
        if user:
            raise ValidationError('Tha email is taken, please choose another one!')


class LoginForm(FlaskForm):
    email = StringField('Email', validators=[DataRequired()])
    password = PasswordField('Password', validators=[DataRequired()])
    remember = BooleanField('Remember me')
    submit = SubmitField('Login')

class CreateAssetForm(FlaskForm):
    product_serial = StringField('Product serial', validators=[DataRequired()])
    quantity = IntegerField('Price', validators=[DataRequired(), NumberRange(min=10, max=1000)], default=100)
    message = StringField('Label info', validators=[DataRequired()])
    submit = SubmitField('Create')


class CultivatorMedicineForm(FlaskForm):
    medicine = SelectField('Please choose medicine to record', validators=[DataRequired()],
                        choices=[('medicine1', 'Medicine 1'),
                                ('medicine2', 'Medicine 2'),
                                ('medicine3', 'Medicine 3'),
                                ('medicine4', 'Medicine 4')])
    submit = SubmitField('Record')

class DeliveryInfoForm(FlaskForm):
    plate_number = StringField('Plate number', validators=[DataRequired()])
    message = StringField('Label info', validators=[DataRequired()])
    submit = SubmitField('Proceedss')

class AdvancedSearchForm(FlaskForm):
    flag = SelectField('Please one of them', validators=[DataRequired()],
                        choices=[('PR', 'Grower farm'),
                                 ('CR', 'Cultivator'),
                                 ('SR', 'Supplier')])
    product_serial = StringField('Product serial', validators=[DataRequired()])
    submit = SubmitField('Search')

class UpdateAccountForm(FlaskForm):
    # username = StringField('Username', validators=[DataRequired(), Length(min=2, max=20)])
    email = StringField('Email')
    first_name = StringField('First name', validators=[DataRequired()])
    last_name = StringField('Last name', validators=[DataRequired()])
    location = StringField('Address', validators=[DataRequired()])
    phone = StringField('Phone number', validators=[DataRequired()])
    picture = FileField('Update profil photo', validators=[FileAllowed(['jpg', 'png'])])
    submit = SubmitField('Update')

    # def validate_username(self, username):
    #     if username.data != current_user.username:
    #         user = User.query.filter_by(username=username.data).first()
    #         if user:
    #             raise ValidationError('That username is taken. Please choose a different one.')

    def validate_email(self, email):
        if email.data != current_user.email:
            user = User.query.filter_by(email=email.data).first()
            if user:
                raise ValidationError('That email is taken. Please choose a different one.')
from flask import render_template, url_for, flash, redirect, Blueprint, request
from application import  db, bcrpyt, API_SERVER
from flask_login import current_user, login_user, logout_user, login_required
from application.models import User
from application.forms import RegistirationForm, LoginForm, UpdateAccountForm
from application.utils import save_file
import json, requests

users = Blueprint('users', __name__)

# Route: login page
@users.route("/login", methods=["POST", "GET"])
def login():
	if current_user.is_authenticated:
		return redirect(url_for('asset.index'))
	form  = LoginForm()
	if form.validate_on_submit():
		user = User.query.filter_by(email=form.email.data).first()
		if user and bcrpyt.check_password_hash(user.password, form.password.data):
			login_user(user, remember=True)
			req = {
				'email': f'{user.email}',
				'orgname': f'{user.orgname}'
			}
			req = json.loads(json.dumps(req))
			# send the data to get new token
			response_back = requests.post(f'{API_SERVER}/users/login', json=req)
			response = response_back.json()
			print(response)
			if response_back.status_code != 200:
				flash(req, "error")
				return redirect(url_for('users.register'))
			if response['success']:
				flash(response['message'], "success")
				user.token = response['token']
				db.session.commit()
				# next_page = request.args.get('next')
				if user.orgname == 'Org1':
					return redirect(url_for('grower.all'));
				elif user.orgname == 'Org2':
					return redirect(url_for('cultivator.all'));
				elif user.orgname == 'Org3':
					return redirect(url_for('supplier.all'));
				else:
					return redirect(url_for('users.register'));
				# return redirect(next_page) if next_page else redirect(url_for('asset.index'))
			else:
				flash(response['message'], "error")
			return redirect(url_for('users.login'))
		else:
			flash('Login Unsuccessful. Please check email and password', 'danger')
	return render_template('login.html', title="Login", form=form)

# Route: registeration page
@users.route("/register", methods=["POST", "GET"])
def register():
	if current_user.is_authenticated:
		return redirect(url_for('asset.index'))
	form = RegistirationForm()
	if form.validate_on_submit():
		req = {
			'email': f'{form.email.data}',
			'orgname': f'{form.orgname.data}'
		}
		req = json.loads(json.dumps(req))
		print(req)
		# send the data
		response = requests.post(f'{API_SERVER}/users/register', json=req) 
		if response.status_code != 200:
			flash("Something went wrong, please try again (", "error")
			return redirect(url_for('users.register'))
		response = response.json()
		if response['success']:
			hashed_password = bcrpyt.generate_password_hash(form.password.data).decode('utf-8')
			user = User(email=form.email.data, orgname=form.orgname.data, password=hashed_password)
			db.session.add(user)
			db.session.commit()
			flash('Your account has been created, please log in!', 'success')
			return redirect(url_for('users.login'))
		else:
			flash(response['message'], "error")
	return render_template('register.html', title='Registration', form=form)

# Route: Logout
@users.route("/logout")
def logout():
    logout_user()
    return redirect(url_for('users.login'))

@users.route("/profile")
@login_required
def profile():
    image_file = url_for('static', filename='profile_pics/' + current_user.image_file)
    return render_template('profile.html', title='My profile', image_file=image_file)

@users.route("/update-profile", methods=['POST', 'GET'])
@login_required
def update_profile():
    form = UpdateAccountForm()
    if form.validate_on_submit():
        if form.picture.data:
            picture_file = save_file(form.picture.data)
            current_user.image_file = picture_file
        current_user.first_name = form.first_name.data
        current_user.last_name = form.last_name.data
        current_user.location = form.location.data
        current_user.phone = form.phone.data
        db.session.commit()
        flash('Your account has been updated', 'success')
        return redirect(url_for('users.update_profile'))
    elif request.method == 'GET':
        form.email.data = current_user.email
        if (current_user.first_name): form.first_name.data = current_user.first_name
        if (current_user.last_name): form.last_name.data = current_user.last_name
        if (current_user.location): form.location.data = current_user.location
        if (current_user.phone): form.phone.data = current_user.phone
    image_file = url_for('static', filename='profile_pics/' + current_user.image_file)
    return render_template('update_profile.html', title='Edit ptofile', image_file=image_file, form=form)
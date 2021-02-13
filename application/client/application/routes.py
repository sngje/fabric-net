from flask import render_template, url_for, flash, redirect, request, abort, session
from application import app, db, bcrpyt, header_info
from .models import User
from .forms import RegistirationForm, LoginForm
from flask_login import login_user, current_user, logout_user, login_required
import requests, json, random, os, time, json, secrets

API_SERVER = 'http://localhost:3000/api'

# Route: home page
@app.route("/")
@app.route("/index")
@login_required
def index():
	if current_user.orgname == 'Org1':
		return redirect(url_for('grower_farm'));
	elif current_user.orgname == 'Org2':
		return redirect(url_for('processing_all'));
	elif current_user.orgname == 'Org3':
		return redirect(url_for('processing_all'));
	else:
		return redirect(url_for('register'));

# Route: login page
@app.route("/login", methods=["POST", "GET"])
def login():
	if current_user.is_authenticated:
		return redirect(url_for('index'))
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
				return redirect(url_for('register'))
			if response['success']:
				flash(response['message'], "success")
				user.token = response['token']
				db.session.commit()
				# next_page = request.args.get('next')
				if user.orgname == 'Org1':
					return redirect(url_for('grower_farm'));
				elif user.orgname == 'Org2':
					return redirect(url_for('processing_all'));
				elif user.orgname == 'Org3':
					return redirect(url_for('processing_all'));
				else:
					return redirect(url_for(index));
				# return redirect(next_page) if next_page else redirect(url_for('index'))
			else:
				flash(response['message'], "error")
			return redirect(url_for('signin'))
		else:
			flash('Login Unsuccessful. Please check email and password', 'danger')
	return render_template('login.html', title="Login", form=form)

# Route: registeration page
@app.route("/register", methods=["POST", "GET"])
def register():
	if current_user.is_authenticated:
		return redirect(url_for('index'))
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
			return redirect(url_for('register'))
		response = response.json()
		if response['success']:
			hashed_password = bcrpyt.generate_password_hash(form.password.data).decode('utf-8')
			user = User(email=form.email.data, orgname=form.orgname.data, password=hashed_password)
			db.session.add(user)
			db.session.commit()
			flash('Your account has been created, please log in!', 'success')
			return redirect(url_for('login'))
		else:
			flash(response['message'], "error")
	return render_template('register.html', title='Registration', form=form)


# Route: Logout
@app.route("/logout")
def logout():
    logout_user()
    return redirect(url_for('login'))

# Route: query cages page
@app.route("/grower-farm")
@app.route("/grower-farm/<string:bookmark>")
@login_required
def grower_farm(bookmark=0):
	headers = header_info(current_user.token)
	response = requests.get(f'{API_SERVER}/assets/all/{bookmark}', headers=headers) 
	transactions = response.json()
	print(transactions)
	if len(transactions['data']) == 0:
		return render_template('empty_list.html', title="Current state", text="Nothing found")
	return render_template('assets.html', title="Current state", bookmark=bookmark, transactions=transactions)

# Route: history page
@app.route("/assets/<string:asset_id>/history")
@login_required
def history(asset_id):
	headers = header_info(current_user.token)
	response = requests.get(f'{API_SERVER}/assets/{asset_id}/history', headers=headers) 
	transactions = response.json()
	return render_template(f'history.html', title=f"History for {asset_id}", asset_id=asset_id, transactions=transactions)


# Route: health_monitor check up
@app.route("/grower-farm/health_monitor")
@app.route("/grower-farm/health_monitor/<string:bookmark>")
@login_required
def health_monitor(bookmark=0):
	headers = header_info(current_user.token)
	response = requests.get(f'{API_SERVER}/assets/filter/health-monitor/{bookmark}', headers=headers) 
	if response.status_code != 200:
		flash("All cages are injected", "info")
		return redirect(url_for('grower_farm'))
	transactions = response.json()
	if len(transactions['data']) == 0:
		return render_template('empty_list.html', title="Health monitor", text="Nothing found")
	return render_template('health_monitor.html', title="Health monitor", bookmark=bookmark, transactions=transactions)

# Route: create cage
@app.route("/grower-farm/create", methods=["POST", "GET"])
@login_required
def create_asset():
	headers = header_info(current_user.token)
	if request.method == "POST":
		key = request.form['id']
		age = int(request.form['age'])
		# vaccination = 'true' if (request.form.get('vaccination', False)) != False else 'false'

		req = {'id': f'{key}', 'age': f'{age}'}
		req = json.loads(json.dumps(req))
		# send the data
		response = requests.post(f'{API_SERVER}/assets/create', json=req, headers=headers) 
		if response.status_code != 200:
			flash("Something went wrong, please try again (", "error")
			return redirect(url_for('create_asset'))
		transactions = response.json()
		flash(transactions['response'], "success")
		return redirect(url_for('grower_farm'))
	return render_template('create_asset.html', title="Create cage")

# Route: inject
@app.route("/assets/<string:asset_id>/update/vaccination")
@login_required
def update_vaccination(asset_id):
	headers = header_info(current_user.token)
	response = requests.put(f'{API_SERVER}/assets/{asset_id}/update/vaccination', headers=headers) 
	transactions = response.json()
	flash(transactions['response'], "success")
	return redirect(url_for('health_monitor'))
	# return render_template('transaction.html', title=f"Inject cage - {asset_id}", asset_id=asset_id, transactions=transactions)

# Route: changeage
@app.route("/assets/<string:asset_id>/update/age")
@login_required
def update_age(asset_id):
	headers = header_info(current_user.token)
	response = requests.put(f'{API_SERVER}/assets/{asset_id}/update/age', headers=headers) 
	transactions = response.json()
	print(transactions)
	if response.status_code != 200:
		flash(transactions['error'], "error")
		return redirect(url_for('grower_farm'))
	flash(transactions['response'], 'success')
	return redirect(url_for('grower_farm'))
	# return render_template('transaction.html', title=f"Change age - {asset_id}", asset_id=asset_id, transactions=transactions)

# Route: delete
@app.route("/assets/<string:asset_id>/delete")
@login_required
def delete(asset_id):
	headers = header_info(current_user.token)
	response = requests.delete(f'{API_SERVER}/assets/{asset_id}/delete', headers=headers) 
	if response.status_code != 200:
		flash('Cage not found', "warning")
		return redirect(url_for('grower_farm'))
	transactions = response.json()
	flash(transactions['response'], "success")
	return redirect(url_for('grower_farm'))
	# return render_template('transaction.html', title=f"Deleted - {asset_id}", asset_id=asset_id, transactions=transactions)

# Route: edit asset
@app.route("/assets/<string:asset_id>/edit", methods=["POST", "GET"])
@login_required
def edit(asset_id):
	headers = header_info(current_user.token)
	if request.method == "POST":
		age = request.form.get('age', 0)
		vaccination = request.form.get('vaccination', 0)
		step = request.form.get('step', 1)

		req = {
			'age': f'{age}',
			'vaccination': f'{vaccination}',
			'step': f'{step}'
			}
		req = json.loads(json.dumps(req))
		# print(req)

		response = requests.put(f'{API_SERVER}/assets/{asset_id}/edit', json=req, headers=headers)
		
		# check for error
		if response.status_code != 200:
			flash(req, "error")
			return redirect(url_for('grower_farm'))
		
		transactions = response.json()
		flash("Updated successfully", "success")
		flash(f"Transaction ID: {transactions['tx_id']}", "success")
		return redirect(url_for('grower_farm', asset_id=asset_id))
		# return render_template(f'edit.html', title=f"Data - {asset_id}", asset_id=asset_id, transactions=transactions)
	else:
		response = requests.get(f'{API_SERVER}/assets/{asset_id}', headers=headers) 
		
		# check for error
		if response.status_code != 200:
			flash("Cage not found", "error")
			return redirect(url_for('grower_farm'))

		transactions = response.json()
		return render_template(f'edit.html', title=f"Edit - {asset_id}", asset_id=asset_id, transactions=transactions)

# Route: create cage
@app.route("/assets/search/", methods=["POST", "GET"])
@login_required
def search():
	headers = header_info(current_user.token)
	if request.method == "GET":
		return render_template('search.html', title="Advanced search")

	age = int(request.form['age'])
	vaccination = request.form.get('vaccination', 'off')

	req = {
		'age': f'{age}',
		'vaccination': f'{vaccination}'
		}
	req = json.loads(json.dumps(req))
	# send the data
	response = requests.get(f'{API_SERVER}/assets/search/0/', json=req, headers=headers) 
	if response.status_code != 200:
		flash(req, "error")
		return redirect(url_for('search'))
	transactions = response.json()
	if len(transactions['data']) == 0:
		return render_template('empty_list.html', title="Advanced search results", text="Nothing found")
	flash("Founded results", "success")
	return render_template('assets.html', title="Advanced search results", transactions=transactions)

# Route: show all processing plant data
@app.route("/processing-plant/all")
@app.route("/processing-plant/all/<string:bookmark>")
@login_required
def processing_all(bookmark=0):
	headers = header_info(current_user.token)
	response = requests.get(f'{API_SERVER}/processing-plant/assets/all/{bookmark}', headers=headers) 
	if response.status_code != 200:
		flash("List is currently empty", "info")
		return redirect(url_for('index'))
	transactions = response.json()
	if len(transactions['data']) == 0:
		return render_template('empty_list.html', title="Processing plant", text="Nothing found")
	return render_template('processing_all.html', title="Processing plant - current state", bookmark=bookmark, transactions=transactions)

# Route: show all processing plant data
@app.route("/processing-plant/finished")
@app.route("/processing-plant/finished/<string:bookmark>")
@login_required
def processing_finished(bookmark=0):
	headers = header_info(current_user.token)
	response = requests.get(f'{API_SERVER}/processing-plant/assets/finished/{bookmark}', headers=headers) 
	if response.status_code != 200:
		flash("Error occured, please ask from back-end team", "info")
		return redirect(url_for('index'))
	transactions = response.json()
	if len(transactions['data']) == 0:
		return render_template('empty_list.html', title="Processing plant - finished products", text="Finished products not found")
	return render_template('processing_data.html', title="Processing plant - finished products", finished=True, bookmark=bookmark, transactions=transactions)

# Route: show all processing plant data - confirmation
@app.route("/processing-plant/confirmation")
@app.route("/processing-plant/confirmation/<string:bookmark>")
@login_required
def processing_confirmation(bookmark=0):
	headers = header_info(current_user.token)
	response = requests.get(f'{API_SERVER}/processing-plant/assets/confirmation/{bookmark}', headers=headers) 
	if response.status_code != 200:
		flash("List is currently empty", "info")
		return redirect(url_for('index'))
	transactions = response.json()
	if len(transactions['data']) == 0:
		return render_template('empty_list.html', title="Processing plant", text="Nothing found")
	return render_template('processing_data.html', title="Processing plant - confirmation", finished=False, bookmark=bookmark, transactions=transactions)


# Route: change asset status to PENDING for processing plant
@app.route("/processing-plant/<string:asset_id>/request")
@login_required
def processing_request(asset_id):
	headers = header_info(current_user.token)
	req = {
		'phase': 1
	}
	req = json.loads(json.dumps(req))
	response = requests.put(f'{API_SERVER}/processing-plant/{asset_id}/request', json=req, headers=headers) 
	# print(response)
	if response.status_code != 200:
		flash("Error occured, please ask from back-end team", "error")
		return redirect(url_for('grower_farm'))
	flash("Asset is now in waiting to get confirmation from Processing plant organization ", "success")
	return redirect(url_for('grower_farm'))
 
# Route: processing plant - start
@app.route("/processing-plant/<string:asset_id>", methods=["POST", "GET"])
@login_required
def processing_start(asset_id):
	headers = header_info(current_user.token)
	if request.method == "POST":
		acceptable = request.form.get('acceptable', 0)
		deliverer = request.form.get('deliverer', 0)

		req = {
			'acceptable': f'{acceptable}',
			'deliverer': f'{deliverer}'
			}
		req = json.loads(json.dumps(req))
		
		response = requests.put(f'{API_SERVER}/processing-plant/{asset_id}', json=req, headers=headers)
		
		# check for error
		if response.status_code != 200:
			flash(req, "error")
			return redirect(url_for('grower_farm'))
		
		transactions = response.json()
		flash("Updated successfully", "success")
		# return redirect(url_for('processing_start', asset_id=asset_id))
		return render_template(f'processing_plant.html', title=f"Processing plant - {asset_id}", asset_id=asset_id, transactions=transactions)
	else:
		response = requests.get(f'{API_SERVER}/assets/{asset_id}', headers=headers) 
		
		# check for error
		if response.status_code != 200:
			flash("Asset not found", "error")
			return redirect(url_for('processing_start', asset_id=asset_id))
		transactions = response.json()
		return render_template(f'processing_plant.html', title=f"Processing plant - {asset_id}", asset_id=asset_id, transactions=transactions)

# Route: request to delivery organization
@app.route("/delivery/<string:asset_id>/request")
@login_required
def delivery_request(asset_id):
	headers = header_info(current_user.token)
	req = {
		'phase': 2
	}
	req = json.loads(json.dumps(req))
	response = requests.put(f'{API_SERVER}/assets/{asset_id}/start-next-phase', json=req, headers=headers) 
	# print(response)
	if response.status_code != 200:
		flash("Error occured, please ask from back-end team", "error")
		return redirect(url_for('grower_farm'))
	flash("Asset is now in waiting to get confirmation from Processing plant organization ", "success")
	return redirect(url_for('grower_farm'))

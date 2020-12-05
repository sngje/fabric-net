from flask import render_template, url_for, flash, redirect, request, abort, session
from application import app, db, bcrpyt, header_info
from application.models import User
from application.forms import RegistirationForm, LoginForm
from flask_login import login_user, current_user, logout_user, login_required
import requests, json, random, os, time, json, secrets

# Route: index page
@app.route("/")
@app.route("/index")
@login_required
def index():
	return render_template('index.html', title="Options")

# Route: login page
@app.route("/login", methods=["POST", "GET"])
def login():
	if current_user.is_authenticated:
		return redirect(url_for('index'))
	form  = LoginForm()
	if form.validate_on_submit():
		user = User.query.filter_by(username=form.username.data).first()
		if user and bcrpyt.check_password_hash(user.password, form.password.data):
			login_user(user, remember=True)
			req = {
				'username': f'{user.username}',
				'orgname': f'{user.orgname}'
			}
			req = json.loads(json.dumps(req))
			# send the data to get new token
			r = requests.post('http://localhost:3000/api/login', json=req)
			response = r.json()
			print(response)
			if r.status_code != 200:
				flash(req, "error")
				return redirect(url_for('signin'))
			if response['success']:
				flash(response['message'], "success")
				user.token = response['token']
				db.session.commit()
				next_page = request.args.get('next')
				return redirect(next_page) if next_page else redirect(url_for('index'))
			else:
				flash(response['message'], "error")
			return redirect(url_for('signin'))
		else:
			flash('Login Unsuccessful. Please check username and password', 'danger')
	return render_template('login.html', title="Login", form=form)

# Route: registeration page
@app.route("/register", methods=["POST", "GET"])
def register():
	if current_user.is_authenticated:
		return redirect(url_for('index'))
	form = RegistirationForm()
	if form.validate_on_submit():
		req = {
			'username': f'{form.username.data}',
			'orgname': f'{form.orgname.data}'
		}
		req = json.loads(json.dumps(req))
		# send the data
		r = requests.post('http://localhost:3000/api/register', json=req) 
		if r.status_code != 200:
			flash(req, "error")
			return redirect(url_for('register'))
		response = r.json()
		if response['success']:
			hashed_password = bcrpyt.generate_password_hash(form.password.data).decode('utf-8')
			user = User(username=form.username.data, orgname=form.orgname.data, password=hashed_password, token=response['token'])
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
@app.route("/live/")
@app.route("/live/<string:next>")
@app.route("/live/<string:next>/<string:previous>")
@login_required
def allcages(next=0, previous=None):
	bookmark = next if (previous != None) else next
	headers = header_info(current_user.token)
	r = requests.get(f'http://localhost:3000/api/queryallcages/{bookmark}', headers=headers) 
	transactions = r.json()
	if (bookmark != 0):
		session['previous'] = bookmark
	previous = session.get('previous', None)
	return render_template('cages.html', title="Current state", previous=previous, transactions=transactions)

# Route: history page
@app.route("/history/<string:cage_id>")
@login_required
def history(cage_id):
	headers = header_info(current_user.token)
	r = requests.get(f'http://localhost:3000/api/history/{cage_id}', headers=headers) 
	transactions = r.json()
	return render_template(f'history.html', title=f"History for {cage_id}", cage_id=cage_id, transactions=transactions)


# Route: injection check up
@app.route("/health_monitor")
@app.route("/health_monitor/<string:bookmark>")
@login_required
def injection(bookmark=0):
	headers = header_info(current_user.token)
	r = requests.get(f'http://localhost:3000/api/injection/{bookmark}', headers=headers) 
	if r.status_code != 200:
		flash("All cages are injected", "info")
		return redirect(url_for('allcages'))
	transactions = r.json()
	return render_template('injection.html', title="Health monitor", transactions=transactions)

# Route: show all processing plant data
@app.route("/processing_plant/getall")
@app.route("/processing_plant/getall/<string:bookmark>")
@login_required
def processing_getall(bookmark=0):
	headers = header_info(current_user.token)
	r = requests.get(f'http://localhost:3000/api/processing_plant/getall/{bookmark}', headers=headers) 
	if r.status_code != 200:
		flash("List is currently empty", "info")
		return redirect(url_for('index'))
	transactions = r.json()
	return render_template('processing_getall.html', title="Processing plant - current state", transactions=transactions)

# Route: show all processing plant data
@app.route("/processing_plant/finished")
@app.route("/processing_plant/finished/<string:bookmark>")
@login_required
def processing_finished(bookmark=0):
	headers = header_info(current_user.token)
	r = requests.get(f'http://localhost:3000/api/processing_plant/finished/{bookmark}', headers=headers) 
	if r.status_code != 200:
		flash("List is currently empty", "info")
		return redirect(url_for('index'))
	transactions = r.json()
	return render_template('processing_finished.html', title="Processing plant - finished products", transactions=transactions)

# Route: inject
@app.route("/inject/<string:cage_id>")
@login_required
def inject(cage_id):
	headers = header_info(current_user.token)
	r = requests.put(f'http://localhost:3000/api/inject/{cage_id}', headers=headers) 
	transactions = r.json()
	flash(transactions['response'], "success")
	return render_template('transaction.html', title=f"Inject cage - {cage_id}", cage_id=cage_id, transactions=transactions)

# Route: changeage
@app.route("/changeage/<string:cage_id>")
@login_required
def changeage(cage_id):
	headers = header_info(current_user.token)
	r = requests.put(f'http://localhost:3000/api/changeage/{cage_id}', headers=headers) 
	transactions = r.json()
	flash(transactions['response'], "success")
	return render_template('transaction.html', title=f"Change age - {cage_id}", cage_id=cage_id, transactions=transactions)

# Route: delete
@app.route("/delete/<string:cage_id>")
@login_required
def delete(cage_id):
	headers = header_info(current_user.token)
	r = requests.delete(f'http://localhost:3000/api/delete/{cage_id}', headers=headers) 
	if r.status_code != 200:
		flash('Cage not found', "warning")
		return redirect(url_for('allcages'))
	transactions = r.json()
	flash(transactions['response'], "success")
	return render_template('transaction.html', title=f"Deleted - {cage_id}", cage_id=cage_id, transactions=transactions)

# Route: create cage
@app.route("/create_cage", methods=["POST", "GET"])
@login_required
def create_cage():
	headers = header_info(current_user.token)
	if request.method == "POST":
		key = request.form['id']
		age = int(request.form['age'])
		vaccination = 'true' if (request.form.get('vaccination', False)) != False else 'false'

		req = {
			'id': f'{key}',
			'age': f'{age}',
			'vaccination': f'{vaccination}'
			}
		req = json.loads(json.dumps(req))
		# send the data
		r = requests.post('http://localhost:3000/api/addcage', json=req, headers=headers) 
		if r.status_code != 200:
			flash(req, "error")
			return redirect(url_for('create_cage'))
		transactions = r.json()
		flash(transactions['response'], "success")
		return redirect(url_for('allcages'))
	return render_template('create_cage.html', title="Create cage")

# Route: create cage
@app.route("/search/", methods=["POST", "GET"])
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
	r = requests.get('http://localhost:3000/api/search/0/', json=req, headers=headers) 
	if r.status_code != 200:
		flash(req, "error")
		return redirect(url_for('search'))
	transactions = r.json()
	flash("Founded results", "success")
	return render_template('cages.html', title="Advanced search results", transactions=transactions)

# Route: individual cage
@app.route("/processing_plant/<string:cage_id>", methods=["POST", "GET"])
@login_required
def processing_plant(cage_id):
	headers = header_info(current_user.token)
	if request.method == "POST":
		acceptable = request.form.get('acceptable', 0)
		deliverer = request.form.get('deliverer', 0)

		req = {
			'acceptable': f'{acceptable}',
			'deliverer': f'{deliverer}'
			}
		req = json.loads(json.dumps(req))
		
		r = requests.put(f'http://localhost:3000/api/processing_plant/{cage_id}', json=req, headers=headers)
		
		# check for error
		if r.status_code != 200:
			flash(req, "error")
			return redirect(url_for('allcages'))
		
		transactions = r.json()
		flash("Updated successfully", "success")
		# return redirect(url_for('processing_plant', cage_id=cage_id, tx_id=transactions['tx_id']))
		return render_template(f'processing_plant.html', title=f"Processing plant - {cage_id}", cage_id=cage_id, transactions=transactions)
	else:
		r = requests.get(f'http://localhost:3000/api/query/{cage_id}', headers=headers) 
		
		# check for error
		if r.status_code != 200:
			flash("Cage not found", "error")
			return redirect(url_for('processing_plant', cage_id=cage_id))
		transactions = r.json()
		return render_template(f'processing_plant.html', title=f"Processing plant - {cage_id}", cage_id=cage_id, transactions=transactions)

# Route: edit asset
@app.route("/edit/<string:cage_id>", methods=["POST", "GET"])
@login_required
def edit(cage_id):
	headers = header_info(current_user.token)
	if request.method == "POST":
		age = request.form.get('age', 0)
		vaccination = request.form.get('vaccination', 0)
		step = request.form.get('step', 0)

		req = {
			'age': f'{age}',
			'vaccination': f'{vaccination}',
			'step': f'{step}'
			}
		req = json.loads(json.dumps(req))
		# print(req)

		r = requests.put(f'http://localhost:3000/api/edit/{cage_id}', json=req, headers=headers)
		
		# check for error
		if r.status_code != 200:
			flash(req, "error")
			return redirect(url_for('allcages'))
		
		transactions = r.json()
		flash("Updated successfully", "success")
		flash(f"Transaction ID: {transactions['tx_id']}", "success")
		# return redirect(url_for('processing_plant', cage_id=cage_id, tx_id=transactions['tx_id']))
		return render_template(f'edit.html', title=f"Data - {cage_id}", cage_id=cage_id, transactions=transactions)
	else:
		r = requests.get(f'http://localhost:3000/api/query/{cage_id}', headers=headers) 
		
		# check for error
		if r.status_code != 200:
			flash("Cage not found", "error")
			return redirect(url_for('allcages'))

		transactions = r.json()
		return render_template(f'edit.html', title=f"Edit - {cage_id}", cage_id=cage_id, transactions=transactions)

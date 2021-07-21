from flask import render_template, url_for, flash, redirect, request, Blueprint
import requests, json, json
from flask_login import current_user, login_required
from application import API_SERVER, header_info
from application.forms import CreateAssetForm

# from application.models import load_user

grower = Blueprint('grower', __name__)

# Route: query cages page
@grower.route("/grower-farm")
@grower.route("/grower-farm/<string:bookmark>")
@login_required
def all(bookmark=0):
	headers = header_info(current_user.token)
	response = requests.get(f'{API_SERVER}/assets/all/{bookmark}', headers=headers) 
	transactions = response.json()
	print(transactions)
	if len(transactions['data']) == 0:
		return render_template('empty_list.html', title="Current state", text="Nothing found")
	return render_template('assets.html', title="Current state", bookmark=bookmark, transactions=transactions)

# Route: health_monitor check up
@grower.route("/grower-farm/health_monitor")
@grower.route("/grower-farm/health_monitor/<string:bookmark>")
@login_required
def health_monitor(bookmark=0):
	headers = header_info(current_user.token)
	response = requests.get(f'{API_SERVER}/assets/filter/health-monitor/{bookmark}', headers=headers) 
	if response.status_code != 200:
		flash("All cages are injected", "info")
		return redirect(url_for('grower.all'))
	transactions = response.json()
	if len(transactions['data']) == 0:
		return render_template('empty_list.html', title="Health monitor", text="Nothing found")
	return render_template('health_monitor.html', title="Health monitor", bookmark=bookmark, transactions=transactions)

# Route: create cage
@grower.route("/grower-farm/create", methods=["POST", "GET"])
@login_required
def create_asset():
	headers = header_info(current_user.token)
	form  = CreateAssetForm()
	if form.validate_on_submit():
		product_serial = form.product_serial.data
		quantity = int(form.quantity.data)
		message = form.message.data
		# vaccination = 'true' if (request.form.get('vaccination', False)) != False else 'false'

		req = {'product_serial': f'{product_serial}', 'quantity': f'{quantity}', 'message': f'{message}'}
		req = json.loads(json.dumps(req))
		# send the data
		response = requests.post(f'{API_SERVER}/assets/create', json=req, headers=headers) 
		if response.status_code != 200:
			flash("Something went wrong, please try again (", "error")
			return redirect(url_for('grower.create_asset'))
		transactions = response.json()
		flash(transactions['response'], "success")
		return redirect(url_for('grower.all'))
	return render_template('create_asset.html', title="Create cage", form=form)




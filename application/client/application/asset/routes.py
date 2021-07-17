from flask import render_template, url_for, flash, redirect, request, Blueprint
import requests, json, json
from flask_login import current_user, login_required
from application import API_SERVER, header_info
asset = Blueprint('asset', __name__)

# Route: home page
@asset.route("/")
@asset.route("/index")
@login_required
def index():
	if current_user.orgname == 'Org1':
		return redirect(url_for('grower.grower_farm'))
	elif current_user.orgname == 'Org2':
		return redirect(url_for('processing.processing_all'))
	elif current_user.orgname == 'Org3':
		return redirect(url_for('delivery.delivery_all'))
	else:
		return redirect(url_for('users.register'))
		
# Route: history page
@asset.route("/assets/<string:asset_id>/history")
@login_required
def history(asset_id):
	headers = header_info(current_user.token)
	response = requests.get(f'{API_SERVER}/assets/{asset_id}/history', headers=headers) 
	transactions = response.json()
	return render_template(f'history.html', title=f"History for {asset_id}", asset_id=asset_id, transactions=transactions)

# Route: inject
@asset.route("/assets/<string:asset_id>/update/vaccination")
@login_required
def update_vaccination(asset_id):
	headers = header_info(current_user.token)
	response = requests.put(f'{API_SERVER}/assets/{asset_id}/update/vaccination', headers=headers) 
	transactions = response.json()
	flash(transactions['response'], "success")
	return redirect(url_for('grower.health_monitor'))
	# return render_template('transaction.html', title=f"Inject cage - {asset_id}", asset_id=asset_id, transactions=transactions)

# Route: changeage
@asset.route("/assets/<string:asset_id>/update/age")
@login_required
def update_age(asset_id):
	headers = header_info(current_user.token)
	response = requests.put(f'{API_SERVER}/assets/{asset_id}/update/age', headers=headers) 
	transactions = response.json()
	print(transactions)
	if response.status_code != 200:
		flash(transactions['error'], "error")
		return redirect(url_for('grower.grower_farm'))
	flash(transactions['response'], 'success')
	return redirect(url_for('grower.grower_farm'))
	# return render_template('transaction.html', title=f"Change age - {asset_id}", asset_id=asset_id, transactions=transactions)

# Route: delete
@asset.route("/assets/<string:asset_id>/delete")
@login_required
def delete(asset_id):
	headers = header_info(current_user.token)
	response = requests.delete(f'{API_SERVER}/assets/{asset_id}/delete', headers=headers) 
	if response.status_code != 200:
		flash('Cage not found', "warning")
		return redirect(url_for('grower.grower_farm'))
	transactions = response.json()
	flash(transactions['response'], "success")
	return redirect(url_for('grower.grower_farm'))
	# return render_template('transaction.html', title=f"Deleted - {asset_id}", asset_id=asset_id, transactions=transactions)

# Route: edit asset
@asset.route("/assets/<string:asset_id>/edit", methods=["POST", "GET"])
@login_required
def edit(asset_id):
	headers = header_info(current_user.token)
	if request.method == "POST":
		quantity = request.form.get('quantity', 0)
		product_serial = request.form.get('product_serial', 'NaN')
		message = request.form.get('message', 'Default')

		req = {
			'quantity': f'{quantity}',
			'product_serial': f'{product_serial}',
			'message': f'{message}'
			}
		req = json.loads(json.dumps(req))
		# print(req)

		response = requests.put(f'{API_SERVER}/assets/{asset_id}/edit', json=req, headers=headers)
		
		# check for error
		if response.status_code != 200:
			flash('Something went wrong, please try later!', "error")
			return redirect(url_for('grower.grower_farm'))
		
		transactions = response.json()
		flash("Updated successfully", "success")
		return redirect(url_for('grower.grower_farm', asset_id=asset_id))
		# return render_template(f'edit.html', title=f"Data - {asset_id}", asset_id=asset_id, transactions=transactions)
	else:
		response = requests.get(f'{API_SERVER}/assets/{asset_id}', headers=headers) 
		
		# check for error
		if response.status_code != 200:
			flash("Asset not found", "error")
			return redirect(url_for('grower.grower_farm'))

		transactions = response.json()
		return render_template(f'edit.html', title=f"Edit - {asset_id}", asset_id=asset_id, transactions=transactions)

# Route: create cage
@asset.route("/assets/search/", methods=["POST", "GET"])
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
		return redirect(url_for('asset.search'))
	transactions = response.json()
	if len(transactions['data']) == 0:
		return render_template('empty_list.html', title="Advanced search results", text="Nothing found")
	flash("Founded results", "success")
	return render_template('assets.html', title="Advanced search results", transactions=transactions)

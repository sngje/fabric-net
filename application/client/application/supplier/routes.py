from flask import render_template, url_for, flash, redirect, request, Blueprint
import requests, json, json
from flask_login import current_user, login_required
from application import API_SERVER, header_info
from application.forms import DeliveryInfoForm

supplier = Blueprint('supplier', __name__)

# Route: request to delivery organization
@supplier.route("/delivery/<string:asset_id>/request")
@login_required
def request(asset_id):
	headers = header_info(current_user.token)
	req = {
		'flag': 'SR'
	}
	req = json.loads(json.dumps(req))
	response = requests.put(f'{API_SERVER}/assets/{asset_id}/start-next-phase', json=req, headers=headers) 
	# print(response)
	if response.status_code != 200:
		flash("Error occured, please ask from back-end team", "error")
		return redirect(url_for('cultivator.all'))
	flash("Asset is added to waiting list. Supplier organization must confirm to proceed.", "success")
	return redirect(url_for('cultivator.all'))

# Route: show all processing plant data
@supplier.route("/delivery/all")
@supplier.route("/delivery/all/<string:bookmark>")
@login_required
def all(bookmark=0):
	headers = header_info(current_user.token)
	response = requests.get(f'{API_SERVER}/delivery/assets/all/{bookmark}', headers=headers) 
	if response.status_code != 200:
		flash("Something went wrong (", "error")
		return render_template('empty_list.html', title="Supplier", text="Nothing found")
	transactions = response.json()
	if len(transactions['data']) == 0:
		return render_template('empty_list.html', title="Supplier", text="Nothing found")
	return render_template('delivery_pages.html', title="Supplier - current state", bookmark=bookmark, transactions=transactions)

# Route: show all processing plant data
@supplier.route("/delivery/finished")
@supplier.route("/delivery/finished/<string:bookmark>")
@login_required
def finished(bookmark=0):
	headers = header_info(current_user.token)
	response = requests.get(f'{API_SERVER}/delivery/assets/finished/{bookmark}', headers=headers) 
	if response.status_code != 200:
		flash("Error occured, please ask from back-end team", "error")
		return render_template('empty_list.html', title="Supplier", text="Nothing found")
	transactions = response.json()
	if len(transactions['data']) == 0:
		return render_template('empty_list.html', title="Supplier - finished products", text="Finished products not found")
	return render_template('delivery_pages.html', title="Supplier - finished products", page="finished", bookmark=bookmark, transactions=transactions)

# Route: show all processing plant data - confirmation
@supplier.route("/delivery/confirmation")
@supplier.route("/delivery/confirmation/<string:bookmark>")
@login_required
def confirmation(bookmark=0):
	headers = header_info(current_user.token)
	response = requests.get(f'{API_SERVER}/delivery/assets/confirmation/{bookmark}', headers=headers) 
	if response.status_code != 200:
		flash("Something went wrong (", "error")
		return render_template('empty_list.html', title="Supplier", text="Nothing found")
	transactions = response.json()
	if len(transactions['data']) == 0:
		return render_template('empty_list.html', title="Supplier", text="Nothing found")
	return render_template('delivery_pages.html', title="Supplier - confirmation", page="confirmation", bookmark=bookmark, transactions=transactions)

# Route: processing plant - start
@supplier.route("/delivery/<string:asset_id>", methods=["POST", "GET"])
@login_required
def start(asset_id):
	headers = header_info(current_user.token)
	form  = DeliveryInfoForm()
	if form.validate_on_submit():
		plate_number = form.plate_number.data
		message = form.message.data

		if (plate_number is None or message is None):
			flash('Please enter all required fields!')
			return redirect(url_for('cultivator.start', asset_id=asset_id))
		req = {
			'plate_number': f'{plate_number}',
			'message': f'{message}'
			}
		req = json.loads(json.dumps(req))
		
		response = requests.put(f'{API_SERVER}/delivery/{asset_id}/start', json=req, headers=headers)
		
		# check for error
		if response.status_code != 200:
			flash("Error occured during the transaction, please contact with back-end team", "error")
			return redirect(url_for('supplier.all'))
		
		transactions = response.json()
		flash("Updated successfully", "success")
		return redirect(url_for('supplier.all', asset_id=asset_id))
		# return render_template(f'delivery_process.html', title=f"Supplier - {asset_id}", asset_id=asset_id, transactions=transactions)
	else:
		response = requests.get(f'{API_SERVER}/assets/{asset_id}', headers=headers) 
		
		# check for error
		if response.status_code != 200:
			flash("Asset not found", "error")
			return redirect(url_for('supplier.confirmation', asset_id=asset_id))
		transactions = response.json()
		return render_template(f'delivery_info.html', title=f"Supplier - {asset_id}", asset_id=asset_id, form=form, flag='SR', transactions=transactions)

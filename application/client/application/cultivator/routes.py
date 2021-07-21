from flask import render_template, url_for, flash, redirect, request, Blueprint
import requests, json, json
from flask_login import current_user, login_required
from application import API_SERVER, header_info
from application.forms import CultivatorMedicineForm, DeliveryInfoForm
# from application.models import load_user

cultivator = Blueprint('cultivator', __name__)

# Route: show all processing plant data
@cultivator.route("/cultivator/all")
@cultivator.route("/cultivator/all/<string:bookmark>")
@login_required
def all(bookmark=0):
	headers = header_info(current_user.token)
	response = requests.get(f'{API_SERVER}/processing-plant/assets/all/{bookmark}', headers=headers) 
	if response.status_code != 200:
		flash("Something went wrong", "error")
		return render_template('empty_list.html', title="Cultivator", text="Nothing found")
	transactions = response.json()
	if len(transactions['data']) == 0:
		return render_template('empty_list.html', title="Cultivator", text="Nothing found")
	return render_template('processing_plant_pages.html', title="Cultivator - current state", bookmark=bookmark, transactions=transactions)

# Route: show all processing plant data
@cultivator.route("/cultivator/finished")
@cultivator.route("/cultivator/finished/<string:bookmark>")
@login_required
def finished(bookmark=0):
	headers = header_info(current_user.token)
	response = requests.get(f'{API_SERVER}/processing-plant/assets/finished/{bookmark}', headers=headers) 
	if response.status_code != 200:
		flash("Error occured, please ask from back-end team", "info")
		return render_template('empty_list.html', title="Cultivator", text="Nothing found")
	transactions = response.json()
	if len(transactions['data']) == 0:
		return render_template('empty_list.html', title="Cultivator - finished products", text="Finished products not found")
	return render_template('processing_plant_pages.html', title="Cultivator - finished products", page="finished", bookmark=bookmark, transactions=transactions)

# Route: show all processing plant data - confirmation
@cultivator.route("/cultivator/confirmation")
@cultivator.route("/cultivator/confirmation/<string:bookmark>")
@login_required
def confirmation(bookmark=0):
	headers = header_info(current_user.token)
	response = requests.get(f'{API_SERVER}/processing-plant/assets/confirmation/{bookmark}', headers=headers) 
	if response.status_code != 200:
		flash("List is currently empty", "info")
		return render_template('empty_list.html', title="Cultivator", text="Nothing found")
	transactions = response.json()
	if len(transactions['data']) == 0:
		return render_template('empty_list.html', title="Cultivator", text="Nothing found")
	return render_template('processing_plant_pages.html', title="Cultivator - confirmation", page="confirmation", bookmark=bookmark, transactions=transactions)


# Route: change asset status to PENDING for processing plant
@cultivator.route("/cultivator/<string:asset_id>/request")
@login_required
def request(asset_id):
	headers = header_info(current_user.token)
	req = {
		'flag': 'CR'
	}
	req = json.loads(json.dumps(req))
	response = requests.put(f'{API_SERVER}/assets/{asset_id}/start-next-phase', json=req, headers=headers) 
	# print(response)
	if response.status_code != 200:
		flash("Error occured, please ask from back-end team", "error")
		return redirect(url_for('grower.all'))
	flash("Asset is added to waiting list. Processing Plant organization must confirm to proceed.", "success")
	return redirect(url_for('grower.all'))
 

@cultivator.route("/cultivator/<string:asset_id>/medicine", methods=['GET', 'POST'])
@login_required
def record_medicine(asset_id):
	headers = header_info(current_user.token)
	form  = CultivatorMedicineForm()
	if form.validate_on_submit():
		medicine = form.medicine.data

		req = {'medicine': f'{medicine}'}
		req = json.loads(json.dumps(req))
		# send the data
		response = requests.put(f'{API_SERVER}/processing-plant/{asset_id}/medicine', json=req, headers=headers) 
		if response.status_code != 200:
			flash("Something went wrong, please try again (", "error")
			return redirect(url_for('cultivator.all'))
		transactions = response.json()
		flash(transactions['response'], "success")
		return redirect(url_for('cultivator.all'))
	return render_template('cultivator_medicine.html', asset_id=asset_id, form=form)


# Route: processing plant - start
@cultivator.route("/cultivator/<string:asset_id>", methods=["POST", "GET"])
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
		
		response = requests.put(f'{API_SERVER}/processing-plant/{asset_id}/start', json=req, headers=headers)
		
		# check for error
		if response.status_code != 200:
			flash("Error occured during the transaction, please contact with back-end team", "error")
			return redirect(url_for('cultivator.all'))
		
		transactions = response.json()
		flash("Transaction made successfully", "success")
		return redirect(url_for('cultivator.all'))
		# return render_template(f'processing_plant.html', title=f"Cultivator - {asset_id}", asset_id=asset_id, transactions=transactions)
	else:
		response = requests.get(f'{API_SERVER}/assets/{asset_id}', headers=headers) 
		
		# check for error
		if response.status_code != 200:
			flash("Asset not found", "error")
			return redirect(url_for('cultivator.start', asset_id=asset_id))
		transactions = response.json()
		return render_template(f'delivery_info.html', title=f"Cultivator - {asset_id}", asset_id=asset_id, form=form, flag='CR', transactions=transactions)


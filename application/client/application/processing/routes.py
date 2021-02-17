from flask import render_template, url_for, flash, redirect, request, Blueprint
import requests, json, json
from flask_login import current_user, login_required
from application import API_SERVER, header_info
# from application.models import load_user

processing = Blueprint('processing', __name__)

# Route: show all processing plant data
@processing.route("/processing-plant/all")
@processing.route("/processing-plant/all/<string:bookmark>")
@login_required
def processing_all(bookmark=0):
	headers = header_info(current_user.token)
	response = requests.get(f'{API_SERVER}/processing-plant/assets/all/{bookmark}', headers=headers) 
	if response.status_code != 200:
		flash("Something went wrong", "error")
		return render_template('empty_list.html', title="Processing plant", text="Nothing found")
	transactions = response.json()
	if len(transactions['data']) == 0:
		return render_template('empty_list.html', title="Processing plant", text="Nothing found")
	return render_template('processing_plant_pages.html', title="Processing plant - current state", bookmark=bookmark, transactions=transactions)

# Route: show all processing plant data
@processing.route("/processing-plant/finished")
@processing.route("/processing-plant/finished/<string:bookmark>")
@login_required
def processing_finished(bookmark=0):
	headers = header_info(current_user.token)
	response = requests.get(f'{API_SERVER}/processing-plant/assets/finished/{bookmark}', headers=headers) 
	if response.status_code != 200:
		flash("Error occured, please ask from back-end team", "info")
		return render_template('empty_list.html', title="Processing plant", text="Nothing found")
	transactions = response.json()
	if len(transactions['data']) == 0:
		return render_template('empty_list.html', title="Processing plant - finished products", text="Finished products not found")
	return render_template('processing_plant_pages.html', title="Processing plant - finished products", page="finished", bookmark=bookmark, transactions=transactions)

# Route: show all processing plant data - confirmation
@processing.route("/processing-plant/confirmation")
@processing.route("/processing-plant/confirmation/<string:bookmark>")
@login_required
def processing_confirmation(bookmark=0):
	headers = header_info(current_user.token)
	response = requests.get(f'{API_SERVER}/processing-plant/assets/confirmation/{bookmark}', headers=headers) 
	if response.status_code != 200:
		flash("List is currently empty", "info")
		return render_template('empty_list.html', title="Processing plant", text="Nothing found")
	transactions = response.json()
	if len(transactions['data']) == 0:
		return render_template('empty_list.html', title="Processing plant", text="Nothing found")
	return render_template('processing_plant_pages.html', title="Processing plant - confirmation", page="confirmation", bookmark=bookmark, transactions=transactions)


# Route: change asset status to PENDING for processing plant
@processing.route("/processing-plant/<string:asset_id>/request")
@login_required
def processing_request(asset_id):
	headers = header_info(current_user.token)
	req = {
		'phase': 1
	}
	req = json.loads(json.dumps(req))
	response = requests.put(f'{API_SERVER}/assets/{asset_id}/start-next-phase', json=req, headers=headers) 
	# print(response)
	if response.status_code != 200:
		flash("Error occured, please ask from back-end team", "error")
		return redirect(url_for('grower.grower_farm'))
	flash("Asset is added to waiting list. Processing Plant organization must confirm to proceed.", "success")
	return redirect(url_for('grower.grower_farm'))
 
# Route: processing plant - start
@processing.route("/processing-plant/<string:asset_id>", methods=["POST", "GET"])
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
			flash("Error occured during the transaction, please contact with back-end team", "error")
			return redirect(url_for('processing.processing_all'))
		
		transactions = response.json()
		flash("Updated successfully", "success")
		return render_template(f'processing_plant.html', title=f"Processing plant - {asset_id}", asset_id=asset_id, transactions=transactions)
	else:
		response = requests.get(f'{API_SERVER}/assets/{asset_id}', headers=headers) 
		
		# check for error
		if response.status_code != 200:
			flash("Asset not found", "error")
			return redirect(url_for('processing.processing_start', asset_id=asset_id))
		transactions = response.json()
		return render_template(f'processing_plant.html', title=f"Processing plant - {asset_id}", asset_id=asset_id, transactions=transactions)


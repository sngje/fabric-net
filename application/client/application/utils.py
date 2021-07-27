import time
import os
import secrets
from datetime import datetime, timezone
from dateutil import parser
import qrcode
from PIL import Image
from flask import current_app

# Helper function to parse a raw timestamp to a desired format of "H:M:S dd/mm/yyy"
def myTimeFunc(timestamp):
	t = time.strftime('%Y-%m-%d %H:%M:%S', time.localtime(timestamp))
	return t

# Helper to conver ISO 8601 timestamp into python datetime object
def daysCount(timestamp, remaining_days=False):
	time_x = parser.parse(timestamp)
	time_x = time_x.replace(tzinfo=timezone.utc)
	time_y = datetime.now()
	time_y = time_y.replace(tzinfo=timezone.utc)
	if remaining_days:
		remaining_days = (time_y - time_x).days
		return remaining_days
	return myTimeFunc(time_x.timestamp())

# Helper function to return header information with token
def header_info(token):
	headers = {
				'Access-Control-Allow-Origin': '*',
				'Content-Type': 'application/json',
				'Authorization': f'Bearer {token}'
			}
	return headers

# Helper function to generate QR code image
def generate_QR(asset_id):
	qr_image = asset_id + '.png'
	file_path = os.path.join(current_app.root_path, 'static/qr-codes', qr_image)
	
	# Check before generate
	if (os.path.isfile(file_path)): return file_path
	print('Debug - Called QR generator')
	qr = qrcode.QRCode(
		version=1,
		error_correction=qrcode.constants.ERROR_CORRECT_H,
		box_size=8,
		border=4
	)
	qr.add_data(f'http://127.0.0.1:5000/assets/{asset_id}/history')
	qr.make(fit=True)
	
	img = qr.make_image(fill_color="black", back_color="white").convert('RGB')
	img.save(file_path)
	return file_path

def save_file(form_picture):
    random_hex = secrets.token_hex(8)
    _, f_ext = os.path.splitext(form_picture.filename)
    picture_fn = random_hex + f_ext
    picture_path = os.path.join(current_app.root_path, 'static/profile_pics', picture_fn)
    output_size = (125, 125)
    i = Image.open(form_picture)
    i.thumbnail(output_size)
    i.save(picture_path)
    return picture_fn
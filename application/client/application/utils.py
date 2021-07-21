import time, os
from datetime import datetime
from dateutil import parser
import qrcode
from PIL import Image

# Helper function to parse a raw timestamp to a desired format of "H:M:S dd/mm/yyy"
def myTimeFunc(timestamp):
	t = time.strftime('%Y-%m-%d %H:%M:%S', time.localtime(timestamp))
	return t

# Helper to conver ISO 8601 timestamp into python datetime object
def daysCount(timestamp, remaining_days=False):
	time_x = parser.parse(timestamp)
	time_x = time_x.replace(tzinfo=None)
	time_y = datetime.now()
	if remaining_days:
		remaining_days = (time_y - time_x).days
		return remaining_days
	return time_y.strftime("%Y-%m-%d, %H:%M:%S")

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
	current_path = os.path.abspath(os.curdir)
	file_path = f'{current_path}/application/static/qr-codes/{asset_id}.png'

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
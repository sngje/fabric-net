import time
from datetime import datetime
from dateutil import parser

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
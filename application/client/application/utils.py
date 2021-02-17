import time

# Helper function to parse a raw timestamp to a desired format of "H:M:S dd/mm/yyy"
def myTimeFunc(timestamp):
	t = time.strftime('%Y-%m-%d %H:%M:%S', time.localtime(timestamp))
	return t

# Helper function to return header information with token
def header_info(token):
	headers = {
				'Access-Control-Allow-Origin': '*',
				'Content-Type': 'application/json',
				'Authorization': f'Bearer {token}'
			}
	return headers
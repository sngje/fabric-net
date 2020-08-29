from flask import Flask, render_template, request, redirect, flash, url_for, session
import requests, json, random, os, time, json

app = Flask(__name__)

app.config.update(

    #Set the secret key to a sufficiently random value
    SECRET_KEY=os.urandom(24),

    #Set the session cookie to be secure
    SESSION_COOKIE_SECURE=True,

    #Set the session cookie for our app to a unique name
    SESSION_COOKIE_NAME='Hyperledgerfabric-WebSession',

    #Set CSRF tokens to be valid for the duration of the session. This assumes you’re using WTF-CSRF protection
    WTF_CSRF_TIME_LIMIT=None

)

# Helper function to parse a raw timestamp to a desired format of "H:M:S dd/mm/yyy"
def myTimeFunc(timestamp):
	t = time.strftime('%Y-%m-%d %H:%M:%S', time.localtime(timestamp))
	return t

# This allows using the above 3 functions in-line from the HTML templates 
app.jinja_env.globals.update(myTimeFunc=myTimeFunc) 


# Route: index page
@app.route("/")
@app.route("/index")
def index():
	return render_template('index.html')

# Route: query cages page
@app.route("/live/")
@app.route("/live/<string:next>")
@app.route("/live/<string:next>/<string:previous>")
def allcages(next=0, previous=None):
	bookmark = next if (previous != None) else next
	r = requests.get(f'http://localhost:3000/api/queryallcages/{bookmark}') 
	transactions = r.json()
	if (bookmark != 0):
		session['previous'] = bookmark
	previous = session.get('previous', None)
	return render_template('cages.html', title="Current state", previous=previous, transactions=transactions)

# Route: history page
@app.route("/history/<string:cage_id>")
def history(cage_id):
	r = requests.get(f'http://localhost:3000/api/history/{cage_id}') 
	transactions = r.json()
	return render_template(f'history.html', title="History for {cage_id}", cage_id=cage_id, transactions=transactions)


# Route: injection check up
@app.route("/health_monitor")
@app.route("/health_monitor/<string:bookmark>")
def injection(bookmark=0):
	r = requests.get(f'http://localhost:3000/api/injection/{bookmark}') 
	if r.status_code != 200:
		flash("All cages are injected", "info")
		return redirect(url_for('allcages'))
	transactions = r.json()
	return render_template('injection.html', title="Health monitor", transactions=transactions)

# Route: inject
@app.route("/inject/<string:cage_id>")
def inject(cage_id):
	r = requests.put(f'http://localhost:3000/api/inject/{cage_id}') 
	transactions = r.json()
	flash(transactions['response'], "success")
	return render_template('transaction.html', title=f"Inject cage - {cage_id}", cage_id=cage_id, transactions=transactions)

# Route: changeage
@app.route("/changeage/<string:cage_id>")
def changeage(cage_id):
	r = requests.put(f'http://localhost:3000/api/changeage/{cage_id}') 
	transactions = r.json()
	flash(transactions['response'], "success")
	return render_template('transaction.html', title=f"Change age - {cage_id}", cage_id=cage_id, transactions=transactions)

# Route: delete
@app.route("/delete/<string:cage_id>")
def delete(cage_id):
	r = requests.delete(f'http://localhost:3000/api/delete/{cage_id}') 
	if r.status_code != 200:
		flash('Cage not found', "warning")
		return redirect(url_for('allcages'))
	transactions = r.json()
	flash(transactions['response'], "success")
	return render_template('transaction.html', title=f"Deleted - {cage_id}", cage_id=cage_id, transactions=transactions)

# Route: create cage
@app.route("/create_cage", methods=["POST", "GET"])
def create_cage():
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
		r = requests.post('http://localhost:3000/api/addcage', json=req) 
		if r.status_code != 200:
			flash(req, "error")
			return redirect(url_for('create_cage'))
		transactions = r.json()
		flash(transactions['response'], "success")
		return redirect(url_for('allcages'))
	return render_template('create_cage.html', title="Cerate cage")

# Route: create cage
@app.route("/search/", methods=["POST", "GET"])
def search():

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
	r = requests.get('http://localhost:3000/api/search/0/', json=req) 
	if r.status_code != 200:
		flash(req, "error")
		return redirect(url_for('search'))
	transactions = r.json()
	flash("Founded results", "success")
	return render_template('cages.html', title="Advanced search results", transactions=transactions)

# Route: individual cage
@app.route("/processing_plant/<string:cage_id>", methods=["POST", "GET"])
def processing_plant(cage_id):
	
	if request.method == "POST":
		acceptable = request.form.get('acceptable', 0)
		deliverer = request.form.get('deliverer', 0)

		req = {
			'acceptable': f'{acceptable}',
			'deliverer': f'{deliverer}'
			}
		req = json.loads(json.dumps(req))
		
		r = requests.put(f'http://localhost:3000/api/processing_plant/{cage_id}', json=req)
		
		# check for error
		if r.status_code != 200:
			flash(req, "error")
			return redirect(url_for('allcages'))
		
		transactions = r.json()
		flash("Updated successfully", "success")
		# return redirect(url_for('processing_plant', cage_id=cage_id, tx_id=transactions['tx_id']))
		return render_template(f'processing_plant.html', title=f"Data - {cage_id}", cage_id=cage_id, transactions=transactions)
	else:
		r = requests.get(f'http://localhost:3000/api/query/{cage_id}') 
		
		# check for error
		if r.status_code != 200:
			flash("Cage not found", "error")
			return redirect(url_for('processing_plant', cage_id=cage_id))

		transactions = r.json()
		return render_template(f'processing_plant.html', title=f"Processing plant - {cage_id}", cage_id=cage_id, transactions=transactions)

# Route: edit asset
@app.route("/edit/<string:cage_id>", methods=["POST", "GET"])
def edit(cage_id):
	
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

		r = requests.put(f'http://localhost:3000/api/edit/{cage_id}', json=req)
		
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
		r = requests.get(f'http://localhost:3000/api/query/{cage_id}') 
		
		# check for error
		if r.status_code != 200:
			flash("Cage not found", "error")
			return redirect(url_for('allcages'))

		transactions = r.json()
		return render_template(f'edit.html', title=f"Edit - {cage_id}", cage_id=cage_id, transactions=transactions)


# When running this app on the local machine, default the port to 8000
port = int(os.getenv('PORT', 8080))

# Entry point to the program
if __name__ == "__main__":
    app.run(host='localhost', port=port, debug=True), SERVER_NAME

from flask import Flask, render_template, request, redirect, flash, url_for
import requests, json, random, os, time

app = Flask(__name__)

app.config.update(

    #Set the secret key to a sufficiently random value
    SECRET_KEY=os.urandom(24),

    #Set the session cookie to be secure
    SESSION_COOKIE_SECURE=True,

    #Set the session cookie for our app to a unique name
    SESSION_COOKIE_NAME='YourAppName-WebSession',

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
@app.route("/cages")
def allcages():
	r = requests.get('http://localhost:3000/api/queryallcages') 
	if r.json()==None or r.json()=={}:
		transactions = {}
	else:
		transactions = r.json()
	return render_template('cages.html', title="Current state", transactions=transactions)

# Route: history page
@app.route("/history/<string:cage_id>")
def history(cage_id):
	r = requests.get(f'http://localhost:3000/api/history/{cage_id}') 
	if r.json()==None or r.json()=={}:
		transactions = {}
	else:
		transactions = r.json()
	return render_template(f'history.html', title="History for {cage_id}", cage_id=cage_id, transactions=transactions)


# Route: injection check up
@app.route("/injection")
def injection():
	r = requests.get('http://localhost:3000/api/injection') 
	if r.status_code != 200:
		flash("Server error - 500", "info")
		return redirect(url_for('allcages'))
	if r.json()==None or r.json()=={}:
		transactions = {}
	else:
		transactions = r.json()
	flash(transactions['error'], "info")
	return render_template('injection.html', title="Health monitor", transactions=transactions)

# Route: inject
@app.route("/inject/<string:cage_id>")
def inject(cage_id):
	r = requests.put(f'http://localhost:3000/api/inject/{cage_id}') 
	if r.json()==None or r.json()=={}:
		transactions = {}
	else:
		transactions = r.json()
	return render_template('transaction.html', title=f"Inject cage - {cage_id}", cage_id=cage_id, transactions=transactions)

# Route: changeage
@app.route("/changeage/<string:cage_id>")
def changeage(cage_id):
	r = requests.put(f'http://localhost:3000/api/changeage/{cage_id}') 
	if r.json()==None or r.json()=={}:
		transactions = {}
	else:
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
	if r.json()==None or r.json()=={}:
		transactions = {}
	else:
		transactions = r.json()
	flash(transactions['response'], "success")
	return render_template('transaction.html', title=f"Deleted - {cage_id}", cage_id=cage_id, transactions=transactions)

# Route: create cage
@app.route("/add", methods=["POST", "GET"])
def add():
	# r = requests.delete(f'http://localhost:3000/api/delete/{cage_id}') 
	# if r.status_code != 200:
	# 	return redirect(url_for('index'))
	# if r.json()==None or r.json()=={}:
	# 	transactions = {}
	# else:
	# 	transactions = r.json()
	return render_template('create_cage.html', title="Cerate cage")



# When running this app on the local machine, default the port to 8000
port = int(os.getenv('PORT', 5000))

# Entry point to the program
if __name__ == "__main__":
    app.run(host='0.0.0.0', port=port, debug=True)

from flask import Flask, request, jsonify, render_template, send_from_directory
from flask_jwt_extended import create_access_token, get_jwt_identity, jwt_required, JWTManager
from flask_sqlalchemy import SQLAlchemy
from flask_mail import Message, Mail
from flask_cors import CORS
from dotenv import load_dotenv
from datetime import timedelta, datetime, timezone
import bcrypt
import os
import secrets
import mimetypes
from pymongo import MongoClient
from bson import ObjectId


mimetypes.add_type('application/javascript', '.js')
mimetypes.add_type('text/css', '.css')
app = Flask(__name__, static_folder='dist', static_url_path='', template_folder='dist')
app.config["JWT_SECRET_KEY"] = "fish"
app.config["JWT_ACCESS_TOKEN_EXPIRES"] = timedelta(hours=24)
MONGODB_URI = os.getenv('MONGODB_URI')
client = MongoClient(MONGODB_URI)
db = client['voting_app']
users_collection = db['voterz']

mail = Mail(app)
jwt = JWTManager(app)
CORS(app, origins=["https://voterz-pyg4.onrender.com", "http://localhost:3000"])

"""
class Users(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(50), nullable=False)
    email = db.Column(db.String(100), nullable=False, unique=True)
    password = db.Column(db.String(100), nullable=False)
    orgtype = db.Column(db.String(20))
    orgname = db.Column(db.String(100), nullable=False)

    elections = db.relationship('Elections', backref='user', lazy=True)  # Relationship with Elections table

    def __repr__(self):
        return f"<User {self.username}>"

    def set_password(self, password):
        self.password = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt())

    def check_password(self, password):
        return bcrypt.checkpw(password.encode('utf-8'), self.password)  

class Elections(db.Model):
    id = db.Column(db.String(5), primary_key=True, unique=True)
    title = db.Column(db.String(100), nullable=False)
    startDate = db.Column(db.DateTime, nullable=False)
    endDate = db.Column(db.DateTime, nullable=False)
    is_built = db.Column(db.Boolean, default=False)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'))
    questions = db.relationship('Questions', backref='election', lazy=True)
    status = db.Column(db.String(20), default="Upcoming")

    @property
    def current_status(self):
        now = datetime.now(timezone.utc)
        start = self.startDate.replace(tzinfo=timezone.utc)
        end = self.endDate.replace(tzinfo=timezone.utc)
        if not self.is_built:
            return "upcoming"
        elif now < start:
            return "upcoming"
        elif start <= now <= end:
            return "active"
        else:
            return "ended"

class Questions(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    question_text = db.Column(db.String(500), nullable=False)
    question_type = db.Column(db.String(50), nullable=False)  # e.g., 'multiple_choice', 'text', etc.
    options = db.Column(db.JSON)  # For storing multiple choice options
    election_id = db.Column(db.Integer, db.ForeignKey('elections.id'), nullable=False)

class Responses(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    election_id = db.Column(db.String(5), db.ForeignKey('elections.id'), nullable=False)
    question_id = db.Column(db.Integer, db.ForeignKey('questions.id'), nullable=False)
    response = db.Column(db.String(500), nullable=False)
    voter_ip = db.Column(db.String(45), nullable=False)
    submitted_at = db.Column(db.DateTime, default=datetime.utcnow)
"""

@app.route('/')
def serve_index():
    return render_template('index.html')


@app.route('/assets/<path:path>')
def serve_assets(path):
    return send_from_directory(os.path.join(app.static_folder, 'assets'), path)

# Serve other static files
@app.route('/<path:path>')
def serve_static(path):
    if os.path.exists(os.path.join(app.static_folder, path)):
        return send_from_directory(app.static_folder, path)
    return render_template('index.html')


@app.route("/api/signup", methods=["POST"])
def signup():
    try:
        username = request.json.get("username")
        email = request.json.get("email")
        password = request.json.get("password")
        orgtype = request.json.get("type")
        orgname = request.json.get("orgname")
        
        if not username or not email or not password or not orgtype or not orgname:
            return jsonify({"message":"Fill all fields"}), 400
        
        if db.users.find_one({"email": email}):
            return jsonify({"message": "Email is already in use"}), 400
        
        hashed_password = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt())
        new_user = {
            "username": username,
            "email": email,
            "password": hashed_password,
            "orgtype": orgtype,
            "orgname": orgname
        }
        result = db.users.insert_one(new_user)
        
        if result.inserted_id:
            return jsonify({"message": "User created successfully", "user_id": str(result.inserted_id)}), 201
        else:
            return jsonify({"message": "Failed to create user"}), 500
    except Exception as e:
        print(f"Error in signup: {str(e)}")
        return jsonify({"message": "An error occurred during signup", "error": str(e)}), 500
    

@app.route("/api/login", methods=["POST", "GET"])
def login():
    data = request.get_json()

    if not data:
        return jsonify({'error': 'Missing username or email'}), 400 

    email = data.get('email')
    password = data.get('password')

    user = db.users.find_one({"email": email})
    if not user:
        return jsonify({"message": "Account does not exist"}), 404
    
    if not bcrypt.checkpw(password.encode('utf-8'), user['password']):
        return jsonify({"message": "Invalid credentials"}), 401
        
    access_token = create_access_token(identity=str(user['_id']))
    return jsonify(access_token=access_token), 200

@app.route('/api/election', methods=["POST", "GET"])
@jwt_required()
def election():
    user_id = ObjectId(get_jwt_identity())
    if request.method == "POST":
        title = request.json.get("title")
        startDate = datetime.strptime(request.json.get("startDate"), "%Y-%m-%d").replace(tzinfo=timezone.utc)
        endDate = datetime.strptime(request.json.get("endDate"), "%Y-%m-%d").replace(tzinfo=timezone.utc)

        election_id = secrets.token_urlsafe(5)

        new_election = {
            "_id": election_id,
            "title": title,
            "startDate": startDate,
            "endDate": endDate,
            "user_id": user_id,
            "is_built": False,
            "status": "upcoming"
        }
        db.elections.insert_one(new_election)

        return jsonify({
            "message": "Election created successfully",
            "id": election_id
        }), 201

    if request.method == "GET":
        election_id = request.args.get('id')
        user = db.users.find_one({"_id": user_id})

        if election_id:
            election = db.elections.find_one({"_id": election_id, "user_id": user_id})
            if not election:
                return jsonify({"message": "Election not found or unauthorized"}), 404

            questions = list(db.questions.find({"election_id": election_id}))
            
            return jsonify({
                'id': election['_id'],
                'title': election['title'],
                'startDate': election['startDate'].isoformat(),
                'endDate': election['endDate'].isoformat(),
                "is_built": election['is_built'],
                "orgname": user['orgname'],
                "status": get_election_status(election),
                "questions": [{
                    'id': str(q['_id']),
                    'question_text': q['question_text'],
                    'question_type': q['question_type'],
                    'options': q['options']
                } for q in questions],
                "questions_count": len(questions)
            }), 200
        else:
            user_elections = list(db.elections.find({"user_id": user_id}))
            return jsonify([{
                'id': e['_id'],
                'title': e['title'],
                'startDate': e['startDate'].isoformat(),
                'endDate': e['endDate'].isoformat(),
                'is_built': e['is_built'],
                "orgname": user['orgname'],
                "status": get_election_status(e)
            } for e in user_elections]), 200

@app.route('/api/questions', methods=["POST", "GET"])
@jwt_required()
def manage_questions():
    user_id = ObjectId(get_jwt_identity())
    
    if request.method == "POST":
        questions_data = request.get_json()

        # Validate data and extract election_ids
        election_ids = []
        for question_data in questions_data:
            if not question_data.get('election_id') or not question_data.get('question_text') or not question_data.get('question_type') or not question_data.get('options'):
                return jsonify({"message": "Invalid data format"}), 400

            election_ids.append(question_data['election_id'])

        # Verify election ownership
        for election_id in election_ids:
            election = db.elections.find_one({"_id": election_id, "user_id": user_id})
            if not election:
                return jsonify({"message": "Election not found or unauthorized"}), 404

        # Create questions
        for question_data in questions_data:
            new_question = {
                "question_text": question_data['question_text'],
                "question_type": question_data['question_type'],
                "options": question_data['options'],
                "election_id": question_data['election_id']
            }
            db.questions.insert_one(new_question)

        return jsonify({"message": "Questions added successfully"}), 201

    if request.method == "GET":
        election_id = request.args.get("election_id")
        
        # Verify that the election belongs to the current user
        election = db.elections.find_one({"_id": election_id, "user_id": user_id})
        
        if not election:
            return jsonify({"message": "Election not found or unauthorized"}), 404

        questions = list(db.questions.find({"election_id": election_id}))
        questions_data = [{
            'id': str(question['_id']),
            'question_text': question['question_text'],
            'question_type': question['question_type'],
            'options': question['options']
        } for question in questions]
        
        return jsonify(questions_data), 200

@app.route('/api/preview', methods=['GET'])
@jwt_required()
def preview():
    user_id = ObjectId(get_jwt_identity())
    user = db.users.find_one({"_id": user_id})

    if not user:
        return jsonify({"message": "User not found"}), 404

    election_id = request.args.get('electionId')
    if not election_id:
        return jsonify({"message": "Election ID is required"}), 400

    election = db.elections.find_one({"_id": election_id, "user_id": user_id})
    if not election:
        return jsonify({"message": "Election not found or unauthorized"}), 404
    
    if get_election_status(election) == "ended":
        return jsonify({"message": "Election has ended"}), 403

    questions = list(db.questions.find({"election_id": election_id}))

    user_info = {
        "id": str(user['_id']),
        "orgname": user['orgname'],
        "election": {
            "id": election['_id'],
            "title": election['title'],
            "status": get_election_status(election),
            "questions": [
                {
                    "id": str(q['_id']),
                    "question_text": q['question_text'],
                    "question_type": q['question_type'],
                    "options": q['options']
                } for q in questions
            ]
        }
    }

    return jsonify(user_info), 200


@app.route('/api/live', methods=['GET'])
def live_election():
    #election_id = request.args.get('id')
    election_id = request.args.get('electionId')
    if not election_id:
        return jsonify({"message": "Election ID is required"}), 400
    
    print(f"Fetching election with ID: {election_id}")  # Debug line
    
    election = db.elections.find_one({"_id": election_id})
    if not election:
        return jsonify({"message": "Election not found"}), 404
    
    user = db.users.find_one({"_id": election['user_id']})
    questions = list(db.questions.find({"election_id": election_id}))

    election_data = {
        "orgname": user['orgname'],
        "election": {
            "id": election.id,
            "title": election.title,
            "status": election.status,
            "questions": [
                {
                    "id": str(q['_id']),
                    "question_text": q['question_text'],
                    "question_type": q['question_type'],
                    "options": q['options']
                } for q in questions
            ]
        }
    }

    return jsonify(election_data), 200

@app.route('/api/submit_ballot', methods=['POST'])
def submit_ballot():
    data = request.json
    election_id = data.get('election_id')
    responses = data.get('responses')

    if not election_id or not responses:
        return jsonify({"message": "Invalid data"}), 400

    # Check if the election exists and is ongoing
    election = db.elections.find_one({"_id": election_id})
    if not election:
        return jsonify({"message": "Election not found"}), 404

    voter_ip = request.remote_addr
    print(voter_ip)

    # Check if this IP has already voted in this election
    existing_vote = db.responses.find_one({"election_id": election_id, "voter_ip": voter_ip})
    if existing_vote:
        return jsonify({"message": "You have already submitted a ballot for this election"}), 400

    # Save responses
    for response in responses:
        question_id = response.get('question_id')
        answer = response.get('answer')
        new_response = {
            "election_id": election_id,
            "question_id": question_id,
            "response": answer,
            "voter_ip": voter_ip,
            "submitted_at": datetime.utcnow()
        }
        db.responses.insert_one(new_response)

    return jsonify({"message": "Ballot submitted successfully"}), 201

@app.route('/api/results', methods=['GET'])
@jwt_required()
def get_results():
    user_id = ObjectId(get_jwt_identity())
    user = db.users.find_one({"_id": user_id})

    if not user:
        return jsonify({"message": "User not found"}), 404
    
    election_id = request.args.get('electionId')
    if not election_id:
        return jsonify({"message": "Election ID is required"}), 400

    # Verify that the election belongs to the current user
    election = db.elections.find_one({"_id": election_id, "user_id": user_id})
    if not election:
        return jsonify({"message": "Election not found or unauthorized"}), 404

    questions = list(db.questions.find({"election_id": election_id}))
    user_info = {
        "id": str(user['_id']),
        "orgname": user['orgname'],
        "election": {
            "id": election['_id'],
            "title": election['title'],
            "questions": [
                {
                    "id": str(q['_id']),
                    "question_text": q['question_text'],
                    "question_type": q['question_type'],
                    "options": q['options'],
                    "votes": {}
                } for q in questions
            ]
        }
    }
    # Fetch all responses for this election
    responses = list(db.responses.find({"election_id": election_id}))

    # Group responses by question
    for response in responses:
        question_index = next((i for i, q in enumerate(user_info["election"]["questions"]) if str(q["id"]) == str(response['question_id'])), None)
        if question_index is not None:
            question = user_info["election"]["questions"][question_index]
            if response['response'] in question["options"]:
                if response['response'] in question["votes"]:
                    question["votes"][response['response']] += 1
                else:
                    question["votes"][response['response']] = 1

    return jsonify(user_info), 200

@app.route('/api/build', methods=['POST'])
@jwt_required()
def build_election():
    user_id = ObjectId(get_jwt_identity())
    user = db.users.find_one({"_id": user_id})

    if not user:
        return jsonify({"message": "User not found"}), 404

    election_id = request.args.get('electionId')
    if not election_id:
        return jsonify({"message": "Election ID is required"}), 400
    
    election = db.elections.find_one({"_id": election_id, "user_id": user_id})
    if not election:
        return jsonify({"message": "Election not found or unauthorized"}), 404

    if election['is_built']:
        print("I've built it already naw")
        return jsonify({"message": "Election is already built"}), 400

    # Build the election (implement your logic here)
    db.elections.update_one(
        {"_id": election_id},
        {"$set": {"is_built": True, "status": get_election_status(election)}}
    )
    print(f'Election {election_id} has been built and set active')

    return jsonify({"message": "Election built successfully"}), 200

def get_election_status(election):
    now = datetime.now(timezone.utc)
    start = election['startDate'].replace(tzinfo=timezone.utc)
    end = election['endDate'].replace(tzinfo=timezone.utc)
    if not election['is_built']:
        return "upcoming"
    elif now < start:
        return "upcoming"
    elif start <= now <= end:
        return "active"
    else:
        return "ended"

# Main app configuration
if __name__ == "__main__":
    app.run(debug=True, host='0.0.0.0', port=os.environ.get('PORT', 5000))
import os

from dotenv import load_dotenv
from pymongo import MongoClient

load_dotenv()

MONGO_URL = os.getenv("MONGO_URL")
DB_NAME = os.getenv("DB_NAME")

client = MongoClient(MONGO_URL)

db = client[DB_NAME]

incidents_collection = db["incidents"]
users_collection = db["users"]
responders_collection = db["responders"]
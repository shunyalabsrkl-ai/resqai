from fastapi import APIRouter
from app.database.mongodb import db


router = APIRouter(
    prefix="/responders",
    tags=["Responders"]
)


users_collection = db["users"]


@router.get("/")
def get_responders():

    responders = users_collection.find(
        {
            "role": "RESPONDER"
        }
    ).sort(
        "created_at",
        -1
    )

    result = []

    for responder in responders:

        result.append({
            "id": str(responder["_id"]),
            "name": responder.get(
                "name",
                "Unknown Responder"
            ),
            "phone": responder.get(
                "phone",
                ""
            ),
            "role": "RESPONDER",

            # Online tracking will be added next
            "status": responder.get(
                "status",
                "OFFLINE"
            ),

            "latitude": responder.get(
                "latitude"
            ),

            "longitude": responder.get(
                "longitude"
            ),

            "created_at": responder.get(
                "created_at"
            )
        })

    return result
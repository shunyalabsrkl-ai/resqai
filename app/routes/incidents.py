from fastapi import APIRouter, HTTPException
from datetime import datetime, timezone
from bson import ObjectId

from app.database.mongodb import (
    incidents_collection,
    users_collection,
)

from app.models.incident import (
    IncidentCreate,
    IncidentResponse,
)

from app.services.groq_service import analyze_emergency


router = APIRouter(
    prefix="/incidents",
    tags=["Incidents"]
)


# =====================================================
# CREATE INCIDENT
# =====================================================

@router.post("/", response_model=IncidentResponse)
async def create_incident(incident: IncidentCreate):

    try:
        ai_analysis = await analyze_emergency(
            incident.description
        )

        new_incident = {
            "description": incident.description,

            "emergency_type": ai_analysis.get(
                "emergency_type",
                incident.emergency_type or "OTHER"
            ),

            "severity": ai_analysis.get(
                "severity",
                "MEDIUM"
            ),

            "latitude": incident.latitude,
            "longitude": incident.longitude,

            "reporter_id": incident.reporter_id,

            "ai_analysis": ai_analysis,

            "status": "REPORTED",

            "assigned_responder_id": None,
            "assigned_responder_name": None,
            "assigned_at": None,

            "created_at": datetime.now(timezone.utc)
        }

        result = incidents_collection.insert_one(
            new_incident
        )

        return {
            "id": str(result.inserted_id),
            "description": incident.description,
            "emergency_type": new_incident["emergency_type"],
            "severity": new_incident["severity"],
            "status": "REPORTED"
        }

    except Exception as e:

        raise HTTPException(
            status_code=500,
            detail=f"Failed to create incident: {str(e)}"
        )


# =====================================================
# GET ALL INCIDENTS
# =====================================================

@router.get("/")
def get_all_incidents():

    try:

        incidents = incidents_collection.find().sort(
            "created_at",
            -1
        )

        result = []

        for incident in incidents:

            # -----------------------------------------
            # REPORTER
            # -----------------------------------------

            reporter_id = incident.get("reporter_id")

            reporter = None

            if reporter_id:

                try:
                    reporter = users_collection.find_one(
                        {
                            "_id": ObjectId(reporter_id)
                        }
                    )
                except Exception:
                    reporter = None

            reporter_name = "Unknown User"
            reporter_phone = None
            reporter_role = None

            if reporter:

                reporter_name = reporter.get(
                    "name",
                    "Unknown User"
                )

                reporter_phone = reporter.get(
                    "phone"
                )

                reporter_role = reporter.get(
                    "role"
                )

            # -----------------------------------------
            # RESPONDER
            # -----------------------------------------

            assigned_responder_id = incident.get(
                "assigned_responder_id"
            )

            assigned_responder_name = incident.get(
                "assigned_responder_name"
            )

            # If name was not saved, get it from users
            if (
                assigned_responder_id
                and not assigned_responder_name
            ):

                try:

                    responder = users_collection.find_one(
                        {
                            "_id": ObjectId(
                                assigned_responder_id
                            )
                        }
                    )

                    if responder:
                        assigned_responder_name = responder.get(
                            "name",
                            "Unknown Responder"
                        )

                except Exception:
                    pass

            # -----------------------------------------
            # RESULT
            # -----------------------------------------

            result.append({

                "id":
                    str(incident["_id"]),

                "description":
                    incident.get("description"),

                "emergency_type":
                    incident.get("emergency_type"),

                "severity":
                    incident.get("severity"),

                "latitude":
                    incident.get("latitude"),

                "longitude":
                    incident.get("longitude"),

                "reporter_id":
                    reporter_id,

                "reporter_name":
                    reporter_name,

                "reporter_phone":
                    reporter_phone,

                "reporter_role":
                    reporter_role,

                "status":
                    incident.get("status", "REPORTED"),

                "assigned_responder_id":
                    assigned_responder_id,

                "assigned_responder_name":
                    assigned_responder_name,

                "assigned_at":
                    incident.get("assigned_at"),

                "ai_analysis":
                    incident.get("ai_analysis"),

                "created_at":
                    incident.get("created_at")
            })

        return result

    except Exception as e:

        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch incidents: {str(e)}"
        )


# =====================================================
# ASSIGN RESPONDER
# =====================================================

@router.post("/{incident_id}/assign")
def assign_responder(
    incident_id: str,
    responder_id: str
):

    # -----------------------------------------
    # Validate incident ID
    # -----------------------------------------

    try:

        incident_object_id = ObjectId(
            incident_id
        )

    except Exception:

        raise HTTPException(
            status_code=400,
            detail="Invalid incident ID"
        )

    # -----------------------------------------
    # Find incident
    # -----------------------------------------

    incident = incidents_collection.find_one(
        {
            "_id": incident_object_id
        }
    )

    if not incident:

        raise HTTPException(
            status_code=404,
            detail="Incident not found"
        )

    # -----------------------------------------
    # Validate responder ID
    # -----------------------------------------

    try:

        responder_object_id = ObjectId(
            responder_id
        )

    except Exception:

        raise HTTPException(
            status_code=400,
            detail="Invalid responder ID"
        )

    # -----------------------------------------
    # Find responder
    # -----------------------------------------

    responder = users_collection.find_one(
        {
            "_id": responder_object_id
        }
    )

    if not responder:

        raise HTTPException(
            status_code=404,
            detail="Responder not found"
        )

    # -----------------------------------------
    # Check role
    # -----------------------------------------

    if str(
        responder.get("role", "")
    ).upper() != "RESPONDER":

        raise HTTPException(
            status_code=400,
            detail="Selected user is not a responder"
        )

    # -----------------------------------------
    # Assign
    # -----------------------------------------

    assigned_at = datetime.now(
        timezone.utc
    )

    incidents_collection.update_one(

        {
            "_id": incident_object_id
        },

        {
            "$set": {

                "assigned_responder_id":
                    str(responder["_id"]),

                "assigned_responder_name":
                    responder.get(
                        "name",
                        "Responder"
                    ),

                "assigned_at":
                    assigned_at,

                "status":
                    "ASSIGNED"
            }
        }
    )

    return {

        "message":
            "Responder assigned successfully",

        "incident_id":
            incident_id,

        "responder_id":
            str(responder["_id"]),

        "responder_name":
            responder.get(
                "name",
                "Responder"
            ),

        "status":
            "ASSIGNED"
    }


# =====================================================
# GET RESPONDER ASSIGNMENTS
# =====================================================
# This endpoint will be used by the responder mobile app.
# =====================================================

@router.get("/responder/{responder_id}/assignments")
def get_responder_assignments(
    responder_id: str
):

    incidents = incidents_collection.find(
        {
            "assigned_responder_id":
                responder_id,

            "status": {
                "$in": [
                    "ASSIGNED",
                    "RESPONDING"
                ]
            }
        }
    ).sort(
        "created_at",
        -1
    )

    result = []

    for incident in incidents:

        result.append({

            "id":
                str(incident["_id"]),

            "description":
                incident.get("description"),

            "emergency_type":
                incident.get("emergency_type"),

            "severity":
                incident.get("severity"),

            "latitude":
                incident.get("latitude"),

            "longitude":
                incident.get("longitude"),

            "status":
                incident.get("status"),

            "reporter_id":
                incident.get("reporter_id"),

            "assigned_responder_id":
                incident.get(
                    "assigned_responder_id"
                ),

            "assigned_responder_name":
                incident.get(
                    "assigned_responder_name"
                ),

            "assigned_at":
                incident.get("assigned_at"),

            "created_at":
                incident.get("created_at"),

            "ai_analysis":
                incident.get("ai_analysis")
        })

    return result


# =====================================================
# UPDATE INCIDENT STATUS
# =====================================================

@router.patch("/{incident_id}/status")
def update_incident_status(
    incident_id: str,
    status: str
):
    allowed_statuses = [
        "REPORTED",
        "ASSIGNED",
        "RESPONDING",
        "ARRIVED",
        "RESOLVED",
    ]

    status = status.upper()

    if status not in allowed_statuses:
        raise HTTPException(
            status_code=400,
            detail="Invalid incident status"
        )

    try:
        incident = incidents_collection.find_one(
            {"_id": ObjectId(incident_id)}
        )

    except Exception:
        raise HTTPException(
            status_code=400,
            detail="Invalid incident ID"
        )

    if not incident:
        raise HTTPException(
            status_code=404,
            detail="Incident not found"
        )

    update_data = {
        "status": status,
        "updated_at": datetime.now(timezone.utc),
    }

    incidents_collection.update_one(
        {"_id": ObjectId(incident_id)},
        {"$set": update_data}
    )

    return {
        "message": "Incident status updated",
        "id": incident_id,
        "status": status,
    }


# =====================================================
# GET SINGLE INCIDENT
# =====================================================

@router.get("/{incident_id}")
def get_incident(
    incident_id: str
):

    try:

        incident = incidents_collection.find_one(
            {
                "_id": ObjectId(incident_id)
            }
        )

    except Exception:

        raise HTTPException(
            status_code=400,
            detail="Invalid incident ID"
        )

    if not incident:

        raise HTTPException(
            status_code=404,
            detail="Incident not found"
        )

    # -----------------------------------------
    # Reporter
    # -----------------------------------------

    reporter_id = incident.get(
        "reporter_id"
    )

    reporter = None

    if reporter_id:

        try:

            reporter = users_collection.find_one(
                {
                    "_id": ObjectId(
                        reporter_id
                    )
                }
            )

        except Exception:

            reporter = None

    reporter_name = "Unknown User"
    reporter_phone = None
    reporter_role = None

    if reporter:

        reporter_name = reporter.get(
            "name",
            "Unknown User"
        )

        reporter_phone = reporter.get(
            "phone"
        )

        reporter_role = reporter.get(
            "role"
        )

    # -----------------------------------------
    # Return
    # -----------------------------------------

    return {

        "id":
            str(incident["_id"]),

        "description":
            incident.get("description"),

        "emergency_type":
            incident.get("emergency_type"),

        "severity":
            incident.get("severity"),

        "latitude":
            incident.get("latitude"),

        "longitude":
            incident.get("longitude"),

        "reporter_id":
            reporter_id,

        "reporter_name":
            reporter_name,

        "reporter_phone":
            reporter_phone,

        "reporter_role":
            reporter_role,

        "status":
            incident.get(
                "status",
                "REPORTED"
            ),

        "assigned_responder_id":
            incident.get(
                "assigned_responder_id"
            ),

        "assigned_responder_name":
            incident.get(
                "assigned_responder_name"
            ),

        "assigned_at":
            incident.get(
                "assigned_at"
            ),

        "ai_analysis":
            incident.get(
                "ai_analysis"
            ),

        "created_at":
            incident.get(
                "created_at"
            )
    }
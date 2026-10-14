NEED_TYPE_TO_ROLE = {
    "medical": "medical",
    "accident": "medical",
    "road_accident": "medical",
    "trauma": "medical",
    "fire": "fire_brigade",
    "burns": "fire_brigade",
    "explosion": "fire_brigade",
    "flood_rescue": "disaster_management",
    "rescue": "disaster_management",
    "shelter": "ngo",
    "food": "ngo",
    "police": "police",
    "traffic": "police",
    "crime": "police",
    "other": "disaster_management",
}

def resolve_responder_role(need_type: str | None = None) -> str:
    if not need_type:
        return "disaster_management"
    return NEED_TYPE_TO_ROLE.get(need_type.lower(), "disaster_management")
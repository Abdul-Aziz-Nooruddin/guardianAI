# Simple area-name -> coordinates lookup for Hyderabad.
# In production this would be a real geocoding API call.
AREA_COORDINATES = {
    "ameerpet": (17.4374, 78.4482),
    "kukatpally": (17.4849, 78.4108),
    "banjara hills": (17.4156, 78.4347),
    "secunderabad": (17.4399, 78.4983),
    "attapur": (17.3667, 78.4200),
    "miyapur": (17.4966, 78.3822),
    "lb nagar": (17.3457, 78.5533),
    "tarnaka": (17.4287, 78.5350),
}

DEFAULT_COORDINATES = (17.3850, 78.4867)  # Hyderabad city center fallback

def resolve_coordinates(location_text: str) -> tuple[float, float]:
    if not location_text:
        return DEFAULT_COORDINATES
    key = location_text.strip().lower()
    for area, coords in AREA_COORDINATES.items():
        if area in key or key in area:
            return coords
    return DEFAULT_COORDINATES
import json
import re
from pydantic import SecretStr
from langchain_groq import ChatGroq
from app.config import settings
from app.agents.victim_assistance.prompts import EXTRACTION_PROMPT, REPLY_PROMPT
from app.utils.locations import resolve_coordinates, AREA_COORDINATES

# Groq production model
try:
    llm = ChatGroq(
        api_key=SecretStr(settings.groq_api_key),
        model="llama-3.3-70b-versatile",
        temperature=0.1,
        timeout=10,
        stop_sequences=None,
    )
except Exception:
    llm = None

def extract_victim_count_from_text(msg: str) -> int:
    """
    Extracts explicit victim count from message or voice transcription.
    Defaults strictly to 1 unless plural or specific count is mentioned.
    Supports English, Roman Hindi / Hinglish, and Roman Telugu / Tenglish.
    """
    msg_clean = msg.strip()
    msg_lower = msg_clean.lower()

    # Explicit digit matches: e.g. "3 people injured", "4 casualties", "injured: 2", "3 log"
    digit_patterns = [
        r"\b(\d{1,3})\s*(?:people|persons|victims|casualties|patients|individuals|injured|hurt|trapped|stranded|passengers|workers|children|families|family members|bodies|log|mandi|janaa)\b",
        r"\b(?:injured|trapped|casualties|victims|affected|ghayal|zakhmi|debbathagilina)\s*(?:are|is|count|total|unaru|hai)?\s*:?\s*(\d{1,3})\b",
        r"\b(\d{1,3})\s*(?:of us|are in danger|got burned|are bleeding|fas gaye|irukkupoyaru)\b",
    ]
    for pattern in digit_patterns:
        match = re.search(pattern, msg_lower)
        if match:
            try:
                cnt = int(match.group(1))
                if cnt > 0:
                    return cnt
            except ValueError:
                pass

    # Standalone Telugu person-count nouns (iddaru = 2 people, mugguru = 3 people, etc.)
    telugu_count_map = {
        "iddaru": 2, "iddaram": 2, "iddariki": 2,
        "mugguru": 3, "mugguriki": 3,
        "naluguru": 4, "naluguriki": 4,
        "aiduguru": 5, "aiduguriki": 5,
        "aruguru": 6, "aruguriki": 6,
    }
    for t_word, t_cnt in telugu_count_map.items():
        if re.search(r"\b" + t_word + r"\b", msg_lower):
            return t_cnt

    # Word number matches: English, Roman Hindi (ek, do, teen, chaar...), Roman Telugu (okaru, iddaru...)
    word_map = {
        "one": 1, "two": 2, "three": 3, "four": 4, "five": 5, "six": 6, "seven": 7,
        "eight": 8, "nine": 9, "ten": 10, "eleven": 11, "twelve": 12, "thirteen": 13,
        "fourteen": 14, "fifteen": 15, "twenty": 20, "thirty": 30,
        # Roman Hindi / Urdu
        "ek": 1, "do": 2, "teen": 3, "chaar": 4, "char": 4, "paanch": 5, "panch": 5,
        "chhe": 6, "che": 6, "saat": 7, "sat": 7, "aath": 8, "ath": 8, "nau": 9, "das": 10,
    }
    word_pattern = (
        r"\b(one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|thirteen|fourteen|fifteen|twenty|thirty|"
        r"ek|do|teen|chaar|char|paanch|panch|chhe|che|saat|sat|aath|ath|nau|das)\s+"
        r"(?:people|persons|victims|casualties|patients|individuals|injured|hurt|trapped|stranded|passengers|workers|children|families|family members|of us|log|mandi|ghayal|zakhmi|janaa|chot)\b"
    )
    match_word = re.search(word_pattern, msg_lower)
    if match_word:
        w = match_word.group(1)
        if w in word_map:
            return word_map[w]

    # Specific relationship phrases indicating 2 people
    if re.search(r"\b(me and my|my \w+ and (?:me|i)|both of us|the two of us|hum dono|iddaram)\b", msg_lower):
        return 2

    # Default to 1 individual victim / reporter
    return 1

def fallback_extraction(message: str, has_media: bool = False) -> dict:
    """
    Deterministic NLP extractor with comprehensive support for:
    - Standard English
    - Roman Hindi / Hinglish (e.g. 'yaha aag lagi hai', 'bachao accident ho gaya')
    - Roman Telugu / Tenglish (e.g. 'ikkada manta antukundi', 'pramadam jarigindi kapadandi')
    - Roman Urdu (e.g. 'hadsa pesh aaya hai', 'zakhmi hain')
    - Devanagari Hindi & Telugu Unicode
    """
    msg_clean = message.strip()
    msg_lower = msg_clean.lower()

    # Exhaustive Emergency distress keywords across English and Romanized vernaculars
    EMERGENCY_KEYWORDS = [
        # English
        "accident", "crash", "collision", "hit", "injury", "injured", "bleed", "bleeding",
        "blood", "unconscious", "head injury", "fracture", "pain", "chest pain", "heart attack",
        "stroke", "breath", "breathing", "ambulance", "hospital", "patient", "casualty", "casualties",
        "fire", "burn", "burning", "smoke", "flame", "flames", "explosion", "blast", "gas leak",
        "flood", "flooding", "water", "drown", "drowning", "boat", "stranded", "trapped", "collapse",
        "collapsed", "building collapse", "rescue", "trauma",
        "police", "theft", "robbery", "fight", "assault", "brawl", "protest", "riot", "stampede",
        "corridor", "crime", "danger", "violent", "attacker",
        "help", "emergency", "urgent", "save", "sos", "dying", "dead", "critical",

        # Roman Hindi / Hinglish & Urdu (phonetic mother tongue typed in English letters)
        "aag", "aag lagi", "lagi hai", "jal raha", "jal rahi", "jal gaye", "dhuan", "dhuwan",
        "phat gaya", "dhamaka", "blast", "cylinder", "cylinder phata", "cylinder blast",
        "durghatna", "hadsa", "haadsa", "thuk gaya", "thok diya", "takkar", "takkar hui",
        "khoon", "khoon beh raha", "chot", "chot lagi", "ghayal", "zakhmi", "behosh",
        "mar gaya", "mar rahe", "jaan khatre", "saans nahi", "saans ruk", "dil ka daura",
        "aspataal", "aspatal", "dawakhana", "ambulance bhejo", "ambulance chahiye", "jaldi bhejo",
        "paani bhar", "paani ghus", "doob rahe", "doob gaya", "fas gaye", "phas gaye", "baadh",
        "marpeet", "maar peet", "chori", "lafda", "danga", "hamla", "gunda", "police bulao",
        "madad", "madad karo", "madad chahiye", "bachao", "bachaiye", "kripya madad", "jaldi aao", "jaan bachao",

        # Roman Telugu / Tenglish (phonetic mother tongue typed in English letters)
        "manta", "mantalu", "manta antukundi", "kalipotundi", "kalipoyindi", "poga", "cylinder pelindi",
        "pramadam", "pramadham", "accident ayyindi", "guddindi", "padipoyaru", "padipoyindi",
        "raktham", "raktham vasthundi", "debba", "debbathagilindi", "spruha", "spruha ledu",
        "swasa", "swasa aadatledu", "gunde noppi", "asupatri", "asupatriki", "ambulance pampandi", "ambulance kavali",
        "chachipotunnaru", "chachipotam", "pranalu",
        "neellu", "neellu munigipoyayi", "varada", "munigipoyindi", "munigipotunnam", "irukkupoyam",
        "godava", "kottukuntunnaru", "donga", "dadi", "police kavali",
        "sahayam", "sahayam kavali", "kapadandi", "dayachesi kapadandi", "ventane randi"
    ]

    has_emergency_keyword = any(k in msg_lower for k in EMERGENCY_KEYWORDS)

    # Detect language / dialect (English, Roman Hindi, Roman Telugu, Roman Urdu, or Native Script)
    lang_detected = "en-in"
    is_roman_hindi = any(w in msg_lower for w in [
        "yaha", "yahan", "aag", "lagi", "gaya", "gayi", "raha", "rahe", "hai", "hain",
        "bachao", "madad", "jaldi", "khoon", "chot", "ghayal", "bhejo", "kripya", "aspataal",
        "paani", "doob", "fas", "phas", "mar", "hamla", "kaise", "kya"
    ])
    is_roman_telugu = any(w in msg_lower for w in [
        "ikkada", "manta", "mantalu", "antukundi", "jarigindi", "ayyindi", "guddindi",
        "kapadandi", "sahayam", "raktham", "neellu", "unnam", "kavali", "undi", "unnaru",
        "pampandi", "randi", "asupatri", "pramadam", "debba", "ela"
    ])
    is_roman_urdu = any(w in msg_lower for w in [
        "hadsa", "haadsa", "zakhmi", "hifazat", "fauri", "sailab", "dhuwan", "bachaiye"
    ])

    if re.search(r"[\u0C00-\u0C7F]", message) or is_roman_telugu:
        lang_detected = "te-in"
    elif re.search(r"[\u0900-\u097F]", message) or is_roman_hindi:
        lang_detected = "hi-in"
    elif re.search(r"[\u0600-\u06FF]", message) or is_roman_urdu:
        lang_detected = "ur-in"

    # 1. Non-Emergency Greetings, Queries & Chit-Chat Screening
    if not has_emergency_keyword and not has_media:
        # Roman Hindi / Telugu / English greetings
        if re.search(r"\b(how are you|how r u|how do you do|how's it going|whats up|sup|kaise ho|kya haal|ela unnaru|bagunnara)\b", msg_lower):
            if lang_detected == "hi-in":
                reply = "Main Guardian AI hoon, Hyderabad ka 24/7 public safety system. Agar koi aapatkaal (accident, aag, injury) hai toh turant batayein, hum rescue teams dispatch karenge."
            elif lang_detected == "te-in":
                reply = "Nenu Guardian AI, Hyderabad emergency response system. Meeku edaina apathkalam (pramadam, manta, gayalu) unte ventane vivaralu cheppandi."
            else:
                reply = "I am operating normally and on active 24/7 standby! I am Guardian AI, the emergency response CAD assistant. If you need urgent assistance, please state the emergency and your location."

            return {
                "is_emergency": False,
                "intent": "greeting",
                "conversational_reply": reply,
                "location_text": "Non-Emergency Inquiry",
                "need_type": "none",
                "urgency": "none",
                "language_detected": lang_detected,
            }

        if re.search(r"\b(who are you|what are you|what is this|what can you do|how does this work|are you (an? )?ai|aap kaun ho|nuvvu evaru)\b", msg_lower):
            return {
                "is_emergency": False,
                "intent": "general_inquiry",
                "conversational_reply": (
                    "I am Guardian AI, an autonomous emergency intelligence system connecting citizens to hospital ICU beds, "
                    "fire stations, and rescue CAD units. If you are in an emergency, please describe the crisis and your location."
                ),
                "location_text": "Non-Emergency Inquiry",
                "need_type": "none",
                "urgency": "none",
                "language_detected": lang_detected,
            }

        if re.search(r"^(hi|hello|hey|heyy|namaste|vanakkam|salam|assalam|adaab|good (morning|afternoon|evening))\b", msg_lower):
            return {
                "is_emergency": False,
                "intent": "greeting",
                "conversational_reply": (
                    "Hello! Guardian Emergency Intake is online and ready. If you need emergency medical, fire, "
                    "or rescue assistance, please describe the situation and your location, or tap the microphone to dictate."
                ),
                "location_text": "Non-Emergency Inquiry",
                "need_type": "none",
                "urgency": "none",
                "language_detected": lang_detected,
            }

        if re.search(r"^(ok|okay|k|thanks|thank you|cool|great|bye|goodbye|nice|fine|shukriya|dhanyawad|dhanyavadalu)\b", msg_lower):
            return {
                "is_emergency": False,
                "intent": "chitchat",
                "conversational_reply": (
                    "Understood. Guardian Emergency Intake remains on 24/7 standby. Stay safe, and reach out immediately "
                    "if any emergency arises."
                ),
                "location_text": "Non-Emergency Inquiry",
                "need_type": "none",
                "urgency": "none",
                "language_detected": lang_detected,
            }

        # Ambiguous statement without distress
        return {
            "is_emergency": False,
            "intent": "general_inquiry",
            "conversational_reply": (
                "Guardian Public Safety Intake received your message. I am on active standby. If this is an emergency, "
                "please describe what happened (e.g. road accident, fire, injury) and your location so we can route the "
                "nearest responders immediately."
            ),
            "location_text": "Non-Emergency Inquiry",
            "need_type": "none",
            "urgency": "none",
            "language_detected": lang_detected,
        }

    # 2. Real Emergency Extraction
    location_text = "Hyderabad"
    for area in AREA_COORDINATES.keys():
        if area in msg_lower:
            location_text = area.title()
            break

    # Determine need_type and urgency from keywords (including Roman vernacular)
    if any(k in msg_lower for k in [
        "fire", "burn", "burning", "smoke", "flame", "flames", "explosion", "blast",
        "aag", "manta", "mantalu", "kalipotundi", "kalipoyindi", "dhuan", "dhuwan", "cylinder"
    ]):
        need_type = "fire"
        urgency = "critical"
    elif any(k in msg_lower for k in [
        "flood", "water", "drown", "boat", "stranded", "trapped",
        "paani", "neellu", "varada", "munigipoyindi", "munigipotunnam", "doob", "fas", "phas", "irukkupoyam"
    ]):
        need_type = "flood_rescue"
        urgency = "high"
    elif any(k in msg_lower for k in [
        "accident", "crash", "collision", "hit", "injury", "injured", "bleed", "bleeding",
        "blood", "unconscious", "head injury", "heart attack", "stroke", "ambulance", "hospital",
        "durghatna", "pramadam", "pramadham", "asupatri", "aspataal", "aspatal",
        "khoon", "raktham", "chot", "ghayal", "zakhmi", "hadsa", "haadsa", "guddindi", "thuk gaya",
        "takkar", "behosh", "swasa", "gunde noppi"
    ]):
        need_type = "medical"
        urgency = "critical" if any(k in msg_lower for k in [
            "bleed", "bleeding", "unconscious", "severe", "badly", "critical", "head",
            "khoon", "raktham", "behosh", "spruha ledu", "chachipotunnaru", "mar rahe"
        ]) else "high"
    elif any(k in msg_lower for k in [
        "police", "theft", "robbery", "fight", "assault", "brawl", "protest", "riot", "corridor", "crime",
        "marpeet", "maar peet", "chori", "lafda", "danga", "hamla", "godava", "kottukuntunnaru", "donga"
    ]):
        need_type = "police"
        urgency = "high"
    elif any(k in msg_lower for k in ["shelter", "stay", "place", "home", "aashray"]):
        need_type = "shelter"
        urgency = "medium"
    elif any(k in msg_lower for k in ["food", "ration", "hungry", "khana", "bhojanam"]):
        need_type = "food"
        urgency = "medium"
    else:
        need_type = "police" if any(k in msg_lower for k in ["road", "street", "car", "vehicle", "gadi", "vahanam"]) else "medical"
        urgency = "medium"

    victim_count = extract_victim_count_from_text(message)

    return {
        "is_emergency": True,
        "intent": "emergency_report",
        "location_text": location_text,
        "need_type": need_type,
        "urgency": urgency,
        "victim_count": victim_count,
        "language_detected": lang_detected,
    }

async def process_victim_message(
    message: str,
    user_id: str,
    latitude: float | None = None,
    longitude: float | None = None,
    accuracy: float | None = None,
    cell_tower_id: str | None = None,
    bssid: str | None = None,
    reporter_lat: float | None = None,
    reporter_lng: float | None = None,
    media_url: str | None = None,
    media_type: str | None = None,
) -> dict:
    has_media = bool(media_url)
    extracted = None

    if llm:
        try:
            extraction_response = await llm.ainvoke(EXTRACTION_PROMPT.format(message=message))
            content = str(extraction_response.content).strip()
            # Clean markdown codeblocks if any
            content = re.sub(r"^```json\s*", "", content)
            content = re.sub(r"\s*```$", "", content)
            extracted = json.loads(content)
        except Exception as e:
            print(f"LLM extraction fallback used: {e}")
            extracted = fallback_extraction(message, has_media=has_media)
    else:
        extracted = fallback_extraction(message, has_media=has_media)

    # Force emergency if visual media (photo/video proof) was provided by citizen
    if has_media and not extracted.get("is_emergency"):
        extracted["is_emergency"] = True
        extracted["intent"] = "emergency_report"

    # Handle Non-Emergency Case Immediately
    if not extracted.get("is_emergency", True):
        return {
            "is_emergency": False,
            "intent": extracted.get("intent", "greeting"),
            "victim_reply": extracted.get("conversational_reply") or (
                "Hello! I am Guardian AI, on active 24/7 emergency standby. Please state your emergency and location if you need assistance."
            ),
            "location_text": "Non-Emergency Inquiry",
            "need_type": "none",
            "urgency": "none",
            "raw_message": message,
            "user_id": user_id,
        }

    # Handle Real Emergency
    if latitude is not None and longitude is not None:
        lat = float(latitude)
        lng = float(longitude)
        gps_verified = True
        extracted["accuracy_meters"] = round(accuracy, 1) if accuracy else 5.0
        
        loc_name = extracted.get("location_text")
        if not loc_name or loc_name.strip().lower() in ("hyderabad", "unknown", ""):
            extracted["location_text"] = f"Live GPS ({lat:.4f}, {lng:.4f})"
        else:
            extracted["location_text"] = f"{loc_name} (GPS Verified)"
    else:
        lat, lng = resolve_coordinates(extracted.get("location_text", ""))
        gps_verified = False

    # Verify and set victim_count strictly based on message content (default 1)
    parsed_count = extract_victim_count_from_text(message)
    llm_count = extracted.get("victim_count")
    if isinstance(llm_count, (int, float)) and int(llm_count) > 1 and parsed_count > 1:
        extracted["victim_count"] = int(llm_count)
    else:
        extracted["victim_count"] = parsed_count

    extracted["is_emergency"] = True
    extracted["latitude"] = lat
    extracted["longitude"] = lng
    extracted["gps_verified"] = gps_verified
    extracted["raw_message"] = message
    extracted["user_id"] = user_id
    extracted["cell_tower_id"] = cell_tower_id
    extracted["bssid"] = bssid
    extracted["reporter_lat"] = reporter_lat if reporter_lat is not None else lat
    extracted["reporter_lng"] = reporter_lng if reporter_lng is not None else lng
    extracted["media_url"] = media_url
    extracted["media_type"] = media_type or ("video" if media_url and "video" in media_url else ("image" if media_url else None))

    nearest_shelter = "Govt Junior College, Banjara Hills"
    lang = extracted.get("language_detected", "en-in")
    loc_display = extracted.get('location_text') or f"{lat:.4f}, {lng:.4f}"

    if lang == "hi-in":
        victim_reply = f"Aapki emergency report darj kar li gayi hai ({loc_display}). Fire/Medical rescue teams ko turant dispatch kar diya gaya hai. Kripya surakshit rahein. Nearest relief camp: {nearest_shelter}."
    elif lang == "te-in":
        victim_reply = f"Mee emergency report record cheyabadindi ({loc_display}). Emergency responders ventane dispatch cheyabaddaru. Dayachesi surakshitamga undandi. Nearest relief camp: {nearest_shelter}."
    elif lang == "ur-in":
        victim_reply = f"Aapki emergency report darj ho chuki hai ({loc_display}). Fauri rescue aur emergency medical team rawana kar di gayi hai. Nearest relief camp: {nearest_shelter}."
    else:
        if gps_verified:
            victim_reply = f"Emergency report logged (Live GPS verified at {lat:.4f}, {lng:.4f}). Facilities screened and priority dispatch transmitted. Nearest relief camp: {nearest_shelter}."
        else:
            victim_reply = f"Emergency report logged for {loc_display}. Facilities screened and priority dispatch transmitted. Nearest relief camp: {nearest_shelter}."

    if llm:
        try:
            reply_response = await llm.ainvoke(REPLY_PROMPT.format(shelter_name=nearest_shelter))
            if reply_response and reply_response.content:
                victim_reply = str(reply_response.content).strip()
        except Exception:
            pass

    return {
        **extracted,
        "victim_reply": victim_reply,
        "user_id": user_id,
    }
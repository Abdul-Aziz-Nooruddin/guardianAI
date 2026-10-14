def build_reasoning(distribution_plan: list, hospitals: dict) -> list:
    reasoning = []
    for entry in distribution_plan:
        h = hospitals.get(entry["hospital_id"])
        if not h:
            continue
        icu_pct = round((1 - h["icu_available"] / h["icu_total"]) * 100) if h["icu_total"] else 0
        if icu_pct >= 85:
            reasoning.append(f"{h['name']} ICU capacity high ({icu_pct}%)")
        else:
            reasoning.append(f"{h['name']} ICU capacity available ({100 - icu_pct}% free)")
    return reasoning
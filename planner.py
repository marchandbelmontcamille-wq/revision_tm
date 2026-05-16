import csv
import io
from datetime import datetime, date, timedelta

# Rénovations techniques (gain %, durée jours, coût €)
RENO_TECHNIQUE = [
    {"name": "Rénovation légère", "gain": 10, "days": 8, "cost": 15000},
    {"name": "Rénovation importante", "gain": 20, "days": 14, "cost": 28000},
    {"name": "Rénovation majeure", "gain": 30, "days": 20, "cost": 40000},
]

# Rénovations intérieures (gain %, durée jours, coût €)
RENO_INTERIEUR = [
    {"name": "Remise en état des affichages", "gain": 3, "days": 1, "cost": 600},
    {"name": "Remise en état des barres de maintien", "gain": 10, "days": 2, "cost": 1500},
    {"name": "Réparation de la sellerie", "gain": 20, "days": 7, "cost": 2300},
    {"name": "Remise en état du revêtement du sol", "gain": 30, "days": 15, "cost": 3100},
]

REVISION = {"name": "Révision", "days": 1, "cost": 300}


def parse_csv(content):
    reader = csv.reader(io.StringIO(content), delimiter=";", quotechar='"')
    next(reader)
    buses = []
    for row in reader:
        if len(row) < 25:
            continue
        try:
            etat_tech = int(row[23])
        except (ValueError, IndexError):
            etat_tech = 100
        try:
            etat_int = int(row[24])
        except (ValueError, IndexError):
            etat_int = 100
        buses.append({
            "num_parc": row[1],
            "marque": row[5],
            "modele": row[6],
            "type": row[7],
            "etat_technique": etat_tech,
            "etat_interieur": etat_int,
        })
    return buses


def choose_reno_technique(etat_actuel):
    if etat_actuel >= 80:
        return None
    for reno in RENO_TECHNIQUE:
        if etat_actuel + reno["gain"] >= 80:
            return reno
    return RENO_TECHNIQUE[-1]


def choose_reno_interieur(etat_actuel):
    if etat_actuel >= 80:
        return None
    for reno in RENO_INTERIEUR:
        if etat_actuel + reno["gain"] >= 80:
            return reno
    return RENO_INTERIEUR[-1]


def generate_campaign(buses, name, start_date_str, nb_replacements, replacement_names):
    start = datetime.strptime(start_date_str, "%Y-%m-%d").date()

    # Phase 1 : technique — priorisé par pire état technique
    phase1_buses = [b for b in buses if b["etat_technique"] < 80]
    phase1_buses.sort(key=lambda b: b["etat_technique"])

    # Phase 2 : intérieur — priorisé par pire état intérieur
    phase2_buses = [b for b in buses if b["etat_interieur"] < 80]
    phase2_buses.sort(key=lambda b: b["etat_interieur"])

    tasks = []
    gantt = []
    # On a nb_replacements slots en parallèle
    # Chaque slot a une date de disponibilité
    slots = [start] * nb_replacements

    def schedule_bus(bus, reno, phase_label):
        nonlocal slots
        # Prend le slot le plus tôt disponible
        slot_idx = slots.index(min(slots))
        task_start = slots[slot_idx]
        reno_end = task_start + timedelta(days=reno["days"])
        # Révision après réno
        rev_end = reno_end + timedelta(days=REVISION["days"])

        replacement_name = replacement_names[slot_idx] if slot_idx < len(replacement_names) else f"Remplacement {slot_idx + 1}"

        tasks.append({
            "bus": f"{bus['num_parc']} - {bus['marque']} {bus['modele']}",
            "num_parc": bus["num_parc"],
            "phase": phase_label,
            "reno": reno["name"],
            "reno_days": reno["days"],
            "reno_cost": reno["cost"],
            "revision_cost": REVISION["cost"],
            "total_cost": reno["cost"] + REVISION["days"] * 0 + REVISION["cost"],
            "total_days": reno["days"] + REVISION["days"],
            "start": task_start.isoformat(),
            "end": rev_end.isoformat(),
            "replacement": replacement_name,
            "etat_avant": bus["etat_technique"] if "Technique" in phase_label else bus["etat_interieur"],
            "gain": reno["gain"],
            "done": False,
            "done_date": None,
        })

        gantt.append({
            "bus": f"{bus['num_parc']}",
            "label": f"{bus['num_parc']} - {reno['name']}",
            "start": task_start.isoformat(),
            "end": rev_end.isoformat(),
            "phase": phase_label,
            "replacement": replacement_name,
        })

        slots[slot_idx] = rev_end

    # Phase 1
    for bus in phase1_buses:
        reno = choose_reno_technique(bus["etat_technique"])
        if reno:
            schedule_bus(bus, reno, "Phase 1 — Technique")

    # Phase 2
    for bus in phase2_buses:
        reno = choose_reno_interieur(bus["etat_interieur"])
        if reno:
            schedule_bus(bus, reno, "Phase 2 — Intérieur")

    total_cost = sum(t["reno_cost"] + t["revision_cost"] for t in tasks)
    end_date = max(slots).isoformat() if slots else start.isoformat()

    campaign = {
        "id": int(datetime.now().timestamp()),
        "name": name,
        "created": date.today().isoformat(),
        "start_date": start_date_str,
        "end_date": end_date,
        "status": "active",
        "nb_replacements": nb_replacements,
        "replacement_names": replacement_names,
        "total_cost": total_cost,
        "tasks": tasks,
        "gantt": gantt,
    }
    return campaign

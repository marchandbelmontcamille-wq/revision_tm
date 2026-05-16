import csv
import io
import json
import os
from datetime import datetime, date
from functools import wraps
from flask import Flask, render_template, request, redirect, url_for, session
import storage

app = Flask(__name__)
app.secret_key = os.environ.get("SECRET_KEY", "dev-secret-key-change-me")
APP_PASSWORD = os.environ.get("APP_PASSWORD", "admin")


def login_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        if not session.get("logged_in"):
            return redirect(url_for("login"))
        return f(*args, **kwargs)
    return decorated


@app.route("/login", methods=["GET", "POST"])
def login():
    error = None
    if request.method == "POST":
        if request.form.get("password") == APP_PASSWORD:
            session["logged_in"] = True
            return redirect(url_for("index"))
        error = "Mot de passe incorrect"
    return render_template("login.html", error=error)


def parse_csv(content):
    reader = csv.reader(io.StringIO(content), delimiter=";", quotechar='"')
    next(reader)
    buses = []
    for row in reader:
        if len(row) < 17:
            continue
        rev_raw = row[16]
        if not rev_raw or rev_raw == "Jamais" or rev_raw.startswith("30/11/-0001"):
            rev_date = None
        else:
            try:
                rev_date = datetime.strptime(rev_raw, "%d/%m/%Y").strftime("%Y-%m-%d")
            except ValueError:
                rev_date = None
        buses.append({
            "num_parc": row[1],
            "marque": row[5],
            "modele": row[6],
            "type": row[7],
            "revision": rev_date,
        })
    return buses


def get_buses_needing_revision(buses):
    today = date.today()
    result = []
    for bus in buses:
        rev = bus["revision"]
        if not rev:
            result.append({**bus, "delta": None})
            continue
        try:
            d = datetime.strptime(rev, "%Y-%m-%d").date()
        except (ValueError, TypeError):
            result.append({**bus, "delta": None})
            continue
        delta = (d - today).days
        result.append({**bus, "delta": delta})
    result.sort(key=lambda x: x["delta"] if x["delta"] is not None else -9999)
    return result


@app.route("/logout")
def logout():
    session.pop("logged_in", None)
    return redirect(url_for("login"))


@app.route("/")
@login_required
def index():
    campaigns = storage.load_campaigns()
    campaigns.sort(key=lambda c: c["created"], reverse=True)
    return render_template("index.html", campaigns=campaigns)


@app.route("/campaigns/new", methods=["GET", "POST"])
@login_required
def campaign_new():
    if request.method == "POST":
        name = request.form.get("name", "").strip()
        file = request.files.get("csv_file")
        if not file:
            return "Fichier CSV requis", 400

        content = file.read().decode("utf-8")
        buses = parse_csv(content)
        candidates = get_buses_needing_revision(buses)

        if not name:
            name = f"Révision du {date.today().strftime('%d/%m/%Y')}"

        campaign = {
            "id": int(datetime.now().timestamp()),
            "name": name,
            "created": date.today().isoformat(),
            "status": "active",
            "buses": [{
                "num_parc": b["num_parc"],
                "marque": b["marque"],
                "modele": b["modele"],
                "type": b["type"],
                "revision_prevue": b["revision"],
                "delta": b["delta"],
                "done": False,
                "done_date": None
            } for b in candidates]
        }

        campaigns = storage.load_campaigns()
        campaigns.append(campaign)
        storage.save_campaigns(campaigns)
        return redirect(url_for("index"))

    return render_template("campaign_new.html")


@app.route("/campaigns/<int:campaign_id>")
@login_required
def campaign_detail(campaign_id):
    campaigns = storage.load_campaigns()
    campaign = next((c for c in campaigns if c["id"] == campaign_id), None)
    if not campaign:
        return "Campagne non trouvée", 404
    done_count = sum(1 for b in campaign["buses"] if b["done"])
    total = len(campaign["buses"])
    progress = int(done_count / total * 100) if total > 0 else 0
    return render_template("campaign_detail.html", campaign=campaign,
                           done_count=done_count, total=total, progress=progress)


@app.route("/campaigns/<int:campaign_id>/toggle/<num_parc>", methods=["POST"])
@login_required
def campaign_toggle(campaign_id, num_parc):
    campaigns = storage.load_campaigns()
    for campaign in campaigns:
        if campaign["id"] == campaign_id:
            for entry in campaign["buses"]:
                if entry["num_parc"] == num_parc:
                    entry["done"] = not entry["done"]
                    entry["done_date"] = date.today().isoformat() if entry["done"] else None
                    break
            if all(b["done"] for b in campaign["buses"]):
                campaign["status"] = "completed"
            else:
                campaign["status"] = "active"
            break
    storage.save_campaigns(campaigns)
    return redirect(url_for("campaign_detail", campaign_id=campaign_id))


@app.route("/campaigns/<int:campaign_id>/delete", methods=["POST"])
@login_required
def campaign_delete(campaign_id):
    campaigns = [c for c in storage.load_campaigns() if c["id"] != campaign_id]
    storage.save_campaigns(campaigns)
    return redirect(url_for("index"))


if __name__ == "__main__":
    app.run(debug=True, port=5000)

import csv
import io
import json
import os
from datetime import datetime, date, timedelta
from functools import wraps
from flask import Flask, render_template, request, redirect, url_for, session
import storage
import planner

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
        start_date = request.form.get("start_date", "")
        replacement_buses = request.form.get("replacement_buses", "").strip()

        if not file:
            return "Fichier CSV requis", 400

        content = file.read().decode("utf-8")
        buses = planner.parse_csv(content)

        if not name:
            name = f"Campagne du {date.today().strftime('%d/%m/%Y')}"
        if not start_date:
            start_date = date.today().isoformat()

        replacements = [b.strip() for b in replacement_buses.split(",") if b.strip()]
        nb_replacements = len(replacements) if replacements else 1

        campaign = planner.generate_campaign(buses, name, start_date, nb_replacements, replacements)

        campaigns = storage.load_campaigns()
        campaigns.append(campaign)
        storage.save_campaigns(campaigns)
        return redirect(url_for("campaign_detail", campaign_id=campaign["id"]))

    return render_template("campaign_new.html")


@app.route("/campaigns/<int:campaign_id>")
@login_required
def campaign_detail(campaign_id):
    campaign = storage.get_campaign(campaign_id)
    if not campaign:
        return "Campagne non trouvée", 404
    done_count = sum(1 for t in campaign["tasks"] if t["done"])
    total = len(campaign["tasks"])
    progress = int(done_count / total * 100) if total > 0 else 0

    # Calculer les positions pour le Gantt
    camp_start = date.fromisoformat(campaign["start_date"])
    camp_end = date.fromisoformat(campaign["end_date"])
    total_days = (camp_end - camp_start).days or 1
    for item in campaign["gantt"]:
        item_start = date.fromisoformat(item["start"])
        item_end = date.fromisoformat(item["end"])
        item["offset_pct"] = round((item_start - camp_start).days / total_days * 100, 1)
        item["width_pct"] = max(1, round((item_end - item_start).days / total_days * 100, 1))

    return render_template("campaign_detail.html", campaign=campaign,
                           done_count=done_count, total=total, progress=progress)


@app.route("/campaigns/<int:campaign_id>/toggle/<int:task_index>", methods=["POST"])
@login_required
def campaign_toggle(campaign_id, task_index):
    campaigns = storage.load_campaigns()
    for campaign in campaigns:
        if campaign["id"] == campaign_id:
            if 0 <= task_index < len(campaign["tasks"]):
                task = campaign["tasks"][task_index]
                task["done"] = not task["done"]
                task["done_date"] = date.today().isoformat() if task["done"] else None
            if all(t["done"] for t in campaign["tasks"]):
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

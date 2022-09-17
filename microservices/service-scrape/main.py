from flask import Flask, request, abort, jsonify
import os
from scrapers.place_scraper import runScraperForPlace
from scrapers.author_scraper import runScraperForAuthor

app = Flask(__name__)

@app.route('/health')
def health():
    return 'service-scrape is up and running'

@app.route("/v1/scraper/places/<placeId>", methods=["POST"])
def scrapePlace(placeId):
    data = request.get_json()
    url = data['googleMapsUrl']
    headless = True
    results = runScraperForPlace(placeId, url, headless)
    return jsonify(results)

@app.route("/v1/scraper/authors/<authorId>", methods=["POST"])
def scrapeAuthor(authorId):
    data = request.get_json()
    url = data['authorUrl']
    headless = True
    results = runScraperForAuthor(authorId, url, headless)
    return jsonify(results)


if __name__ == "__main__":
    app.run(debug=True, host="0.0.0.0", port=int(os.environ.get("PORT", 8081)))
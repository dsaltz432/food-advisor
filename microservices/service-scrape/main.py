from re import U
from flask import Flask, request, abort
import os
from place_scraper import scrapePlace


app = Flask(__name__)

@app.route('/health')
def health():
    return 'service-scrape is up and running'

@app.route("/v1/scraper/places/<placeId>", methods=["GET", "POST"])
def processScrapedPlace(placeId):
    # placeId is 1318c9bd-eec9-4817-b80f-0dad634436e8
    url = 'https://maps.google.com/?cid=4815629165680951502'
    headless = True
    if request.method == 'POST':
        print('Starting to scrape place: ', placeId)
        results = scrapePlace(placeId, url, headless)
        print(results)
        return "status: scraping"
    else:
        print('Getting scraped data for place: ', placeId)
        abort(404)


if __name__ == "__main__":
    app.run(debug=True, host="0.0.0.0", port=int(os.environ.get("PORT", 8081)))
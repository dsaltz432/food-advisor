import json
import os
import time
import sys
from bs4 import BeautifulSoup
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.options import Options
import selenium
import platform

if (len(sys.argv)) != 4:
    print('Must pass in the authorId, url, and headless as cmd line arguments')
    print(sys.argv)
    os._exit(1)

authorId = sys.argv[1]
url = sys.argv[2]
headless = sys.argv[3] == 'true'
print('Scraping reviews for author', authorId, ', URL', url, ', headless: ', headless)
print('selenium version: ', selenium.__version__)
print('webdriver version: ', webdriver.__version__)
print('chrome: : ', selenium.webdriver.chrome)
print('OS: ', platform.platform())

options = Options()
options.add_argument('--no-sandbox')
options.headless = headless
options.add_argument('--disable-dev-shm-usage')
options.add_argument('--remote-debugging-port=9222')
driver = webdriver.Chrome(options=options)
print('driver capabilities: ', driver.capabilities)
driver.get(url)
time.sleep(3) # could convert this to a "wait until" thing later

def get_int(num):
    return int(num.replace(',', ''))

def get_total_expected_reviews_for_place():
    try:
        elementText = driver.find_element(By.CLASS_NAME, 'Qha3nb').text
        numReviews = get_int(elementText.split(" ")[0])
        # print('numReviews =',numReviews)
        return numReviews
    except:
        # print('Unable to find total_expected_number_of_reviews. Assuming 0 reviews.')
        return 0

def get_total_expected_ratings_for_place():
    try:
        elementText = driver.find_element(By.CLASS_NAME, 'Qha3nb').text
        if "rating" not in elementText:
            # print('numRatings = 0')
            return 0
        numRatings = get_int(elementText.split('rating')[0].split(' ')[-2].strip())
        # print('numRatings =',numRatings)
        return numRatings
    except:
        # print('Unable to find get_total_expected_rating_for_place. Assuming 0 ratings.')
        return 0

total_expected_number_of_reviews = get_total_expected_reviews_for_place()
total_expected_number_of_ratings = get_total_expected_ratings_for_place()
total_combined_reviews = total_expected_number_of_reviews + total_expected_number_of_ratings

if total_combined_reviews == 0:
    print('No reviews, so ending here', url)
    os._exit(0) # Exit with code 0 so it doesn't throw an error

def get_scrollable_element():
    try:
        return driver.find_element(By.XPATH, '//*[@id="QA0Szd"]/div/div/div[1]/div[2]/div/div[1]/div/div/div[6]')
    except:
        pass
    try:
        return driver.find_element(By.XPATH, '//*[@id="QA0Szd"]/div/div/div[1]/div[2]/div/div[1]/div/div/div[5]')
    except:
        pass
    print('Unable to find scrollable_div in get_scrollable_element()')
    os._exit(1)


# Find scrollable element
scrollable_div = get_scrollable_element()

# Scroll down the review sidebar until we've loaded all reviews for this place
while True:

    # Get current height
    last_height = driver.execute_script("var height=arguments[0].scrollHeight;return height;", scrollable_div)

    # Scroll down to bottom
    driver.execute_script('arguments[0].scrollTop = arguments[0].scrollHeight', scrollable_div)

    # Wait to load page
    time.sleep(3)

    # Get updated height
    new_height = driver.execute_script("var height=arguments[0].scrollHeight;return height;", scrollable_div)

    # Calculate new scroll height and compare with last scroll height
    if new_height == last_height:
        break

    # Update last_height
    last_height = new_height


# Find all reviews that have the "More" button visible to expand the review text, and click each button to expand the text
see_more_elements = driver.find_elements(By.CLASS_NAME, 'w8nwRe')
for see_more_element in see_more_elements:
    try:
        see_more_element.click()
    except:
        print('Error while clicking on see_more_element', authorId)


def get_author_level():
    try:
        levelXPath = '//*[@id="QA0Szd"]/div/div/div[1]/div[2]/div/div[1]/div/div/div[2]/div[2]/div[3]/span'
        levelTagPieces = driver.find_element(By.XPATH, levelXPath).text.strip().split('Level')
        if len(levelTagPieces) == 2:
            return get_int(levelTagPieces[1].strip())
        else:
            # this is a local guide with no reviews
            return
    except:
        # print('Unable to find get_author_level. Assuming level is null', url)
        return

def get_author_points():
    try:
        points_span_elements = driver.find_elements(By.CLASS_NAME, 'VEEl9c')
        numSpans = len(points_span_elements)
        if numSpans == 0:
            return
        elif numSpans == 1:
            return get_int(points_span_elements[0].text.split(' ')[0].strip())
        else:
            print('Warning! Found multiple spans - not handled!')
            return
    except:
        # print('Unable to find get_author_points. Assuming points is null', url)
        return


# Parse some info about this author which is consistent across all reviews
author_object = {}
author_object['authorLevel'] = get_author_level()
author_object['authorPoints'] = get_author_points()
author_object['totalReviews'] = total_expected_number_of_reviews
author_object['totalRatings'] = total_expected_number_of_ratings


# Now that we've scrolled down the entire page, parse the HTML to get the review data

soup = BeautifulSoup(driver.page_source, 'html.parser')

reviewBlobs = soup.find_all('div', {'data-review-id': True, 'class': 'jftiEf'})

review_objects = []

for reviewBlob in reviewBlobs:

    review_object = {}

    placeData = reviewBlob.find('div', {'class':['WNxzHc']})

    placeName = placeData.find('div', {'class': 'd4r55'}).text.strip()
    review_object['placeName'] = placeName

    placeAddress = placeData.find('div', {'class': 'RfnDt'}).text.strip()
    review_object['placeAddress'] = placeAddress

    rating = reviewBlob.find('span', {'class': 'kvMYJc'})['aria-label'].strip().split(' ')[0]
    review_object['rating'] = int(rating)

    timeDescription = reviewBlob.find('span', {'class': 'rsqaWe'}).text.strip()
    review_object['timeDescription'] = timeDescription

    reviewText = reviewBlob.find('span', {'class': 'wiI7pd'}).text.strip()
    review_object['text'] = reviewText

    review_objects.append(review_object)


driver.close()


numReviewsFound = len(review_objects)

# print('Scraping report: total_combined_reviews=', total_combined_reviews, ', numReviewsFound=', numReviewsFound)

# Sanity check
# if total_combined_reviews != numReviewsFound:
#     print('Sanity check failed! total_combined_reviews does not equal numReviewsFound')


# Save reviews to JSON file

fileName = authorId + '-author.json'
pathToJsonFile = os.path.join(os.path.dirname(__file__), fileName)

with open(pathToJsonFile, 'w', encoding='utf-8') as f:
    response_json = {}
    response_json['author'] = author_object
    response_json['reviews'] = review_objects
    json.dump(response_json, f, ensure_ascii=False, indent=4)
    print('Finished saving', numReviewsFound, 'reviews to file', pathToJsonFile)

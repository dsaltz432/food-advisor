import json
import os
import time
from bs4 import BeautifulSoup
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
import selenium

placeId = '6b4863ae-3180-4f4d-8dd5-3f04821ee9f8'
url = 'https://maps.google.com/?cid=6094218779089539791'
headless = True
print('Scraping reviews for place', placeId, ', URL', url, ', headless: ', headless)
print('selenium version: ', selenium.__version__)
print('webdriver version: ', webdriver.__version__)

options = Options()
options.headless = headless
options.add_argument('--no-sandbox')
options.add_argument('--disable-dev-shm-usage')
options.add_argument('--remote-debugging-port=9222')
driver = webdriver.Chrome(options=options)
print('driver capabilities: ', driver.capabilities)
driver.get(url)
time.sleep(3) # could convert this to a "wait until" thing later

# showReviewsXPath = '//*[@id="QA0Szd"]/div/div/div[1]/div[2]/div/div[1]/div/div/div[2]/div[1]/div[1]/div[2]/div/div[1]/span[1]/span/span[1]/span[2]/span[1]/button'
showReviewsXPath = '//*[@id="QA0Szd"]/div/div/div[1]/div[2]/div/div[1]/div/div/div[2]/div[1]/div[1]/div[2]/div/div[1]/div[2]/span[2]/span[1]/button'

def get_int(num):
    return int(num.replace(',', ''))

def get_total_expected_reviews_for_place():
    elementText = driver.find_element(By.XPATH, showReviewsXPath).text
    try:
        return get_int(elementText.split(" ")[0])
    except:
        # print('Unable to find total_expected_number_of_reviews. Assuming 0 reviews.', elementText)
        os._exit(0) # Exit with code 0 so it doesn't throw an error

total_expected_number_of_reviews = get_total_expected_reviews_for_place()

# Then click on the button to load the All Reviews page
driver.find_element(By.XPATH, showReviewsXPath).click()
time.sleep(3) # could convert this to a "wait until" thing later

# Find scrollable element
scrollable_div = driver.find_element(By.XPATH, '//*[@id="QA0Szd"]/div/div/div[1]/div[2]/div/div[1]/div/div/div[2]')

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
        print('Error while clicking on see_more_element', placeId)


def is_local_guide(guideData):
    if not guideData:
        return False
    else:
        isLocalGuideTag = guideData.find_all('span')[0]
        if isLocalGuideTag.has_attr('style') and 'display:none' in isLocalGuideTag['style']:
            return False
        else:
            return True

def get_num_total_reviews_for_user(guideData, isLocalGuide):
    if not guideData:
        return 0
    else:
        numReviewsPieces = guideData.find_all('span')[1].text.strip().split(' ')
        if isLocalGuide:
            if len(numReviewsPieces) == 3:
                return get_int(numReviewsPieces[1])
            else:
                # this is a local guide with no reviews
                return 0
        else:
            return get_int(numReviewsPieces[0])


# Now that we've scrolled down the entire page, parse the HTML to get the review data

soup = BeautifulSoup(driver.page_source, 'html.parser')

reviewBlobs = soup.find_all('div', {'data-review-id': True, 'class': 'jftiEf'})

review_objects = []

for reviewBlob in reviewBlobs:

    review_object = {}

    profileData = reviewBlob.find('div', {'class':['WNxzHc', 'qLhwHc']})

    authorUrl = profileData.find('a')['href'].strip()
    review_object['authorUrl'] = authorUrl

    authorName = profileData.find('div', {'class': 'd4r55'}).text.strip()
    review_object['authorName'] = authorName

    guideData = reviewBlob.find('div', {'class': 'RfnDt'})

    isLocalGuide = is_local_guide(guideData)
    review_object['authorIsLocalGuide'] = isLocalGuide
    review_object['authorNumReviews'] = get_num_total_reviews_for_user(guideData, isLocalGuide)

    rating = reviewBlob.find('span', {'class': 'kvMYJc'})['aria-label'].strip().split(' ')[0]
    review_object['rating'] = int(rating)

    timeDescription = reviewBlob.find('span', {'class': 'rsqaWe'}).text.strip()
    review_object['timeDescription'] = timeDescription

    reviewText = reviewBlob.find('span', {'class': 'wiI7pd'}).text.strip()
    review_object['text'] = reviewText

    review_objects.append(review_object)


driver.close()


numReviewsFound = len(review_objects)

# print('Scraping report: total_expected_number_of_reviews=', total_expected_number_of_reviews, ', numReviewsFound=', numReviewsFound)

# Sanity check
# if total_expected_number_of_reviews != numReviewsFound:
    # print('Sanity check failed! total_expected_number_of_reviews != numReviewsFound=')


# Save reviews to JSON file

fileName = placeId + '-place.json'
pathToJsonFile = os.path.join(os.path.dirname(__file__), fileName)

with open(pathToJsonFile, 'w', encoding='utf-8') as f:
    response_json = {}
    response_json['reviews'] = review_objects
    json.dump(response_json, f, ensure_ascii=False, indent=4)
    print('Finished saving', numReviewsFound, 'reviews to file', pathToJsonFile)

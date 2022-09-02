# Table of Contents

- [Data Structures](#data-structures)
  - [Places](#places)
  - [Reviews](#reviews)
    - [Place Reviews](#place-reviews)
    - [Author Reviews](#author-reviews)
  - [Authors](#authors)
- [Known Issues](#known-issues)
- [Open Questions](#open-questions)

&nbsp;

# Data Structures

## Places

```json
{
  "_id": "721c5ac5-9234-44f8-8e5c-b4877f13c071",
  "googlePlaceId": "ChIJC07YUCT2wokRBgm4re83qG8",
  "googleReference": "ChIJC07YUCT2wokRBgm4re83qG8",
  "businessStatus": "OPERATIONAL",
  "name": "Malaysia Grill",
  "location": {
    "lat": 40.79947420000001,
    "lng": -73.96775
  },
  "vicinity": "224 West 104th Street, New York",
  "numPhotos": 1,
  "rating": 4.5,
  "userRatingsTotal": 332,
  "types": [
    "meal_delivery",
    "restaurant",
    "food",
    "point_of_interest",
    "establishment"
  ],
  "icon": "https://maps.gstatic.com/mapfiles/place_api/icons/v1/png_71/restaurant-71.png",
  "scope": "GOOGLE",
  "openingHours": null,
  "priceLevel": 1,
  "googleMapsUrl": "https://maps.google.com/?cid=8045742236848621830",
  "audit": {
    "createdDate": "2022-08-05T05:16:17.105Z",
    "updatedDate": null
  }
}
```

- `_id` - the placeId, unique identifier for this place
- `googlePlaceId` - the unique identifier for this place in Google's system
- `googleReference` - not sure what this is
- `businessStatus` - whether the place is actively operational
- `name` - the name of the place
- `location` - the location coordinates for this place
- `vicinity` - in most cases this is the address of the place
- `numPhotos` - the number of photos associated with this place
- `rating` - the average rating for this place
- `types` - the types/tags/labels associated with this place
- `icon` - not sure where this icon is displayed in Google
- `scope` - not sure about this
- `priceLevel` - the price level for this place, ranked 1-5
- `googleMapsUrl` - the Google Maps URL for this place
- `audit.createdDate` - timestamp of when the place was created in the database
- `audit.updatedDate` - timestamp of when the place was last updated in the database

&nbsp;

## Reviews

We have two types of reviews of reviews in our system. Reviews extracted while scraping `places` (getting all reviews for a place), and reviews extracted while scraping `authors` (getting all reviews for an author). The `source` field indicates where each review originates. The core fields are similar across both types of reviews, but there are a few differences that are highlighted in the descriptions below.

### Place Reviews

```json
{
  "_id": "51dded9b-3dac-47c6-b341-bd1bd6e1198d",
  "source": "placeScraper",
  "googleAuthorId": "110199182207895385482",
  "authorId": "4b7a07d6-9dc8-4f1d-abb5-f00da7d402f2",
  "placeId": "721c5ac5-9234-44f8-8e5c-b4877f13c071",
  "authorName": "Aina Sarafina Izham",
  "authorUrl": "https://www.google.com/maps/contrib/110199182207895385482/reviews?hl=en-US",
  "authorIsLocalGuide": false,
  "authorNumReviews": 17,
  "rating": 5,
  "timeDescription": "11 months ago",
  "text": "Malaysian born & raised here, ordered roti canai, char kuey teow & mee goreng and they were all pretty good for my taste!! We asked for the kuey teow to be spicy and it definitely has a kick. The roti is store bought so don’t expect a lot, but the chicken curry really made it so much better! Not to mention, the prices don’t drain your wallet. Coming again whenever I miss food from my homeland!!!",
  "audit": {
    "createdDate": "2022-08-05T05:18:47.606Z",
    "updatedDate": "2022-08-31T03:50:35.469Z",
    "lastUpdatedLocation": "2022-09-02T14:19:10.823Z"
  },
  "location": {
    "zip": "10025",
    "lat": 40.7975,
    "lng": -73.9683,
    "city": "New York",
    "state": "NY",
    "country": "US"
  },
  "locationStats": [
    {
      "threshold": 1,
      "numReviewsWithinThreshold": 2,
      "ratingsForThreshold": [5, 1],
      "averageForThreshold": 3,
      "medianForThreshold": 3
    },
    {
      "threshold": 3,
      "numReviewsWithinThreshold": 6,
      "ratingsForThreshold": [5, 5, 3, 5, 1, 5],
      "averageForThreshold": 4,
      "medianForThreshold": 5
    },
    {
      "threshold": 5,
      "numReviewsWithinThreshold": 8,
      "ratingsForThreshold": [5, 5, 3, 5, 1, 5, 5, 5],
      "averageForThreshold": 4.25,
      "medianForThreshold": 5
    },
    {
      "threshold": 10,
      "numReviewsWithinThreshold": 13,
      "ratingsForThreshold": [5, 5, 5, 5, 3, 5, 1, 5, 5, 5, 5, 5, 5],
      "averageForThreshold": 4.538461538461538,
      "medianForThreshold": 5
    },
    {
      "threshold": 20,
      "numReviewsWithinThreshold": 13,
      "ratingsForThreshold": [5, 5, 5, 5, 3, 5, 1, 5, 5, 5, 5, 5, 5],
      "averageForThreshold": 4.538461538461538,
      "medianForThreshold": 5
    }
  ]
}
```

- `_id` - the reviewId, unique identifier for this review
- `source` - the source for where this review was taken, either from scraping places (`placeScraper`) or from scraping authors (`authorScraper`)
- `googleAuthorId` - the unique identifier for this author in Google's system
- `authorId` - the unique identifier for this author in our system
- `placeId` - the place for this review. links to the places collection.
- `authorName` - the name of the author who wrote this review
- `authorUrl` - the URL of the author's Google profile
- `authorIsLocalGuide` - whether or not this author is considered a Google "local guide"
- `authorNumReviews` - the number of reviews for this author, determined while scraping the place
- `rating` - the rating for this review, on a scale from 1-5
- `timeDescription` - a string description for when this review was written
- `text` - the review text
- `audit.createdDate` - timestamp of when the review was created in the database
- `audit.updatedDate` - timestamp of when the review was last updated in the database
- `audit.lastUpdatedLocation` - timestamp of when the review's location and locationStats were last updated in the database
- `location` - the detailed location data based on the place's coordinates (which Google provides)
- `locationStats` - statistics about the relationship between this specific `placeReview` compared to all other reviews written by this author (their authorReviews)
- `locationStats.[i].threshold` - the threshold (in miles) when checking the distance between the place and each of this author's reviews
- `locationStats.[i].numReviewsWithinThreshold` - the number of reviews that fall within this threshold
- `locationStats.[i].numReviewsWithinThreshold` - the raw ratings for the reviews that fall within this threshold
- `locationStats.[i].averageForThreshold` - the average rating for the reviews within this threshold
- `locationStats.[i].medianForThreshold` - the median rating for the reviews within this threshold

### Author Reviews

```json
{
  "_id": "d5fe77e0-6955-4fd7-8e14-5f5759b0ef0c",
  "source": "placeScraper",
  "googleAuthorId": "110199182207895385482",
  "authorId": "4b7a07d6-9dc8-4f1d-abb5-f00da7d402f2",
  "placeId": null,
  "placeName": "Malaysia Grill",
  "placeAddress": "224 W 104th St, New York, NY 10025",
  "authorName": "Aina Sarafina Izham",
  "authorUrl": "https://www.google.com/maps/contrib/110199182207895385482/reviews?hl=en-US",
  "authorIsLocalGuide": false,
  "authorNumReviews": 17,
  "rating": 5,
  "timeDescription": "11 months ago",
  "text": "Malaysian born & raised here, ordered roti canai, char kuey teow & mee goreng and they were all pretty good for my taste!! We asked for the kuey teow to be spicy and it definitely has a kick. The roti is store bought so don’t expect a lot, but the chicken curry really made it so much better! Not to mention, the prices don’t drain your wallet. Coming again whenever I miss food from my homeland!!!",
  "audit": {
    "createdDate": "2022-08-30T22:23:59.150Z",
    "updatedDate": null,
    "lastUpdatedLocation": "2022-09-02T14:19:10.823Z"
  },
  "location": {
    "zip": "10025",
    "lat": 40.7975,
    "lng": -73.9683,
    "city": "New York",
    "state": "NY",
    "country": "US"
  }
}
```

- `_id` - the reviewId, unique identifier for this review
- `source` - the source for where this review was taken, either from scraping places (`placeScraper`) or from scraping authors (`authorScraper`)
- `googleAuthorId` - the unique identifier for this author in Google's system
- `authorId` - the unique identifier for this author in our system
- `placeId` - currently null. In the future we will use the placeName and placeAddress to look up the placeId and store it
- `placeName` - the name of the place for this review
- `placeAddress` - the address of the place for this review
- `authorName` - the name of the author who wrote this review
- `authorUrl` - the URL of the author's Google profile
- `authorIsLocalGuide` - whether or not this author is considered a Google "local guide"
- `authorNumReviews` - the number of reviews for this author, determined while scraping the place
- `rating` - the rating for this review, on a scale from 1-5
- `timeDescription` - a string description for when this review was written
- `text` - the review text
- `audit.createdDate` - timestamp of when the review was created in the database
- `audit.updatedDate` - timestamp of when the review was last updated in the database
- `audit.lastUpdatedLocation` - timestamp of when the review's location was last updated in the database
- `location` - the detailed location data based on the place's address (which Google provides)

&nbsp;

## Authors

```json
{
  "_id": "4b7a07d6-9dc8-4f1d-abb5-f00da7d402f2",
  "googleAuthorId": "110199182207895385482",
  "authorName": "Aina Sarafina Izham",
  "authorUrl": "https://www.google.com/maps/contrib/110199182207895385482/reviews?hl=en-US",
  "authorIsLocalGuide": false,
  "authorNumReviews": 17,
  "totalReviews": 18,
  "totalRatings": 2,
  "authorLevel": null,
  "authorPoints": null,
  "status": "scraped",
  "audit": {
    "createdDate": "2022-08-30T19:20:38.356Z",
    "updatedDate": null
  }
}
```

- `_id` - the authorId, unique identifier for this author
- `googleAuthorId` - the unique identifier for this author in Google's system
- `authorName` - the name of this author
- `authorUrl` - the URL of this author's Google profile
- `authorIsLocalGuide` - whether or not this author is considered a Google "local guide"
- `authorNumReviews` - the number of reviews for this author, determined while scraping the place (and that is what triggers us to store this author in our system)
- `totalReviews` - the number of reviews, according to the header field within the author's Google profile (extracted while scraping this author's reviews)
- `totalReviews` - the number of ratings (basically reviews with just the rating, no text), according to the header field within the author's Google profile (extracted while scraping this author's reviews)
- `authorLevel` - the level for this author in Google's local guide system
- `authorPoints` - the number of points for this author in Google's local guide system
- `status` - the status for this author, either `pending` or `scraped`. Once we've scraped all of this author's reviews we mark the author status as `scraped`.
- `audit.createdDate` - timestamp of when the author was created in the database
- `audit.updatedDate` - timestamp of when the author was last updated in the database

&nbsp;

# Known Issues

- There are duplicate reviews between the `placeReviews` and the `authorReviews`. We initially store the `placeReviews` in our system, and then scrape each author's other reviews. But currently we don't filter out the `authorReviews` that are actually the same reviews as the `placeReviews`. This isn't a huge problem, it will just shift the data slightly because it's duplicating a small number of reviews. It can be fixed later and the analysis can be recalculated.
- Some places failed to scrape all of its reviews. This only happened to a select few places who had many reviews (over 500), and Google already sorts reviews based on some priority criteria. So in practice we scraped at minimum the top 500 most prominent reviews, which means this only a small issue.
- Some authors have configured their google settings to hide their review data. This means that we will have `placeReviews` for those authors, but no `authorReviews`. These authors should be treated as neutral in any analysis and not necessarily be penalized for having this data as missing. We know the total number of reviews that these authors have, but no data beyond that.
- Location parsing currently only works for locations within the US. This can be expanded later when needed.

&nbsp;

# Open Questions

- Do the `authorLevel` and `authorPoints` provide any additional information more than just knowing if a user is a `authorIsLocalGuide`? In other words, should we assign users who are on level 10 more weight than users who are on level 3?
- Can we compute our own "local guide" metric that is more meaningful than Google's local guide system, using data for which locations each author's reviews?
- What is the best distance threshold to use when analyzing a user's "local-ness" to a place?
- How much weight should be put to the recency of a review compared to the quality of the author who writes the review?

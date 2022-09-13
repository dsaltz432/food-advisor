

// what places are the placeReviews for
// var authorIds = authors.map(a => a._id);
// var placeIds = db.reviews.distinct('placeId', { authorId: { $in: authorIds } });

// var places = db.places.find({ _id: { $in: placeIds } }).toArray();

// let total = 0;
// for (const place of places) {
//     printjson({ placeId: place._id, name: place.name, userRatingsTotal: place.userRatingsTotal });
//     total += place.userRatingsTotal;
// }




// are there any placeReviews where the place object doesn't exist?
var places = db.places.find().toArray();
var placeIds = places.map(p => p._id);
var numPlaceReviewsWithoutRealPlace = db.reviews.find({ source:'placeScraper', placeId: { $nin: placeIds } }).count();
if (numPlaceReviewsWithoutRealPlace > 0) {
    print(`Found ${numPlaceReviewsWithoutRealPlace} placeReviews without a valid place`);
    // db.reviews.deleteMany({ source:'placeScraper', placeId: { $nin: placeIds } });
}


// count all place reviews for "scraped" authors
// let total = 0;
// var authors = db.authors.find({status:'scraped'}).toArray();
// var authorIds = authors.map(a => a._id);
// var scrapedReviews = db.reviews.find({  })
// for (const author of authors) {
//     var count = db.reviews.find({ source: 'placeScraper', googleAuthorId:author.googleAuthorId}).count();
//     total += count;
// }
// var actualTotal = db.reviews.find({source:'placeScraper'}).count();
// print(`Total expected: ${total}, actual total: ${actualTotal}`);


// are there any authors that do not link to any real places
var places = db.places.find().toArray();
var placesMap = {};
for (const place of places) {
    placesMap
    [place._id] = place;
}
var authorsWithoutReviewToRealPlace = [];
var authors = db.authors.find({status:'pending'}).toArray();
for (const author of authors) {
    const placeIds = db.reviews.distinct('placeId', { googleAuthorId: author.googleAuthorId });
    let foundOne = false;
    for (const placeId of placeIds) {
        if (placesMap[placeId]) {
            foundOne = true;
            break;
        }
    }
    if (!foundOne) {
        print(author._id);
        authorsWithoutReviewToRealPlace.push(author._id);
    }
    // var countPlace = db.reviews.find({ $or: [{authorId:author._id},{googleAuthorId:author.googleAuthorId}], source: 'placeScraper' });
    // var countAuthor = db.reviews.find({ $or: [{authorId:author._id},{googleAuthorId:author.googleAuthorId}], source: 'authorScraper'  });
    // if (countPlace === 0 || countAuthor === 0) {
    //     print(author._id)
    // }
}

// Delete authors with no reviews for real places
var badAuthorIds = authorsWithoutReviewToRealPlace;
var badAuthors = db.authors.find({ _id: { $in: badAuthorIds } }).toArray();
var badGoogleAuthorIds = badAuthors.map(a => a.googleAuthorId);
db.reviews.find({ _id: {$in: badAuthorIds  } }).count()
db.reviews.find({ googleAuthorId: {$in: badGoogleAuthorIds }, source: 'placeScraper' }).count()
db.reviews.find({ googleAuthorId: {$in: badGoogleAuthorIds }, source: 'authorScraper' }).count()
db.reviews.deleteMany({ authorId: { $in: badAuthorIds } });
db.reviews.deleteMany({ googleAuthorId: { $in: badGoogleAuthorIds } });
db.authors.deleteMany({ _id: { $in: badAuthorIds } });




// compare places and reviewHistory
var places = db.places.find().toArray();
var histories = db.reviewHistory.find().toArray();
var placesMap = {};
var historiesMap = {};
for (const place of places) {
    placesMap[place._id] = place;
}
for (const history of histories) {
    historiesMap[history.placeId] = history;
}
var badHistoryPlaceIds = [];
var noHistoryPlaceIds = [];
for (const history of histories) {
    if (!placesMap[history.placeId]) {
        badHistoryPlaceIds.push(history.placeId);
    }
}
for (const place of places) {
    if (!historiesMap[place._id]) {
        noHistoryPlaceIds.push(place._id);
    }
}

if (badHistoryPlaceIds.length) {
    print(`Found ${badHistoryPlaceIds} with bad histories`)
}
if (noHistoryPlaceIds.length) {
    print(`Found ${noHistoryPlaceIds} with no histories`)
}

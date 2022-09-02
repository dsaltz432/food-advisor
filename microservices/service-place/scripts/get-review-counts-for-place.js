
var placeId = '00b7a754-504b-4035-ae88-06187083b7d8';
var place = db.places.findOne({ _id: placeId });

if (!place) {
    print(`Place [${placeId}] not found`);
    quit(1);
}

var historyCount = (db.reviewHistory.findOne({ placeId })).numReviews;
var actualReviewsCount = db.reviews.find({ placeId }).count();
var placeCount = place.userRatingsTotal;

printjson({ placeId, historyCount, actualReviewsCount, placeCount });

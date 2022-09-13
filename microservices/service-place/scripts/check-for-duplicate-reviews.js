var places = db.places.find().toArray();

// check for double reviews
for (const place of places) {
	const placeId = place._id;
	var history = db.reviewHistory.findOne({ placeId });
	var numActualReviews = db.reviews.find({ placeId }).count();
	var userRatingsTotal = place.userRatingsTotal;
    var historyNum = (history && history.numReviews) || 0;

	if (numActualReviews > historyNum) {
		printjson({ placeId, userRatingsTotal, numActualReviews, historyNum });
	}
}
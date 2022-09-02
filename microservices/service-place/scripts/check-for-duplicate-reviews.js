var places = db.places.find().toArray();

// check for double reviews
for (const place of places) {
	const placeId = place._id;
	var history = db.reviewHistory.findOne({ placeId });
	var numActualReviews = db.reviews.find({ placeId }).count();
	var userRatingsTotal = place.userRatingsTotal;

	if (numActualReviews > history.numReviews) {
		printjson({ placeId, userRatingsTotal, numActualReviews, historyNum: history.numReviews });
	}
}
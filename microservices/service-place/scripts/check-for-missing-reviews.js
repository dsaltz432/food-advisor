var places = db.places.find().toArray();

// check for missing reviews
for (const place of places) {
	const placeId = place._id;
	var history = db.reviewHistory.findOne({ placeId });
	var numPlaceReviews = db.reviews.find({ source: 'placeReviews', placeId }).count();
    var numAuthorReviews = db.reviews.find({ source: 'authorReviews', placeId }).count();
    var historyNum = (history && history.numReviews) || 0;

	if (place.userRatingsTotal > historyNum) {
		printjson({ placeId, userRatingsTotal: place.userRatingsTotal, historyNum, numPlaceReviews, numAuthorReviews });
        // db.places.deleteOne({ _id:placeId });
    	// db.reviewHistory.deleteOne({ placeId });
        // db.reviews.deleteMany({ placeId });
	}
}
var places = db.places.find().toArray();

for (const place of places) {
	const placeId = place._id;
	var history = db.reviewHistory.findOne({placeId});

	if (place.userRatingsTotal > history.numReviews) {
		printjson({ placeId, userRatingsTotal: place.userRatingsTotal, historyNum: history.numReviews })
	}
}
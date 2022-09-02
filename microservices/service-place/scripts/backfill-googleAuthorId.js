var reviews = db.reviews.find({googleAuthorId:{$exists:false}},{_id:1,authorUrl:1}).toArray();

for (const review of reviews) {
	const googleAuthorId = review.authorUrl.split('https://www.google.com/maps/contrib/')[1].split('/')[0];
	// printjson({ url: review.authorUrl, googleAuthorId });
	db.reviews.updateOne({_id:review._id},{$set:{googleAuthorId}});
}

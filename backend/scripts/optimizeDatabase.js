// scripts/optimizeDatabase.js
// Database optimization script for fixing performance issues

const mongoose = require('mongoose');
const Movie = require('../src/models/movie');
const Rating = require('../src/models/rating');
const MovieView = require('../src/models/movieView');
const Comment = require('../src/models/comment');
const FavoritesList = require('../src/models/favoritesList');
const Watchlist = require('../src/models/watchlist');
const User = require('../src/models/user');
const Advertisement = require('../src/models/advertisement');

async function optimizeDatabase() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/moviestreaming');
    console.log('✅ Connected to MongoDB');

    console.log('📁 Creating Movie indexes...');
    await Movie.collection.createIndex({
      "$**": "text"
    }, {
      name: "movie_fulltext_search",
      weights: {
        name: 10,
        origin_name: 8,
        content: 6,
        actor: 4,
        director: 4
      }
    });

    await Movie.collection.createIndex({ type: 1, year: -1, view: -1 });
    await Movie.collection.createIndex({ "category.slug": 1, year: -1 });
    await Movie.collection.createIndex({ "country.slug": 1, type: 1 });
    await Movie.collection.createIndex({ status: 1, "created.time": -1 });
    await Movie.collection.createIndex({ rating: -1, rating_count: -1 });
    await Movie.collection.createIndex({ view: -1, "created.time": -1 });

    await Movie.collection.createIndex({
      name: 1,
      year: 1,
      type: 1
    }, {
      name: "search_optimization"
    });

    console.log('✅ Movie indexes created');

    console.log('📁 Creating Rating indexes...');
    await Rating.collection.createIndex({ movieId: 1, userId: 1 }, { unique: true });
    await Rating.collection.createIndex({ movieSlug: 1 });
    await Rating.collection.createIndex({ rating: -1 });
    await Rating.collection.createIndex({ createdAt: -1 });
    console.log('✅ Rating indexes created');

    // 3. Create indexes for MovieView collection
    console.log('📁 Creating MovieView indexes...');
    await MovieView.collection.createIndex({ movieId: 1, viewDate: -1 });
    await MovieView.collection.createIndex({ viewDate: -1 });
    await MovieView.collection.createIndex({ userId: 1, viewDate: -1 });
    await MovieView.collection.createIndex({ ipAddress: 1, viewDate: -1 });
    console.log('✅ MovieView indexes created');

    // 4. Create indexes for Comment collection
    console.log('📁 Creating Comment indexes...');
    await Comment.collection.createIndex({ movieSlug: 1, createdAt: -1 });
    await Comment.collection.createIndex({ userId: 1, createdAt: -1 });
    await Comment.collection.createIndex({ isDeleted: 1, createdAt: -1 });
    console.log('✅ Comment indexes created');

    // 5. Create indexes for FavoritesList collection
    console.log('📁 Creating FavoritesList indexes...');
    await FavoritesList.collection.createIndex({ userId: 1 }, { unique: true });
    await FavoritesList.collection.createIndex({ "movieIds": 1 });
    console.log('✅ FavoritesList indexes created');

    // 6. Create indexes for Watchlist collection
    console.log('📁 Creating Watchlist indexes...');
    await Watchlist.collection.createIndex({ userId: 1 }, { unique: true });
    await Watchlist.collection.createIndex({ "movieIds": 1 });
    console.log('✅ Watchlist indexes created');

    // 7. Create indexes for User collection
    console.log('📁 Creating User indexes...');
    await User.collection.createIndex({ email: 1 }, { unique: true });
    await User.collection.createIndex({ username: 1 }, { unique: true });
    await User.collection.createIndex({ role: 1 });
    await User.collection.createIndex({ accountStatus: 1 });
    await User.collection.createIndex({ createdAt: -1 });
    console.log('✅ User indexes created');

    // 8. Create indexes for Advertisement collection
    console.log('📁 Creating Advertisement indexes...');
    await Advertisement.collection.createIndex({ type: 1, isActive: 1 });
    await Advertisement.collection.createIndex({ position: 1, isActive: 1 });
    await Advertisement.collection.createIndex({ priority: -1, isActive: 1 });
    await Advertisement.collection.createIndex({ startDate: 1, endDate: 1 });
    console.log('✅ Advertisement indexes created');

    // 9. Analyze collection statistics
    console.log('📊 Analyzing collection statistics...');
    const movieStats = await Movie.collection.stats();
    const ratingStats = await Rating.collection.stats();
    const viewStats = await MovieView.collection.stats();

    console.log(`📈 Database Statistics:
    - Movies: ${movieStats.count} documents (${(movieStats.storageSize / 1024 / 1024).toFixed(2)} MB)
    - Ratings: ${ratingStats.count} documents (${(ratingStats.storageSize / 1024 / 1024).toFixed(2)} MB)
    - Views: ${viewStats.count} documents (${(viewStats.storageSize / 1024 / 1024).toFixed(2)} MB)`);

    // 10. Clean up old view records (older than 90 days)
    console.log('🧹 Cleaning up old view records...');
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

    const deletedViews = await MovieView.deleteMany({
      viewDate: { $lt: ninetyDaysAgo }
    });
    console.log(`✅ Deleted ${deletedViews.deletedCount} old view records`);

    // 11. Update movie view counts
    console.log('🔄 Updating movie view counts...');
    const movieViewCounts = await MovieView.aggregate([
      {
        $group: {
          _id: "$movieId",
          viewCount: { $sum: 1 }
        }
      }
    ]);

    for (const viewCount of movieViewCounts) {
      await Movie.updateOne(
        { _id: viewCount._id },
        { $set: { view: viewCount.viewCount } }
      );
    }
    console.log(`✅ Updated view counts for ${movieViewCounts.length} movies`);

    console.log('🎉 Database optimization completed successfully!');

  } catch (error) {
    console.error('❌ Error during database optimization:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

// Run if this file is executed directly
if (require.main === module) {
  optimizeDatabase();
}

module.exports = optimizeDatabase;

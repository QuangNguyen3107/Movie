// src/utils/dbIndexes.js - Database Indexes Setup
const Movie = require('../models/movie');
const User = require('../models/user');
const History = require('../models/history');
const Watchlist = require('../models/watchlist');
const Comment = require('../models/comment');
const Rating = require('../models/rating');

/**
 * Setup database indexes for better query performance
 * Run this once during server startup or as a migration script
 */
async function setupDatabaseIndexes() {
    try {
        console.log('🔧 Setting up database indexes...');

        // Movie indexes
        await Movie.collection.createIndex({ slug: 1 }, { unique: true });
        await Movie.collection.createIndex({ name: 1 });
        await Movie.collection.createIndex({ year: -1 });
        await Movie.collection.createIndex({ type: 1 });
        await Movie.collection.createIndex({ status: 1 });
        await Movie.collection.createIndex({ isHidden: 1 });
        await Movie.collection.createIndex({ createdAt: -1 });
        await Movie.collection.createIndex({ view: -1 });
        await Movie.collection.createIndex({ 'category._id': 1 });
        await Movie.collection.createIndex({ 'country._id': 1 });
        
        // Text index for full-text search (nếu không dùng Elasticsearch)
        await Movie.collection.createIndex({ 
            name: 'text', 
            origin_name: 'text', 
            content: 'text' 
        });
        
        // Compound indexes for common queries
        await Movie.collection.createIndex({ type: 1, status: 1 });
        await Movie.collection.createIndex({ isHidden: 1, createdAt: -1 });
        
        console.log('✅ Movie indexes created');

        // User indexes
        await User.collection.createIndex({ email: 1 }, { unique: true });
        await User.collection.createIndex({ username: 1 });
        await User.collection.createIndex({ createdAt: -1 });
        
        console.log('✅ User indexes created');

        // History indexes
        await History.collection.createIndex({ userId: 1, movieId: 1 });
        await History.collection.createIndex({ userId: 1, lastWatched: -1 });
        await History.collection.createIndex({ movieId: 1 });
        await History.collection.createIndex({ lastWatched: -1 });
        
        console.log('✅ History indexes created');

        // Watchlist indexes
        await Watchlist.collection.createIndex({ userId: 1 }, { unique: true });
        await Watchlist.collection.createIndex({ movieIds: 1 });
        
        console.log('✅ Watchlist indexes created');

        // Comment indexes
        await Comment.collection.createIndex({ movieId: 1, createdAt: -1 });
        await Comment.collection.createIndex({ userId: 1 });
        await Comment.collection.createIndex({ parentId: 1 });
        
        console.log('✅ Comment indexes created');

        // Rating indexes
        await Rating.collection.createIndex({ movieId: 1, userId: 1 }, { unique: true });
        await Rating.collection.createIndex({ movieId: 1 });
        await Rating.collection.createIndex({ userId: 1 });
        
        console.log('✅ Rating indexes created');

        console.log('✅ All database indexes setup completed!');
        
    } catch (error) {
        console.error('❌ Error setting up database indexes:', error);
        // Don't throw error, just log it
        // The server should continue even if indexes fail
    }
}

/**
 * List all indexes for a collection
 */
async function listIndexes(collectionName) {
    try {
        const model = getModelByName(collectionName);
        if (!model) {
            console.log(`❌ Model not found: ${collectionName}`);
            return;
        }

        const indexes = await model.collection.getIndexes();
        console.log(`📋 Indexes for ${collectionName}:`, indexes);
        return indexes;
    } catch (error) {
        console.error(`❌ Error listing indexes for ${collectionName}:`, error);
    }
}

/**
 * Get model by collection name
 */
function getModelByName(name) {
    const models = {
        'movies': Movie,
        'users': User,
        'histories': History,
        'watchlists': Watchlist,
        'comments': Comment,
        'ratings': Rating
    };
    
    return models[name.toLowerCase()];
}
module.exports = {
    setupDatabaseIndexes,
    listIndexes
};

// models/movie.js

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Import các hàm từ elasticsearchService
const { indexDocument, deleteDocument } = require('../services/elasticsearchService');

const movieSchema = new Schema({
    tmdb: {
        type: {
            type: String,  // Loại phim (ví dụ: tv, movie)
            default: null
        },
        id: { type: String, default: '' },
        season: { type: Number, default: null },
        vote_average: { type: Number, default: 0 },
        vote_count: { type: Number, default: 0 }
    },
    imdb: {
        id: { type: String, default: '' }
    },
    created: {
        time: { type: Date, default: Date.now }
    },
    modified: {
        time: { type: Date, default: Date.now }
    },
    name: { type: String, required: true },
    origin_name: { type: String, required: true },
    content: { type: String, required: true },
    type: { type: String, default: 'series' },
    status: { type: String, default: 'completed' },
    thumb_url: { type: String, default: '' },
    trailer_url: { type: String, default: '' },
    time: { type: String, default: '60 phút/tập' },
    episode_current: { type: String, default: 'Hoàn Tất (12/12)' },
    episode_total: { type: String, default: '12 Tập' },
    quality: { type: String, default: 'FHD' },
    lang: { type: String, default: 'Vietsub' },
    notify: { type: String, default: '' },
    showtimes: { type: String, default: '' },
    slug: { type: String, required: true, unique: true },
    year: { type: Number, required: true },
    view: { type: Number, default: 0 },
    actor: [{ type: String }],
    director: [{ type: String }],
    category: [
        {
            id: { type: String },
            name: { type: String },
            slug: { type: String }
        }
    ],
    country: [
        {
            id: { type: String },
            name: { type: String },
            slug: { type: String }
        }
    ],
    is_copyright: { type: Boolean, default: false },
    chieurap: { type: Boolean, default: false },
    poster_url: { type: String, default: '' },
    sub_docquyen: { type: Boolean, default: false },
    // Thêm trường isHidden để kiểm soát việc hiển thị phim
    isHidden: { type: Boolean, default: false },
    episodes: [
        {
            server_name: { type: String, required: true },  // Tên của server phát
            server_data: [
                {
                    name: { type: String, required: true },  // Tên tập phim
                    slug: { type: String, required: true },  // Slug cho tập phim
                    filename: { type: String, required: true },  // Tên file
                    link_embed: { type: String, required: true },  // Link để nhúng
                    link_m3u8: { type: String, required: true }  // Link m3u8
                }
            ]
        }
    ]
}, {timestamps: true});

// Add database indexes for better query performance
// Index for search functionality
movieSchema.index({ name: "text", origin_name: "text", content: "text", actor: "text", director: "text" });

// Indexes for frequently queried fields
movieSchema.index({ slug: 1 }); // Unique already handles this, but explicit for clarity
movieSchema.index({ year: 1 });
movieSchema.index({ type: 1 });
movieSchema.index({ status: 1 });
movieSchema.index({ quality: 1 });
movieSchema.index({ lang: 1 });
movieSchema.index({ view: -1 }); // For most viewed queries
movieSchema.index({ "created.time": -1 }); // For newest first sorting
movieSchema.index({ "modified.time": -1 }); // For recently updated

// Compound indexes for common query patterns
movieSchema.index({ name: 1, year: 1 }); // For search with name and year
movieSchema.index({ type: 1, year: 1 }); // Filter by type and year
movieSchema.index({ type: 1, status: 1 }); // Filter by type and status
movieSchema.index({ "category.name": 1, year: 1 }); // Category-based queries
movieSchema.index({ "category.slug": 1 }); // Category slug queries
movieSchema.index({ "country.name": 1 }); // Country-based queries
movieSchema.index({ "country.slug": 1 }); // Country slug queries

// Rating-related indexes
movieSchema.index({ rating: -1 }); // For top rated queries
movieSchema.index({ rating_count: -1 }); // For most rated queries
movieSchema.index({ rating: -1, rating_count: -1 }); // Combined rating queries

// TMDB indexes for external data queries
movieSchema.index({ "tmdb.id": 1 });
movieSchema.index({ "tmdb.vote_average": -1 });
movieSchema.index({ "imdb.id": 1 });

// Performance optimized compound indexes
movieSchema.index({ type: 1, year: -1, view: -1 }); // Popular content by type and year
movieSchema.index({ status: 1, "created.time": -1 }); // Recent content by status

// Middleware Hooks cho Elasticsearch Sync
// =========================================================

// Hook được gọi SAU KHI một document được lưu thành công (create hoặc update bằng .save())
movieSchema.post('save', async function(doc, next) {
    // Kiểm tra xem document đã có _isNew được đặt trong quá trình xử lý trước đó
    const isNewDoc = doc._isNew !== false; // Nếu không có _isNew hoặc _isNew === true thì coi như là mới
    
    if (isNewDoc) {
        console.log(`[ES Sync] Movie saved (${doc._id}), indexing...`);
        try {
            // Gọi hàm indexDocument từ service, truyền vào plain object
            await indexDocument(doc.toObject());
        } catch (error) {
            console.error(`[ES Sync] Error indexing movie ${doc._id} after save:`, error);
            // Không nên ném lỗi ở đây để tránh làm hỏng luồng chính
        }
    } else {
        console.log(`[ES Sync] Movie already exists (${doc._id}), skipping indexing...`);
    }
    next(); // Tiếp tục middleware chain (nếu có)
});

// Hook được gọi SAU KHI một document được cập nhật thành công bằng findOneAndUpdate
// Lưu ý: Cần xử lý cẩn thận để lấy document *sau* khi update
movieSchema.post('findOneAndUpdate', async function(result) {
    // `this` là query object
    // `result` là document trả về (có thể là cũ hoặc mới tùy option `new` khi gọi findOneAndUpdate)
    if (result) {
        console.log(`[ES Sync] Movie updated via findOneAndUpdate (${result._id}), re-indexing...`);
        try {
            // Cách an toàn: Lấy lại document mới nhất từ DB bằng ID
            const updatedDoc = await this.model.findById(result._id); // this.model là model 'Movie'
            if (updatedDoc) {
                await indexDocument(updatedDoc.toObject());
            } else {
                 console.warn(`[ES Sync] Could not find document ${result._id} after findOneAndUpdate to re-index.`);
                 // Có thể document đã bị xóa ngay sau đó? Hoặc ID không đúng?
                 // Thử index `result` như một phương án dự phòng nếu bạn dùng option { new: true }
                 // await indexDocument(result.toObject());
            }
        } catch (error) {
            console.error(`[ES Sync] Error re-indexing movie ${result._id} after findOneAndUpdate:`, error);
        }
    }
    // Query hook không có next()
});

// Hook được gọi SAU KHI một document bị xóa thành công bằng findOneAndDelete
movieSchema.post('findOneAndDelete', async function(doc, next) {
    if (doc) {
        console.log(`[ES Sync] Movie deleted via findOneAndDelete (${doc._id}), deleting from index...`);
        try {
            // Gọi hàm deleteDocument từ service
            await deleteDocument(doc._id);
        } catch (error) {
            console.error(`[ES Sync] Error deleting movie ${doc._id} from index after findOneAndDelete:`, error);
        }
    }
    next(); // Document hook có next()
});

// Hook cho deleteOne (Query Middleware) - Chỉ cảnh báo
movieSchema.post('deleteOne', { document: false, query: true }, async function(res) {
    const filter = this.getFilter(); // Lấy điều kiện xóa
    // Nếu xóa theo _id thì có thể lấy ID từ filter
    if (filter && filter._id) {
         console.log(`[ES Sync] deleteOne hook triggered for ID (${filter._id}), attempting delete from index...`);
         try {
             await deleteDocument(filter._id);
         } catch (error) {
             console.error(`[ES Sync] Error deleting movie ${filter._id} from index after deleteOne:`, error);
         }
    } else {
         console.warn('[ES Sync] deleteOne hook triggered with complex filter. Manual ES deletion might be needed:', filter);
    }
});

// Hook cho deleteMany (Query Middleware) - Chỉ cảnh báo vì khó lấy ID hàng loạt
movieSchema.post('deleteMany', { document: false, query: true }, async function(res) {
    console.warn('[ES Sync] deleteMany hook triggered. Manual ES deletion is highly recommended for bulk deletes:', this.getFilter());
});
// =========================================================

const Movie = mongoose.model('Movie', movieSchema);
module.exports = Movie;

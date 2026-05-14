// services/movieCrawlService.js
require('dotenv').config();
const axios = require('axios');
const Movie = require('../models/movie');
const Category = require('../models/category');

// Cấu hình URL cơ bản từ biến môi trường hoặc giá trị mặc định
const BASE_URL = process.env.API_BASE_URL || 'http://localhost:5000/api/ophim/';

class MovieCrawlService {
    constructor() {
        this.isCancelled = false; // flag dừng crawl toàn bộ
    }

    async crawlMovies(page = 1) { // Accept page as a parameter, default is 1
        try {
            // Lấy danh sách phim từ API, với page truyền vào
            const response = await axios.get(`${BASE_URL}movies`, {
                params: { page }  // Include the page parameter
            });
            const data = response.data;

            console.log("Dữ liệu nhận được từ API:", JSON.stringify(data, null, 2)); // Log the entire response

            // Kiểm tra dữ liệu trả về có hợp lệ không
            if (data.data && data.data.status && Array.isArray(data.data.items) && data.data.items.length > 0) {
                const moviesList = data.data.items;
                
                const savedMovies = [];
                const updatedMovies = [];
                const existingSlugs = new Set();
                const existingMoviesMap = new Map(); // Map để lưu phim đã tồn tại theo slug

                // Kiểm tra phim nào đã tồn tại trong DB trước khi lấy chi tiết từ API
                for (const movie of moviesList) {
                    if (movie.slug) {
                        const existingMovie = await Movie.findOne({ slug: movie.slug });
                        if (existingMovie) {
                            existingSlugs.add(movie.slug);
                            existingMoviesMap.set(movie.slug, existingMovie);
                            console.log(`🔍 Phim '${movie.name}' (${movie.slug}) đã tồn tại, kiểm tra cập nhật tập mới...`);
                        }
                    }
                }

                // Lấy thông tin tất cả các phim (cả mới và cũ) để kiểm tra
                const allMoviesDetailsPromises = moviesList.map(movie => {
                    if (!movie.slug) {
                        console.error(`❌ Phim '${movie.name}' thiếu slug, không thể lấy chi tiết.`);
                        return null;
                    }

                    return axios.get(`${BASE_URL}movies/${movie.slug}`)
                        .then(res => {
                            // Lấy cả movie và episodes từ response
                            const { movie: movieInfo, episodes } = res.data.data;
                            return { 
                                movieInfo, 
                                episodes,
                                isExisting: existingSlugs.has(movie.slug)
                            };
                        })
                        .catch(err => {
                            console.error(`Lỗi khi lấy chi tiết phim ${movie.slug}:`, err.message);
                            return null;
                        });
                });

                // Wait for all movie details to be fetched
                const allMoviesDetails = await Promise.all(allMoviesDetailsPromises);
                const validMoviesDetails = allMoviesDetails.filter(detail => detail !== null);

                if (validMoviesDetails.length === 0) {
                    console.log("❌ Không có dữ liệu phim chi tiết nào được lấy về.");
                    return { savedMovies: [], updatedMovies: [] };
                }

                // Chia thành hai danh sách: phim mới và phim cần cập nhật
                const newMoviesDetails = validMoviesDetails.filter(detail => !detail.isExisting);
                const existingMoviesDetails = validMoviesDetails.filter(detail => detail.isExisting);

                // Xử lý phim mới - tạo mới hoàn toàn
                for (const detail of newMoviesDetails) {
                    if (!detail || !detail.movieInfo) {
                        console.log("❌ Phim không có dữ liệu chi tiết.");
                        continue;
                    }

                    const { movieInfo, episodes } = detail;

                    const genre = movieInfo.genre || 'Unknown';

                    let category = await Category.findOne({ name: genre });
                    if (!category) {
                        category = new Category({ name: genre });
                        await category.save();
                        console.log(`✅ Thể loại '${genre}' đã được tạo!`);
                    }

                    // Chuẩn bị dữ liệu phim với cấu trúc mới
                    const movieData = {
                        tmdb: {
                            type: movieInfo.tmdb?.type || null,
                            id: movieInfo.tmdb?.id || '',
                            season: movieInfo.tmdb?.season || null,
                            vote_average: movieInfo.tmdb?.vote_average || 0,
                            vote_count: movieInfo.tmdb?.vote_count || 0
                        },
                        imdb: {
                            id: movieInfo.imdb?.id || ''
                        },
                        created: {
                            time: movieInfo.created?.time || new Date()
                        },
                        modified: {
                            time: movieInfo.modified?.time || new Date()
                        },
                        name: movieInfo.name,
                        origin_name: movieInfo.origin_name,
                        content: movieInfo.content,
                        type: movieInfo.type || 'series',
                        status: movieInfo.status || 'completed',
                        thumb_url: movieInfo.thumb_url || '',
                        trailer_url: movieInfo.trailer_url || '',
                        time: movieInfo.time || '60 phút/tập',
                        episode_current: movieInfo.episode_current || '',
                        episode_total: movieInfo.episode_total || '',
                        quality: movieInfo.quality || 'HD',
                        lang: movieInfo.lang || 'Vietsub',
                        notify: movieInfo.notify || '',
                        showtimes: movieInfo.showtimes || '',
                        slug: movieInfo.slug,
                        year: movieInfo.year || new Date().getFullYear(),
                        view: movieInfo.view || 0,
                        actor: Array.isArray(movieInfo.actor) ? movieInfo.actor : [],
                        director: Array.isArray(movieInfo.director) ? movieInfo.director : [''],
                        category: (movieInfo.category || []).map(cat => ({
                            id: cat.id || '',
                            name: cat.name || '',
                            slug: cat.slug || ''
                        })),
                        country: (movieInfo.country || []).map(cou => ({
                            id: cou.id || '',
                            name: cou.name || '',
                            slug: cou.slug || ''
                        })),
                        is_copyright: movieInfo.is_copyright || false,
                        chieurap: movieInfo.chieurap || false,
                        poster_url: movieInfo.poster_url || '',
                        sub_docquyen: movieInfo.sub_docquyen || false,
                        episodes: (episodes || []).map(server => ({
                            server_name: server.server_name,
                            server_data: server.server_data.map(ep => ({
                                name: ep.name,
                                slug: ep.slug,
                                filename: ep.filename,
                                link_embed: ep.link_embed,
                                link_m3u8: ep.link_m3u8
                            }))
                        })),
                        category_id: category._id, // Giữ lại category_id cho khả năng tương thích
                    };

                    try {
                        // Tạo phim mới và đánh dấu là phim mới để cập nhật Elasticsearch
                        const movie = new Movie(movieData);
                        movie._isNew = true; // Đánh dấu là phim mới để cập nhật Elasticsearch
                        await movie.save();
                        console.log(`✅ Tạo mới phim '${movieData.name}' với ${movieData.episodes?.length || 0} server!`);
                        savedMovies.push(movie);
                    } catch (err) {
                        console.error(`❌ Lỗi khi lưu phim '${movieData.name}':`, err.message);
                        console.error('Chi tiết lỗi:', JSON.stringify(movieData, null, 2));
                    }
                }

                // Xử lý phim đã tồn tại - kiểm tra và cập nhật tập mới nếu có
                for (const detail of existingMoviesDetails) {
                    if (!detail || !detail.movieInfo) {
                        console.log("❌ Phim không có dữ liệu chi tiết.");
                        continue;
                    }

                    const { movieInfo, episodes } = detail;
                    const existingMovie = existingMoviesMap.get(movieInfo.slug);

                    if (!existingMovie) {
                        console.error(`❌ Không tìm thấy phim '${movieInfo.name}' (${movieInfo.slug}) trong cache.`);
                        continue;
                    }

                    // Kiểm tra và cập nhật tập mới
                    const updateResult = await this.checkAndUpdateEpisodes(existingMovie, episodes);
                    
                    if (updateResult.updated) {
                        console.log(`✅ ${updateResult.message} cho phim '${movieInfo.name}'.`);
                        updatedMovies.push(updateResult.movie);
                    } else {
                        console.log(`⏩ ${updateResult.message} cho phim '${movieInfo.name}'.`);
                    }
                }

                console.log(`🎉 Crawl dữ liệu phim từ OPhim thành công!`);
                console.log(`📋 Đã tạo mới ${savedMovies.length} phim, cập nhật ${updatedMovies.length} phim.`);
                
                return { savedMovies, updatedMovies };
            } else {
                console.log('❌ Không có dữ liệu phim từ OPhim hoặc cấu trúc dữ liệu không hợp lệ.');
                return { savedMovies: [], updatedMovies: [] };
            }
        } catch (error) {
            console.error('❌ Lỗi khi crawl dữ liệu phim từ OPhim:', error.message);
            return { savedMovies: [], updatedMovies: [] };
        }
    }
    
    cancelCrawlAllPage() {
        this.isCancelled = true;
    }

    async crawlMoviesAllPage() {
        this.isCancelled = false; // reset trước khi chạy mới

        const totalPages = 1500; // Số trang tổng cộng mà bạn muốn crawl
        const allNewMovies = [];
        const allUpdatedMovies = [];
        const errors = [];
        const skippedMovies = []; // Danh sách các phim bị bỏ qua hoàn toàn (không có tập mới)
        let lastProcessedPage = 0;

        try {
            for (let currentPage = 1; currentPage <= totalPages; currentPage++) {
                if (this.isCancelled) {
                    console.log('⏹️ Dừng crawl theo yêu cầu người dùng.');
                    break;
                }

                lastProcessedPage = currentPage;
                const response = await axios.get(`${BASE_URL}movies`, { params: { page: currentPage } });
                const data = response.data;
    
                console.log(`Crawl trang ${currentPage}...`);
    
                if (data.data && data.data.status && Array.isArray(data.data.items) && data.data.items.length > 0) {
                    const moviesList = data.data.items;
                    
                    // Dữ liệu phim mới và phim cập nhật cho trang hiện tại
                    const newMovies = [];
                    const updatedMovies = [];
                    const existingSlugs = new Set();
                    const existingMoviesMap = new Map(); // Map để lưu phim đã tồn tại theo slug
    
                    // Kiểm tra phim nào đã tồn tại trong DB trước khi lấy chi tiết
                    for (const movie of moviesList) {
                        if (movie.slug) {
                            const existingMovie = await Movie.findOne({ slug: movie.slug });
                            if (existingMovie) {
                                existingSlugs.add(movie.slug);
                                existingMoviesMap.set(movie.slug, existingMovie);
                                console.log(`🔍 Phim '${movie.name}' (${movie.slug}) đã tồn tại, kiểm tra cập nhật tập mới...`);
                            }
                        }
                    }
    
                    // Lọc danh sách phim chưa tồn tại
                    const newMoviesList = moviesList.filter(movie => movie.slug && !existingSlugs.has(movie.slug));
                    // Lọc danh sách phim đã tồn tại để kiểm tra cập nhật tập mới
                    const existingMoviesList = moviesList.filter(movie => movie.slug && existingSlugs.has(movie.slug));
                    
                    if (newMoviesList.length === 0 && existingMoviesList.length === 0) {
                        console.log(`⏩ Không có phim nào cần xử lý trên trang ${currentPage}.`);
                        continue;
                    }
                    
                    // Xử lý các phim mới
                    if (newMoviesList.length > 0) {
                        console.log(`🔍 Lấy chi tiết cho ${newMoviesList.length} phim mới từ trang ${currentPage}...`);
                        
                        const newMovieDetailsPromises = newMoviesList.map(movie => {
                            if (!movie.slug) {
                                console.error(`❌ Phim '${movie.name}' thiếu slug, không thể lấy chi tiết.`);
                                return null;
                            }
    
                            return axios.get(`${BASE_URL}movies/${movie.slug}`)
                                .then(res => {
                                    const { movie: movieInfo, episodes } = res.data.data;
                                    return { movieInfo, episodes };
                                })
                                .catch(err => {
                                    console.error(`Lỗi khi lấy chi tiết phim ${movie.slug}:`, err.message);
                                    return null;
                                });
                        });

                        const newMovieDetails = await Promise.all(newMovieDetailsPromises);
                        const validNewMovies = newMovieDetails.filter(detail => detail !== null);

                        for (const detail of validNewMovies) {
                            if (!detail || !detail.movieInfo) {
                                console.log("❌ Phim không có dữ liệu chi tiết.");
                                continue;
                            }

                            const { movieInfo, episodes } = detail;
                            
                            // Lấy thể loại từ movieInfo
                            const genre = movieInfo.genre || 'Unknown';

                            let category = await Category.findOne({ name: genre });
                            if (!category) {
                                category = new Category({ name: genre });
                                await category.save();
                                console.log(`✅ Thể loại '${genre}' đã được tạo!`);
                            }

                            // Chuẩn bị dữ liệu phim với cấu trúc mới
                            const movieData = {
                                tmdb: {
                                    type: movieInfo.tmdb?.type || null,
                                    id: movieInfo.tmdb?.id || '',
                                    season: movieInfo.tmdb?.season || null,
                                    vote_average: movieInfo.tmdb?.vote_average || 0,
                                    vote_count: movieInfo.tmdb?.vote_count || 0
                                },
                                imdb: {
                                    id: movieInfo.imdb?.id || ''
                                },
                                created: {
                                    time: movieInfo.created?.time || new Date()
                                },
                                modified: {
                                    time: movieInfo.modified?.time || new Date()
                                },
                                name: movieInfo.name,
                                origin_name: movieInfo.origin_name,
                                content: movieInfo.content,
                                type: movieInfo.type || 'series',
                                status: movieInfo.status || 'completed',
                                thumb_url: movieInfo.thumb_url || '',
                                trailer_url: movieInfo.trailer_url || '',
                                time: movieInfo.time || '60 phút/tập',
                                episode_current: movieInfo.episode_current || '',
                                episode_total: movieInfo.episode_total || '',
                                quality: movieInfo.quality || 'HD',
                                lang: movieInfo.lang || 'Vietsub',
                                notify: movieInfo.notify || '',
                                showtimes: movieInfo.showtimes || '',
                                slug: movieInfo.slug,
                                year: movieInfo.year || new Date().getFullYear(),
                                view: movieInfo.view || 0,
                                actor: Array.isArray(movieInfo.actor) ? movieInfo.actor : [],
                                director: Array.isArray(movieInfo.director) ? movieInfo.director : [''],
                                category: (movieInfo.category || []).map(cat => ({
                                    id: cat.id || '',
                                    name: cat.name || '',
                                    slug: cat.slug || ''
                                })),
                                country: (movieInfo.country || []).map(cou => ({
                                    id: cou.id || '',
                                    name: cou.name || '',
                                    slug: cou.slug || ''
                                })),
                                is_copyright: movieInfo.is_copyright || false,
                                chieurap: movieInfo.chieurap || false,
                                poster_url: movieInfo.poster_url || '',
                                sub_docquyen: movieInfo.sub_docquyen || false,
                                episodes: (episodes || []).map(server => ({
                                    server_name: server.server_name,
                                    server_data: server.server_data.map(ep => ({
                                        name: ep.name,
                                        slug: ep.slug,
                                        filename: ep.filename,
                                        link_embed: ep.link_embed,
                                        link_m3u8: ep.link_m3u8
                                    }))
                                })),
                                category_id: category._id, // Giữ lại category_id cho khả năng tương thích
                            };

                            try {
                                // Tạo phim mới và đánh dấu là phim mới để cập nhật Elasticsearch
                                const movie = new Movie(movieData);
                                movie._isNew = true; // Đánh dấu là phim mới để cập nhật Elasticsearch
                                await movie.save();
                                console.log(`✅ Tạo mới phim '${movieData.name}' với ${movieData.episodes?.length || 0} server!`);
                                newMovies.push(movie);
                            } catch (err) {
                                if (err.code === 11000) {
                                    console.error(`❌ Lỗi trùng lặp slug: '${movieData.slug}', bỏ qua phim này.`);
                                    errors.push({ movie: movieData.name, slug: movieData.slug });
                                } else {
                                    console.error(`❌ Lỗi khi lưu phim '${movieData.name}':`, err.message);
                                    errors.push({ movie: movieData.name, error: err.message });
                                }
                            }
                        }
                    }
                    
                    // Xử lý các phim đã tồn tại - kiểm tra cập nhật tập mới
                    if (existingMoviesList.length > 0) {
                        console.log(`🔍 Kiểm tra cập nhật tập mới cho ${existingMoviesList.length} phim từ trang ${currentPage}...`);
                        
                        const existingMovieDetailsPromises = existingMoviesList.map(movie => {
                            if (!movie.slug) {
                                console.error(`❌ Phim '${movie.name}' thiếu slug, không thể lấy chi tiết.`);
                                return null;
                            }

                            return axios.get(`${BASE_URL}movies/${movie.slug}`)
                                .then(res => {
                                    const { movie: movieInfo, episodes } = res.data.data;
                                    return { movieInfo, episodes };
                                })
                                .catch(err => {
                                    console.error(`Lỗi khi lấy chi tiết phim ${movie.slug}:`, err.message);
                                    return null;
                                });
                        });

                        const existingMovieDetails = await Promise.all(existingMovieDetailsPromises);
                        const validExistingMovies = existingMovieDetails.filter(detail => detail !== null);

                        // Kiểm tra và cập nhật các phim đã tồn tại
                        for (const detail of validExistingMovies) {
                            if (!detail || !detail.movieInfo) {
                                console.log("❌ Phim không có dữ liệu chi tiết.");
                                continue;
                            }

                            const { movieInfo, episodes } = detail;
                            const existingMovie = existingMoviesMap.get(movieInfo.slug);

                            if (!existingMovie) {
                                console.error(`❌ Không tìm thấy phim '${movieInfo.name}' (${movieInfo.slug}) trong cache.`);
                                continue;
                            }

                            // Kiểm tra và cập nhật tập mới
                            const updateResult = await this.checkAndUpdateEpisodes(existingMovie, episodes);
                            
                            if (updateResult.updated) {
                                console.log(`✅ ${updateResult.message} cho phim '${movieInfo.name}'.`);
                                updatedMovies.push(updateResult.movie);
                            } else {
                                console.log(`⏩ ${updateResult.message} cho phim '${movieInfo.name}'.`);
                                skippedMovies.push({ name: movieInfo.name, slug: movieInfo.slug, reason: updateResult.message });
                            }
                        }
                    }
                    
                    // Thêm kết quả của trang hiện tại vào tổng hợp
                    allNewMovies.push(...newMovies);
                    allUpdatedMovies.push(...updatedMovies);
                    
                    console.log(`📊 Trang ${currentPage}: Đã tạo ${newMovies.length} phim mới, cập nhật ${updatedMovies.length} phim có tập mới.`);
                } else {
                    console.log(`❌ Không có phim nào trên trang ${currentPage}`);
                }
            }

            const cancelled = this.isCancelled;

            console.log(cancelled ? '⏹️ Crawl bị dừng giữa chừng.' : '🎉 Crawl dữ liệu phim từ OPhim hoàn thành!');
            console.log(`📋 Tổng kết: Đã tạo ${allNewMovies.length} phim mới, cập nhật ${allUpdatedMovies.length} phim có tập mới.`);
            console.log(`📋 Số phim bỏ qua (không có tập mới): ${skippedMovies.length}`);
            
            return { 
                savedMovies: allNewMovies, 
                updatedMovies: allUpdatedMovies,
                skippedMovies, 
                errors,
                cancelled,
                lastPage: lastProcessedPage
            };
        } catch (error) {
            console.error('❌ Lỗi khi crawl dữ liệu phim:', error.message);
            return {
                savedMovies: allNewMovies,
                updatedMovies: allUpdatedMovies,
                skippedMovies,
                errors: [...errors, { message: error.message }],
                cancelled: this.isCancelled,
                lastPage: lastProcessedPage
            };
        }
    }

    // Hàm mới để kiểm tra và cập nhật tập mới cho phim đã tồn tại
    async checkAndUpdateEpisodes(existingMovie, newEpisodes) {
        try {
            // Nếu không có episodes mới để kiểm tra
            if (!newEpisodes || newEpisodes.length === 0) {
                return { updated: false, message: 'Không có tập phim mới để kiểm tra.' };
            }

            let hasNewEpisodes = false;
            let newEpisodeCount = 0;
            
            // Tạo bản sao episodes hiện tại để sửa đổi
            const updatedEpisodes = [...existingMovie.episodes];

            // Duyệt qua từng server trong episodes mới
            for (const newServer of newEpisodes) {
                // Tìm server tương ứng trong episodes hiện tại
                const existingServerIndex = updatedEpisodes.findIndex(
                    s => s.server_name === newServer.server_name
                );

                if (existingServerIndex === -1) {
                    // Nếu server chưa tồn tại, thêm mới hoàn toàn
                    updatedEpisodes.push(newServer);
                    newEpisodeCount += newServer.server_data.length;
                    hasNewEpisodes = true;
                    console.log(`✅ Thêm mới server '${newServer.server_name}' với ${newServer.server_data.length} tập.`);
                } else {
                    // Nếu server đã tồn tại, kiểm tra từng episode
                    const existingServer = updatedEpisodes[existingServerIndex];
                    const existingEpisodeSlugs = new Set(existingServer.server_data.map(e => e.slug));
                    
                    // Tìm các episode chưa tồn tại
                    const newServerData = newServer.server_data.filter(
                        episode => !existingEpisodeSlugs.has(episode.slug)
                    );
                    
                    if (newServerData.length > 0) {
                        // Thêm các episode mới vào server hiện tại
                        updatedEpisodes[existingServerIndex].server_data = [
                            ...existingServer.server_data,
                            ...newServerData
                        ];
                        newEpisodeCount += newServerData.length;
                        hasNewEpisodes = true;
                        console.log(`✅ Thêm ${newServerData.length} tập mới vào server '${newServer.server_name}'.`);
                    }
                }
            }

            if (hasNewEpisodes) {
                // Cập nhật trạng thái phim nếu có tập mới
                const episodeStats = this.calculateEpisodeStats(newEpisodes);
                
                // Cập nhật DB với episodes mới và thông tin mới khác
                const updateData = {
                    episodes: updatedEpisodes,
                    modified: { time: new Date() }
                };
                
                // Cập nhật thông tin episode_current và episode_total nếu có
                if (episodeStats.episode_current) {
                    updateData.episode_current = episodeStats.episode_current;
                }
                if (episodeStats.episode_total) {
                    updateData.episode_total = episodeStats.episode_total;
                }
                
                // Sử dụng findOneAndUpdate để cập nhật phim
                const updatedMovie = await Movie.findOneAndUpdate(
                    { _id: existingMovie._id },
                    updateData,
                    { new: true }
                );
                
                return { 
                    updated: true, 
                    message: `Cập nhật thành công ${newEpisodeCount} tập mới.`,
                    movie: updatedMovie
                };
            }
            
            return { updated: false, message: 'Không có tập phim mới để cập nhật.' };
        } catch (error) {
            console.error('❌ Lỗi khi cập nhật tập phim mới:', error);
            return { updated: false, message: `Lỗi: ${error.message}` };
        }
    }
    
    // Hàm hỗ trợ tính toán thông tin episode_current và episode_total từ episodes
    calculateEpisodeStats(episodes) {
        if (!episodes || episodes.length === 0) {
            return {};
        }
        
        let maxEpisodes = 0;
        
        // Tìm server có nhiều episode nhất để xác định số tập hiện tại
        episodes.forEach(server => {
            if (server.server_data && server.server_data.length > maxEpisodes) {
                maxEpisodes = server.server_data.length;
            }
        });
        
        // Định dạng thông tin episode
        return {
            episode_current: `Đã cập nhật ${maxEpisodes} tập`,
            episode_total: `${maxEpisodes} Tập`
        };
    }
}

module.exports = new MovieCrawlService();

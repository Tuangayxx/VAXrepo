// =============================================================================
// CONFIGURATION & METADATA
// =============================================================================

function getManifest() {
    return JSON.stringify({
        "id": "phim4k_vip",
        "name": "Phim4K VIP",
        "version": "1.0.0",
        "baseUrl": "https://stremio.phim4k.xyz",
        "iconUrl": "https://phim4k.com/favicon.ico",
        "isEnabled": true,
        "type": "MOVIE"
    });
}

const AUTH_TOKEN = "eyJ1c2VybmFtZSI6Imh1bmciLCJwYXNzd29yZCI6Imh1bmciLCJ0cyI6MTc2NDcyNTIxNDA1NX0";

function getHomeSections() {
    return JSON.stringify([
        { slug: 'phim4k_movies', title: 'Phim4K Movies', type: 'Horizontal', path: 'catalog/movie' },
        { slug: 'phim4k_series', title: 'Phim4K Series', type: 'Horizontal', path: 'catalog/series' }
    ]);
}

function getPrimaryCategories() {
    return JSON.stringify([
        { name: 'Phim lẻ', slug: 'phim4k_movies' },
        { name: 'Phim bộ', slug: 'phim4k_series' },
        { name: 'Hành động', slug: 'Action & Adventure' },
        { name: 'Viễn tưởng', slug: 'Sci-Fi & Fantasy' },
        { name: 'Kinh dị', slug: 'Horror' },
        { name: 'Hoạt hình', slug: 'Animation' }
    ]);
}

function getFilterConfig() {
    return JSON.stringify({ sort: [{ name: 'Mới cập nhật', value: 'update' }] });
}

// =============================================================================
// URL GENERATION
// =============================================================================

function getUrlList(slug, filtersJson) {
    var type = (slug === 'phim4k_series') ? 'series' : 'movie';
    if (slug !== 'phim4k_movies' && slug !== 'phim4k_series') {
        return "https://stremio.phim4k.xyz/" + AUTH_TOKEN + "/catalog/" + type + "/phim4k_" + type + "s/genre=" + encodeURIComponent(slug) + ".json";
    }
    return "https://stremio.phim4k.xyz/" + AUTH_TOKEN + "/catalog/" + type + "/" + slug + ".json";
}

function getUrlSearch(keyword, filtersJson) {
    return "https://stremio.phim4k.xyz/" + AUTH_TOKEN + "/catalog/movie/phim4k_movies/search=" + encodeURIComponent(keyword) + ".json";
}

function getUrlDetail(id) {
    var type = id.indexOf('series') > -1 ? 'series' : 'movie';
    return "https://stremio.phim4k.xyz/" + AUTH_TOKEN + "/meta/" + type + "/" + id + ".json";
}

// Hàm này sẽ gọi API Stream của Phim4K để lấy danh sách các link chất lượng
function getUrlStream(id) {
    var type = id.indexOf('series') > -1 ? 'series' : 'movie';
    return "https://stremio.phim4k.xyz/" + AUTH_TOKEN + "/stream/" + type + "/" + id + ".json";
}

function getUrlCategories() { return ""; }
function getUrlCountries() { return ""; }
function getUrlYears() { return ""; }

// =============================================================================
// PARSERS
// =============================================================================

function parseListResponse(apiResponseJson) {
    try {
        var response = JSON.parse(apiResponseJson);
        var items = response.metas || [];
        var movies = items.map(function (item) {
            return {
                id: item.id,
                title: item.name,
                posterUrl: item.poster || "",
                backdropUrl: item.background || "",
                year: item.name.match(/\((\d{4})\)/) ? item.name.match(/\((\d{4})\)/)[1] : 0,
                quality: "4K/Bluray",
                episode_current: "Full",
                lang: "Vietsub"
            };
        });
        return JSON.stringify({
            items: movies,
            pagination: { currentPage: 1, totalPages: 1, totalItems: movies.length, itemsPerPage: 20 }
        });
    } catch (error) { return JSON.stringify({ items: [], pagination: { currentPage: 1, totalPages: 1 } }); }
}

function parseSearchResponse(apiResponseJson) { return parseListResponse(apiResponseJson); }

/**
 * ĐÃ CẬP NHẬT: Hàm này giờ đây sẽ nhận dữ liệu từ API Stream của Phim4K
 * và biến mỗi link thành một "tập phim" để người dùng chọn chất lượng.
 */
function parseMovieDetail(apiStreamResponseJson) {
    try {
        var response = JSON.parse(apiStreamResponseJson);
        var streams = response.streams || [];
        
        // Tạo danh sách tập phim dựa trên các link stream (độ phân giải)
        var episodes = streams.map(function (s, index) {
            return {
                id: s.url, // Dùng link proxy trực tiếp làm ID tập
                name: s.title.split(' ').slice(0, 3).join(' '), // Lấy ngắn gọn tiêu đề chất lượng
                slug: "link-" + index
            };
        });

        var servers = [{
            name: "Chất lượng Phim4K",
            episodes: episodes
        }];

        // Trả về cấu trúc để App hiển thị danh sách chọn link
        return JSON.stringify({
            servers: servers,
            quality: "Đa luồng",
            lang: "Vietsub"
        });
    } catch (error) { return "null"; }
}

function parseDetailResponse(selectedStreamUrl) {
    // Vì id tập giờ chính là URL, ta trả về trực tiếp
    return JSON.stringify({
        url: selectedStreamUrl,
        headers: { 
            "User-Agent": "Stremio/1.6.0",
            "Referer": "https://phim4k.lol/",
            "Origin": "https://phim4k.lol"
        },
        subtitles: []
    });
}

function getImageUrl(path) {
    return path || ""; 
}

// =============================================================================
// CẤU HÌNH CƠ BẢN (METADATA)
// =============================================================================

function getManifest() {
    return JSON.stringify({
        "id": "Jayboys",
        "name": "Jayboys - Asian",
        "version": "1.0.0",
        "baseUrl": "https://jayboys.tv",
        "iconUrl": "https://www.javboys.tv/wp-content/uploads/2025/04/177d33e6.webp",
        "isAdult": true,
        "type": "VIDEO",
        "playerType": "embed"
        "layoutType": "HORIZONTAL"
    });
}

function getHomeSections() {
    // Các hàng hiển thị ở màn hình chính
    return JSON.stringify([
        { slug: 'phim-le', title: 'Phim Lẻ Mới', type: 'Horizontal', path: '' },
        { slug: 'phim-bo', title: 'Phim Bộ Mới', type: 'Horizontal', path: '' }
    ]);
}

function getPrimaryCategories() {
    return JSON.stringify([
        { name: 'Hành Động', slug: 'hanh-dong' },
        { name: 'Kinh Dị', slug: 'kinh-di' }
    ]);
}

function getFilterConfig() {
    return JSON.stringify({ sort: [], category: [] });
}

// =============================================================================
// KIẾN TẠO LINK LẤY DỮ LIỆU HTML
// =============================================================================

function getUrlList(slug, filtersJson) {
    var filters = JSON.parse(filtersJson || "{}");
    var page = filters.page || 1;
    // VD: https://domain.com/phim-le?page=1
    return "https://domain-phim-cua-ban.com/" + slug + "?page=" + page;
}

function getUrlSearch(keyword, filtersJson) {
    var page = JSON.parse(filtersJson || "{}").page || 1;
    return "https://domain-phim-cua-ban.com/tim-kiem?q=" + encodeURIComponent(keyword) + "&page=" + page;
}

function getUrlDetail(slug) {
    // Trả về link trang chi tiết từ slug lấy được trong parseListResponse
    return "https://domain-phim-cua-ban.com/phim/" + slug;
}

function getUrlCategories() { return ""; }
function getUrlCountries() { return ""; }
function getUrlYears() { return ""; }

// =============================================================================
// XỬ LÝ HTML SOURCE -> JSON MÀ APP ĐỌC ĐƯỢC
// =============================================================================

function parseListResponse(html) {
    // Tự viết Regex hoặc thao tác trên chuỗi HTML để rọc lấy danh sách phim
    // Cần mảng các đối tượng có id/slug, title, posterUrl, quality...
    // Trả về JSON String: {"items": [{id, title, posterUrl, ...}], "pagination": {currentPage, totalPages}}
    return JSON.stringify({
        items: [],
        pagination: { currentPage: 1, totalPages: 1 }
    });
}

function parseSearchResponse(html) {
    return parseListResponse(html);
}

function parseMovieDetail(html) {
    // 1. Lấy Tên phim
    var titleMatch = html.match(/<h1 class="title">([^<]+)<\/h1>/);
    var title = titleMatch ? titleMatch[1].trim() : "Unknown Title";

    // 2. Lấy Ảnh bìa (Poster)
    var imgMatch = html.match(/<meta property="og:image" content="([^"]+)"/);
    var posterUrl = imgMatch ? imgMatch[1] : "";

    // 3. Lấy Danh sách Server và Link Embed
    var servers = [];
    var episodes = [];
    
    // Regex tìm tất cả các block player chứa data-src
    var playerRegex = /<div[^>]+id="([^"]+)"[^>]+class="video-player[^"]*"[^>]+data-src="([^"]+)"/g;
    var match;
    var count = 1;
    
    while ((match = playerRegex.exec(html)) !== null) {
        var playerId = match[1]; // Ví dụ: player1
        var linkEmbed = match[2]; // Ví dụ: https://1069.website/e/...

        episodes.push({
            "id": playerId,
            "name": "Server " + count,
            "slug": linkEmbed // Cực kỳ quan trọng: Lưu thẳng link embed vào slug!
        });
        count++;
    }

    if (episodes.length > 0) {
        servers.push({
            "name": "Nguồn Phát",
            "episodes": episodes
        });
    }

    return JSON.stringify({
        id: "", // Thường app tự xử lý ID
        title: title,
        posterUrl: posterUrl,
        backdropUrl: posterUrl,
        description: "Chúc bạn xem phim vui vẻ trên VAAPP!",
        servers: servers,
        quality: "HD",
        year: 2026,
        rating: 5.0,
        status: "Full"
    });
}

function parseDetailResponse(html) {
    var url = "";

    // MẸO: Vì mình đã gắn link Embed vào biến slug ở hàm Detail, 
    // App thường sẽ truyền thẳng link này vào tham số html (hoặc bạn tự bóc lại từ DOM nếu App truyền mã nguồn).
    if (html.indexOf("http") === 0 && html.indexOf("<html") === -1) {
        // Nếu biến truyền vào chính là link Embed
        url = html;
    } else {
        // Nếu App truyền vào mã nguồn HTML, ta tự đi tìm data-src của player đầu tiên
        var iframeMatch = html.match(/<div[^>]+class="video-player[^"]*"[^>]+data-src="([^"]+)"/i);
        if (iframeMatch) {
            url = iframeMatch[1];
        }
    }

    return JSON.stringify({
        url: url,
        headers: {
            "Referer": "https://www.javboys.tv/", // Fake Referer để qua mặt hệ thống chống trộm
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        },
        subtitles: []
    });
}

function parseCategoriesResponse(html) { return "[]"; }
function parseCountriesResponse(html) { return "[]"; }
function parseYearsResponse(html) { return "[]"; }

// =============================================================================
// CẤU HÌNH CƠ BẢN (METADATA)
// =============================================================================
function getManifest() {
    return JSON.stringify({
        "id": "javboys",
        "name": "JavBoys",
        "version": "1.0.0",
        "baseUrl": "https://www.javboys.tv",
        "iconUrl": "https://jgcdn.com/wp-content/uploads/2025/09/t4636.webp",
        "isEnabled": true,
        "isAdult": true,
        "type": "MOVIE",
        "layoutType": "VERTICAL"
    });
}

// =============================================================================
// CẤU HÌNH GIAO DIỆN APP
// =============================================================================

function getHomeSections() {
    // Các hàng hiển thị ở màn hình chính (Trang chủ)
    return JSON.stringify([
        { slug: '', title: 'Mới Cập Nhật', type: 'Horizontal', path: '' }, // slug rỗng để gọi trang chủ
        { slug: 'category/amateur/', title: 'Video Hàn Quốc', type: 'Horizontal', path: '' },
        { slug: 'category/onlyfans/', title: 'Video Châu Á (Onlyfans)', type: 'Horizontal', path: '' },
        { slug: 'category/movies/', title: 'Phim Ngắn', type: 'Horizontal', path: '' }
    ]);
}

function getPrimaryCategories() {
    // Menu Thể loại ở thanh điều hướng
    return JSON.stringify([
        { name: 'Mới Nhất', slug: '' },
        { name: 'Hàn Quốc', slug: 'category/amateur/' },
        { name: 'Châu Á (OF)', slug: 'category/onlyfans/' },
        { name: 'Phim Ngắn', slug: 'category/movies/' },
        { name: 'Hunk Channel', slug: 'category/hunk-channel/' },
        { name: 'Western', slug: 'category/western-gay-porn-hd/' }
    ]);
}

// =============================================================================
// KIẾN TẠO LINK LẤY DỮ LIỆU HTML
// =============================================================================

function getUrlList(slug, filtersJson) {
    var filters = JSON.parse(filtersJson || "{}");
    var page = filters.page || 1;
    var url = "https://www.javboys.tv/" + slug; 
    
    // Thêm đuôi /page/2/ nếu người dùng cuộn trang để tải thêm
    if (page > 1) {
        url += "page/" + page + "/";
    }
    return url;
}

// =============================================================================
// KIẾN TẠO LINK LẤY DỮ LIỆU HTML
// =============================================================================
function getUrlList(slug, filtersJson) {
    return "https://www.javboys.tv/" + slug; 
}

function getUrlSearch(keyword, filtersJson) {
    return "https://www.javboys.tv/?s=" + encodeURIComponent(keyword);
}

function getUrlDetail(slug) {
    // Vì mình lấy full URL ở hàm parseListResponse, nên hàm này chỉ cần trả lại đúng slug đó
    return slug; 
}

function getUrlCategories() { return ""; }
function getUrlCountries() { return ""; }
function getUrlYears() { return ""; }

// =============================================================================
// PARSER: BÓC TÁCH DỮ LIỆU
// =============================================================================

// 1. Tách Danh sách video ở Trang chủ / Thể loại
function parseListResponse(html) {
    var items = [];
    var blocks = html.split('<div class="video');
    
    for (var i = 1; i < blocks.length; i++) {
        var block = blocks[i];
        
        var linkMatch = block.match(/href="([^"]+)"/);
        if (!linkMatch) continue; 
        var fullUrl = linkMatch[1];
        var id = fullUrl; // Lấy full link làm ID để truyền sang getUrlDetail
        
        var titleMatch = block.match(/<span class="title">([^<]+)<\/span>/) || block.match(/title="([^"]+)"/);
        var title = titleMatch ? titleMatch[1].trim() : "Không có tiêu đề";

        var imgMatch = block.match(/<img[^>]+src="([^"]+)"/i);
        var posterUrl = imgMatch ? imgMatch[1] : "";

        var timeMatch = block.match(/<span class="time-desc">([^<]+)<\/span>/i);
        var quality = timeMatch ? timeMatch[1].trim() : "";

        items.push({
            id: id,
            title: title,
            posterUrl: posterUrl,
            quality: quality 
        });
    }

    return JSON.stringify({
        items: items,
        pagination: { currentPage: 1, totalPages: 1 } 
    });
}

function parseSearchResponse(html) {
    return parseListResponse(html);
}

// 2. Tách Thông tin Chi tiết và Server (Link Embed)
// =============================================================================
// PARSER CHI TIẾT VÀ LINK VIDEO (ĐÃ FIX LỖI "KHÔNG TÌM THẤY LINK")
// =============================================================================

// =============================================================================
// PARSER CHI TIẾT & GIẢI MÃ LINK VIDEO
// =============================================================================

function parseMovieDetail(html) {
    var titleMatch = html.match(/<h1 class="title">([^<]+)<\/h1>/);
    var title = titleMatch ? titleMatch[1].trim() : "Unknown Title";

    var imgMatch = html.match(/<meta property="og:image" content="([^"]+)"/);
    var posterUrl = imgMatch ? imgMatch[1] : "";

    var servers = [];
    var episodes = [];
    
    // Tìm tất cả các Embed Server
    var playerRegex = /<div[^>]+id="([^"]+)"[^>]+class="video-player[^"]*"[^>]+data-src="([^"]+)"/g;
    var match;
    var count = 1;
    
    while ((match = playerRegex.exec(html)) !== null) {
        var playerId = match[1]; 
        var linkEmbed = match[2]; 

        episodes.push({
            "id": playerId,
            "name": "Server " + count,
            "slug": linkEmbed // Trả đúng cái link Embed (VD: https://onecdns.com/...) cho App
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
        id: "", 
        title: title,
        posterUrl: posterUrl,
        backdropUrl: posterUrl,
        description: "Kho phim JavBoys. Chúc bạn xem phim vui vẻ trên VAAPP!",
        servers: servers,
        quality: "HD",
        year: 2026,
        rating: 5.0,
        status: "Full"
    });
}

function parseDetailResponse(html) {
    var url = "";

    // Bước 1: Thử tìm link m3u8 lộ thiên (Nếu Server hôm đó quên mã hóa)
    var m3u8Match = html.match(/(https:\/\/[^"']*\.m3u8[^"']*)/i);
    if (m3u8Match) {
        url = m3u8Match[1];
    } 
    // Bước 2: Kích hoạt "Động cơ Giải mã" để phá lớp bảo vệ eval(function...)
    else {
        var packMatch = html.match(/return p\}\('(.*?)',\s*(\d+),\s*(\d+),\s*'([^']+)'\.split\('\|'\)/);
        if (packMatch) {
            var p = packMatch[1];
            var a = parseInt(packMatch[2]);
            var c = parseInt(packMatch[3]);
            var k = packMatch[4].split('|');

            // Quá trình giải mã (Unpack)
            while (c--) {
                if (k[c]) {
                    p = p.replace(new RegExp('\\b' + c.toString(a) + '\\b', 'g'), k[c]);
                }
            }

            // Sau khi cởi bỏ lớp ngụy trang, tìm lại link m3u8 ẩn giấu bên trong
            var unpackedM3u8 = p.match(/(https:\/\/[^"']*\.m3u8[^"']*)/i);
            if (unpackedM3u8) {
                url = unpackedM3u8[1];
            }
        }
    }

    // Trả link siêu VIP cho App chạy trực tiếp
    return JSON.stringify({
        url: url,
        headers: {
            "Referer": "https://www.javboys.tv/", // Che mắt Server bằng Referer gốc
            "Origin": "https://www.javboys.tv/",
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        },
        subtitles: []
    });
}
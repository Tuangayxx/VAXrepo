// =============================================================================
// PLUGIN GAYPORNVIDSXXX - VAAPP V2 (CHUẨN HTML SẢN PHẨM)
// =============================================================================

function getManifest() {
    return JSON.stringify({
        "id": "gaypornvidsxxx",
        "name": "GayPornVidsXXX",
        "version": "1.0.0",
        "baseUrl": "https://www.gaypornvidsxxx.com",
        "iconUrl": "https://raw.githubusercontent.com/Tuangayxx/VAXrepo/main/plugins/gpvx.png",
        "isEnabled": true,
        "isAdult": true,
        "type": "MOVIE",
        "playerType": "auto",
        "layoutType": "VERTICAL"
    });
}

function getHomeSections() {
    return JSON.stringify([
        { slug: 'home', title: 'Mới Cập Nhật', type: 'Horizontal', path: '' },
        { slug: 'home?tag=Japanese', title: 'Japanese', type: 'Horizontal', path: '' },
        { slug: 'home?tag=Chinese', title: 'Chinese', type: 'Horizontal', path: '' },
        { slug: 'home?tag=Gay Movie', title: 'Gay Movie', type: 'Horizontal', path: '' },
        { slug: 'home?tag=Onlyfans', title: 'Onlyfans', type: 'Horizontal', path: '' },
        { slug: 'home?tag=Western', title: 'Western', type: 'Horizontal', path: '' }
    ]);
}

function getPrimaryCategories() {
    return JSON.stringify([
        { name: 'Trang Chủ', slug: 'home' },
        { name: 'Japanese', slug: 'home?tag=Japanese' },
        { name: 'Chinese', slug: 'home?tag=Chinese' },
        { name: 'Gay Movie', slug: 'home?tag=Gay Movie' },
        { name: 'Onlyfans', slug: 'home?tag=Onlyfans' },
        { name: 'Western', slug: 'home?tag=Western' }
    ]);
}

function getFilterConfig() { return "{}"; }

function getUrlList(slug, filtersJson) {
    var filters = JSON.parse(filtersJson || "{}");
    var page = filters.page || 1;
    var url = "https://www.gaypornvidsxxx.com/" + slug; 
    
    // Xử lý phân trang nếu Squarespace có hỗ trợ (thường dùng offset, nhưng ở đây tạm dùng query page cơ bản)
    if (page > 1) { 
        if (slug.indexOf("?") !== -1) {
            url += "&page=" + page; 
        } else {
            url += "?page=" + page;
        }
    }
    return url;
}

function getUrlSearch(keyword, filtersJson) {
    var page = JSON.parse(filtersJson || "{}").page || 1;
    var url = "https://www.gaypornvidsxxx.com/search?q=" + encodeURIComponent(keyword);
    if (page > 1) { url += "&page=" + page; }
    return url;
}

function getUrlDetail(slug) {
    if (slug.indexOf("http") === -1) {
        return "https://www.gaypornvidsxxx.com/" + slug;
    }
    return slug; 
}

function getUrlCategories() { return ""; }
function getUrlCountries() { return ""; }
function getUrlYears() { return ""; }

// =============================================================================
// PARSER XỬ LÝ DỮ LIỆU HTML
// =============================================================================

function parseListResponse(html) {
    var items = [];
    
    // Tách theo cấu trúc block <article class="hentry"> của Squarespace
    var blocks = html.split('<article class="hentry');
    
    for (var i = 1; i < blocks.length; i++) {
        var block = blocks[i];
        
        // 1. Lấy Link (bỏ domain đi nếu có)
        var linkMatch = block.match(/href="([^"]+)"/);
        if (!linkMatch) continue;
        var id = linkMatch[1];
        if (id.indexOf('http') === 0) {
            id = id.replace(/https?:\/\/[^\/]+\//i, '');
        } else if (id.indexOf('/') === 0) {
            id = id.substring(1); // Cắt bỏ dấu / ở đầu
        }

        // 2. Lấy Ảnh Bìa (Xuyên thủng LazyLoad Squarespace bằng data-src)
        var imgMatch = block.match(/data-src="([^"]+)"/i) || block.match(/<img[^>]+src="([^"]+)"/i);
        var posterUrl = imgMatch ? imgMatch[1] : "";

        // 3. Lấy Tiêu đề
        var titleMatch = block.match(/<h1 class="blog-title">[\s\S]*?<a[^>]*>([^<]+)<\/a>/i) || block.match(/alt="([^"]+)"/i);
        var title = titleMatch ? titleMatch[1].trim() : "Không có tiêu đề";

        items.push({
            id: id,
            title: title,
            posterUrl: posterUrl,
            quality: "HD" // Thêm tag chất lượng mặc định
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

function parseMovieDetail(html) {
    var titleMatch = html.match(/<title>([^<]+)<\/title>/i);
    var title = titleMatch ? titleMatch[1].replace('–', '-').split('-')[0].trim() : "Unknown Title";

    var imgMatch = html.match(/data-src="([^"]+)"/i) || html.match(/<img[^>]+src="([^"]+)"/i);
    var posterUrl = imgMatch ? imgMatch[1] : "";

    var servers = [];
    var hasServers = false;

    // Quét tìm tất cả các nút đổi Server trong mã nguồn HTML mà bạn gửi
    var btnRegex = /onclick="changeServer\(this,\s*'([^']+)'\)"[^>]*>([^<]+)<\/button>/g;
    var match;
    
    while ((match = btnRegex.exec(html)) !== null) {
        hasServers = true;
        var linkEmbed = match[1]; // Ví dụ: https://byselapuix.com/e/...
        var serverName = match[2].trim(); // Ví dụ: Server 1

        servers.push({
            "name": serverName,
            "episodes": [
                {
                    "id": linkEmbed, // Lưu thẳng link embed vào ID để App tự fetch
                    "name": "Full",
                    "slug": linkEmbed
                }
            ]
        });
    }

    // Dự phòng: Nếu trang web không có nút chuyển server, ta lấy link iframe mặc định
    if (!hasServers) {
        var iframeMatch = html.match(/<iframe[^>]+src="([^"]+)"/i);
        if (iframeMatch) {
            servers.push({
                "name": "Server 1",
                "episodes": [
                    {
                        "id": iframeMatch[1],
                        "name": "Full",
                        "slug": iframeMatch[1]
                    }
                ]
            });
        }
    }

    return JSON.stringify({
        id: "", 
        title: title,
        posterUrl: posterUrl,
        backdropUrl: posterUrl,
        description: "Gaypornvidsxxx - Free Gay Porn Videos. Chúc bạn xem phim vui vẻ!",
        servers: servers,
        quality: "HD",
        year: 2026,
        rating: 5.0,
        status: "Full"
    });
}

function parseDetailResponse(html, slug) {
    // Với các host chuyên biệt như voe.sx, playmogo,... việc dùng WebView 
    // qua cơ chế của App là phương án tốt nhất để bypass quảng cáo & chặn.
    
    return JSON.stringify({
        url: slug, // slug chính là link Embed mà chúng ta gắn ở hàm trên
        isEmbed: false, 
        mimeType: "", // Để trống mimeType để App nhận diện đây là Embed URL và tự động bật WebView chiếu phim
        headers: {
            "Referer": "https://www.gaypornvidsxxx.com/", 
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        },
        subtitles: []
    });
}

function parseEmbedResponse(html, sourceUrl) {
    return JSON.stringify({ url: "", isEmbed: false });
}
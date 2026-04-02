// =============================================================================
// PLUGIN JAVBOYS - VAAPP V2 CHUẨN MỚI
// =============================================================================

function getManifest() {
    return JSON.stringify({
        "id": "javboys",
        "name": "JavBoys",
        "version": "1.0.1",
        "baseUrl": "https://www.javboys.tv",
        "iconUrl": "https://raw.githubusercontent.com/Tuangayxx/VAXrepo/refs/heads/main/plugins/jayboys_icon.webp",
        "isEnabled": true,
        "isAdult": true,
        "type": "MOVIE",
        "playerType": "exoplayer",
        "layoutType": "HORIZONTAL"
    });
}

function getHomeSections() {
    return JSON.stringify([
        { slug: '', title: 'Mới Cập Nhật', type: 'Horizontal', path: '' }, // slug rỗng để gọi trang chủ
        { slug: '2026/03/', title: '03', type: 'Horizontal', path: '' },
        { slug: 'category/onlyfans/', title: 'Onlyfans', type: 'Horizontal', path: '' },
        { slug: '?s=Hot+bro', title: 'HotBro', type: 'Horizontal', path: '' }
    ]);
}

function getPrimaryCategories() {
    return JSON.stringify([
        { name: 'Mới Nhất', slug: '' },
        { name: 'March', slug: '2026/03/' },
        { name: 'Onlyfans', slug: 'category/onlyfans/' },
        { name: 'Phim Ngắn', slug: 'category/movies/' },
        { name: 'Hunk Channel', slug: 'category/hunk-channel/' },
        { name: 'Western', slug: 'category/western-gay-porn-hd/' }
    ]);
}

function getFilterConfig() { return "{}"; }

// =============================================================================
// NHÓM 2: KIẾN TẠO LINK LẤY DỮ LIỆU
// =============================================================================

function getUrlList(slug, filtersJson) {
    var filters = JSON.parse(filtersJson || "{}");
    var page = filters.page || 1;
    var url = "https://www.javboys.tv/" + slug; 
    if (page > 1) {
        url += "page/" + page + "/";
    }
    return url;
}

function getUrlSearch(keyword, filtersJson) {
    var filters = JSON.parse(filtersJson || "{}");
    var page = filters.page || 1;
    var url = "https://www.javboys.tv/?s=" + encodeURIComponent(keyword);
    if (page > 1) {
        url += "&page=" + page;
    }
    return url;
}

function getUrlDetail(slug) {
    // Trong chuẩn mới, vì ta lưu thẳng Full URL vào ID phim và ID tập phim,
    // nên App sẽ gọi hàm này và truyền Full URL vào. Ta chỉ việc return chính nó để App fetch.
    return slug; 
}

function getUrlCategories() { return ""; }
function getUrlCountries() { return ""; }
function getUrlYears() { return ""; }

// =============================================================================
// NHÓM 3: PARSER XỬ LÝ DỮ LIỆU HTML
// =============================================================================

function parseListResponse(html) {
    var items = [];
    var blocks = html.split('<div class="video');
    
    for (var i = 1; i < blocks.length; i++) {
        var block = blocks[i];
        
        var linkMatch = block.match(/href="([^"]+)"/);
        if (!linkMatch) continue; 
        
        // Lưu Full URL vào ID để getUrlDetail nhận trực tiếp
        var id = linkMatch[1]; 
        
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

function parseMovieDetail(html) {
    var titleMatch = html.match(/<h1 class="title">([^<]+)<\/h1>/);
    var title = titleMatch ? titleMatch[1].trim() : "Unknown Title";

    var imgMatch = html.match(/<meta property="og:image" content="([^"]+)"/);
    var posterUrl = imgMatch ? imgMatch[1] : "";

    var servers = [];
    var episodes = [];
    
    var playerRegex = /<div[^>]+id="([^"]+)"[^>]+class="video-player[^"]*"[^>]+data-src="([^"]+)"/g;
    var match;
    var count = 1;
    
    while ((match = playerRegex.exec(html)) !== null) {
        var linkEmbed = match[2]; // Gán trực tiếp link Embed (VD: https://onecdns.com/...)

        episodes.push({
            "id": linkEmbed, // App sẽ truyền ID này vào getUrlDetail -> Tự động fetch Embed HTML
            "name": "Server " + count,
            "slug": linkEmbed
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

    // Lúc này 'html' là mã nguồn thô của trang Embed (sau khi App đã tự fetch)
    // Áp dụng Động Cơ Giải Mã JavaScript Obfuscator
    var m3u8Match = html.match(/(https:\/\/[^"']*\.m3u8[^"']*)/i);
    
    if (m3u8Match) {
        url = m3u8Match[1];
    } else {
        var packMatch = html.match(/return p\}\('(.*?)',\s*(\d+),\s*(\d+),\s*'([^']+)'\.split\('\|'\)/);
        if (packMatch) {
            var p = packMatch[1];
            var a = parseInt(packMatch[2]);
            var c = parseInt(packMatch[3]);
            var k = packMatch[4].split('|');

            while (c--) {
                if (k[c]) {
                    p = p.replace(new RegExp('\\b' + c.toString(a) + '\\b', 'g'), k[c]);
                }
            }

            var unpackedM3u8 = p.match(/(https:\/\/[^"']*\.m3u8[^"']*)/i);
            if (unpackedM3u8) {
                url = unpackedM3u8[1];
            }
        }
    }

    // Trả về JSON chuẩn cấu trúc VAAPP mới
    return JSON.stringify({
        url: url,
        isEmbed: false, // Báo cho App biết đây là link stream cuối cùng, hãy phát ngay!
        mimeType: "application/x-mpegURL", // Ép ExoPlayer dùng chuẩn HLS
        headers: {
            "Referer": "https://www.javboys.tv/", 
            "Origin": "https://www.javboys.tv/",
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        },
        subtitles: []
    });
}

function parseEmbedResponse(html, sourceUrl) {
    return JSON.stringify({ url: "", isEmbed: false });
}
// =============================================================================
// JAVBOYS.TV - PLUGIN VAAPP (Phiên bản tối ưu - 2026)
// =============================================================================

function getManifest() {
    return JSON.stringify({
        "id": "javboys",
        "name": "JavBoys",
        "version": "1.0.1",           // Tăng version
        "baseUrl": "https://www.javboys.tv",
        "iconUrl": "https://raw.githubusercontent.com/Tuangayxx/VAXrepo/main/plugins/jayboys_icon.webp",
        "isEnabled": true,
        "isAdult": true,
        "type": "MOVIE",
        "layoutType": "HORIZONTAL",
        "playerType": "auto"
    });
}

function getHomeSections() {
    return JSON.stringify([
        { slug: '', title: 'Mới Cập Nhật', type: 'Horizontal', path: '' },
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
// NHÓM 2: KIẾN TẠO LINK
// =============================================================================

function getUrlList(slug, filtersJson) {
    var filters = JSON.parse(filtersJson || "{}");
    var page = filters.page || 1;
    var url = "https://www.javboys.tv/" + slug;

    if (page > 1) {
        url += (slug.includes("?") ? "&" : (slug.endsWith("/") ? "" : "/")) + "page/" + page + "/";
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
    return slug; // full URL đã lưu trong ID
}

function getUrlCategories() { return ""; }
function getUrlCountries() { return ""; }
function getUrlYears() { return ""; }

// =============================================================================
// NHÓM 3: PARSER
// =============================================================================

function parseListResponse(html) {
    var items = [];
    // Regex mạnh, lấy từng block video
    var videoRegex = /<div class="video[^>]*>([\s\S]*?)<\/div>/gi;
    var match;

    while ((match = videoRegex.exec(html)) !== null) {
        var block = match[1];

        // Link (full URL)
        var linkMatch = block.match(/href=["']([^"']+)["']/);
        if (!linkMatch) continue;
        var id = linkMatch[1];

        // Title
        var titleMatch = block.match(/<span class="title">([^<]+)<\/span>/) ||
                         block.match(/title=["']([^"']+)["']/);
        var title = titleMatch ? titleMatch[1].trim() : "Không có tiêu đề";

        // Poster
        var imgMatch = block.match(/<img[^>]+src=["']([^"']+)["']/i);
        var posterUrl = imgMatch ? imgMatch[1] : "";

        // Quality / Time
        var timeMatch = block.match(/<span class="time-desc">([^<]+)<\/span>/i);
        var quality = timeMatch ? timeMatch[1].trim() : "";

        items.push({
            id: id,
            title: title,
            posterUrl: posterUrl,
            quality: quality
        });
    }

    // ====================== PAGINATION ======================
    var pagination = { currentPage: 1, totalPages: 1 };

    // Cách 1: Lấy số trang cuối cùng
    var lastPageMatch = html.match(/page\/(\d+)\/"[^>]*>(?:Last|Cuối)/i) ||
                        html.match(/class=["']page-numbers["'][^>]*>(\d+)[^<]*<\/a>/g);

    if (lastPageMatch) {
        if (Array.isArray(lastPageMatch)) {
            var max = 1;
            lastPageMatch.forEach(function(numStr) {
                var num = parseInt(numStr.match(/\d+/)[0]);
                if (num > max) max = num;
            });
            pagination.totalPages = max;
        } else {
            pagination.totalPages = parseInt(lastPageMatch[1]);
        }
    }

    // Cách 2: fallback - lấy tất cả số trang
    if (pagination.totalPages === 1) {
        var allPages = html.match(/class=["']page-numbers["'][^>]*>(\d+)/g);
        if (allPages) {
            var maxPage = 1;
            allPages.forEach(function(p) {
                var n = parseInt(p.match(/\d+/)[0]);
                if (n > maxPage) maxPage = n;
            });
            pagination.totalPages = maxPage;
        }
    }

    return JSON.stringify({
        items: items,
        pagination: pagination
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
    var count = 1;

    // Regex linh hoạt hơn cho player
    var playerRegex = /data-src=["']([^"']+)["'][^>]*class=["'][^"']*video-player/gi;
    var match;

    while ((match = playerRegex.exec(html)) !== null) {
        var linkEmbed = match[1];
        episodes.push({
            id: linkEmbed,
            name: "Server " + count++,
            slug: linkEmbed
        });
    }

    if (episodes.length > 0) {
        servers.push({
            name: "Nguồn Phát",
            episodes: episodes
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

    try {
        // 1. Tìm m3u8 trực tiếp
        var m3u8Match = html.match(/(https:\/\/[^"'\s>]+?\.m3u8(?:\?[^"'\s>]*)?)/i);
        if (m3u8Match) {
            url = m3u8Match[1];
        } 
        // 2. Giải mã packer (nếu có)
        else {
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

                var unpackedM3u8 = p.match(/(https:\/\/[^"'\s>]+?\.m3u8(?:\?[^"'\s>]*)?)/i);
                if (unpackedM3u8) {
                    url = unpackedM3u8[1];
                }
            }
        }
    } catch (e) {
        // Bỏ qua lỗi unpack, vẫn trả về rỗng
    }

    return JSON.stringify({
        url: url,
        isEmbed: false,
        mimeType: "application/x-mpegURL",
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

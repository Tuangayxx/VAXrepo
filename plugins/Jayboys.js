// =============================================================================
// PLUGIN JAVBOYS - VAAPP (BẢN V1.0.4 - SIÊU CHỐNG LỖI)
// =============================================================================

function getManifest() {
    return JSON.stringify({
        "id": "javboys",
        "name": "JavBoys",
        "version": "1.0.4",
        "baseUrl": "https://www.javboys.tv",
        "iconUrl": "https://raw.githubusercontent.com/Tuangayxx/VAXrepo/main/plugins/jayboys_icon.webp",
        "isEnabled": true,
        "isAdult": true,
        "type": "MOVIE",
        "playerType": "auto", 
        "layoutType": "HORIZONTAL"
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
        { name: 'HotBro', slug: '?s=Hot+bro' }
    ]);
}

function getFilterConfig() {
    return JSON.stringify({});
}

function getUrlList(slug, filtersJson) {
    var filters = JSON.parse(filtersJson || "{}");
    var page = filters.page || 1;
    var url = "https://www.javboys.tv/" + slug; 
    
    if (page > 1) { 
        if (slug.indexOf("?") !== -1) {
            url += "&paged=" + page; 
        } else {
            if (!url.endsWith('/')) { url += '/'; }
            url += "page/" + page + "/"; 
        }
    }
    return url;
}

function getUrlSearch(keyword, filtersJson) {
    var page = JSON.parse(filtersJson || "{}").page || 1;
    var url = "https://www.javboys.tv/?s=" + encodeURIComponent(keyword);
    if (page > 1) { url += "&paged=" + page; }
    return url;
}

function getUrlDetail(slug) {
    if (slug.indexOf("http") === -1) {
        return "https://www.javboys.tv/" + slug + "/";
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
    try {
        var items = [];
        // Tách block an toàn, không quan tâm khoảng trắng
        var blocks = html.split(/class="thumb-view"/i);
        
        for (var i = 1; i < blocks.length; i++) {
            var block = blocks[i];
            
            var linkMatch = block.match(/href="([^"]+)"/i);
            if (!linkMatch) continue; 
            
            var fullUrl = linkMatch[1]; 
            var id = fullUrl.replace(/https?:\/\/(www\.)?javboys\.tv\//i, "");
            if (id.endsWith('/')) { id = id.slice(0, -1); }
            
            var titleMatch = block.match(/<span class="title">([^<]+)<\/span>/i) || block.match(/title="([^"]+)"/i);
            var title = titleMatch ? titleMatch[1].trim() : "Không có tiêu đề";

            var imgMatch = block.match(/data-src="([^"]+)"/i) || block.match(/data-lazy-src="([^"]+)"/i) || block.match(/<img[^>]+src="([^"]+)"/i);
            var posterUrl = imgMatch ? imgMatch[1] : "";

            var timeMatch = block.match(/<span class="time-desc">([^<]+)<\/span>/i) || block.match(/class="time-desc"[^>]*>([^<]+)</i);
            var quality = timeMatch ? timeMatch[1].trim() : "";

            if (id) {
                items.push({
                    id: id,
                    title: title,
                    posterUrl: posterUrl,
                    quality: quality 
                });
            }
        }

        return JSON.stringify({
            items: items,
            pagination: { currentPage: 1, totalPages: 1 } 
        });
    } catch (e) {
        // Nếu có lỗi sập code, trả về danh sách rỗng để App không bị trắng màn hình
        return JSON.stringify({ items: [], pagination: { currentPage: 1, totalPages: 1 } });
    }
}

function parseSearchResponse(html) {
    return parseListResponse(html);
}

function parseMovieDetail(html) {
    try {
        var titleMatch = html.match(/<h1 class="title">([^<]+)<\/h1>/);
        var title = titleMatch ? titleMatch[1].trim() : "Unknown Title";

        var imgMatch = html.match(/<meta property="og:image" content="([^"]+)"/);
        var posterUrl = imgMatch ? imgMatch[1] : "";

        var servers = [];
        var playerRegex = /<div[^>]+id="([^"]+)"[^>]+class="video-player[^"]*"[^>]+data-src="([^"]+)"/g;
        var match;
        var count = 1;
        
        while ((match = playerRegex.exec(html)) !== null) {
            var linkEmbed = match[2]; 
            servers.push({
                "name": "Server " + count,
                "episodes": [{ "id": linkEmbed, "name": "Full", "slug": linkEmbed }]
            });
            count++;
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
    } catch (e) {
        return JSON.stringify({ id: "", title: "Lỗi Tải Phim", servers: [] });
    }
}

function parseDetailResponse(html, slug) {
    try {
        var url = "";

        // 1. Thử tìm link m3u8
        var m3u8Match = html.match(/(https?:\/\/[^"']*\.m3u8[^"']*)/i);
        if (m3u8Match) {
            url = m3u8Match[1];
        } else {
            // 2. Chạy thuật toán giải mã
            var packMatch = html.match(/return p\}\('([\s\S]*?)',\s*(\d+),\s*(\d+),\s*'([^']+)'\.split\('\|'\)/);
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
                var unpackedM3u8 = p.match(/(https?:\/\/[^"']*\.m3u8[^"']*)/i) || p.match(/(https?:\\\/\\\/[^"']*\.m3u8[^"']*)/i);
                if (unpackedM3u8) {
                    url = unpackedM3u8[1].replace(/\\\//g, '/');
                }
            }
        }

        // 3. Fallback Embed cho WebView
        if (!url && typeof slug === "string" && slug.indexOf("http") === 0) {
            url = slug;
        }

        var mimeType = "";
        if (url && url.indexOf(".m3u8") !== -1) {
            mimeType = "application/x-mpegURL";
        }

        return JSON.stringify({
            url: url,
            isEmbed: false, 
            mimeType: mimeType, 
            headers: {
                "Referer": "https://www.javboys.tv/", 
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
            },
            subtitles: []
        });
    } catch (e) {
        return JSON.stringify({ url: slug || "", isEmbed: false });
    }
}

function parseEmbedResponse(html, sourceUrl) {
    return JSON.stringify({ url: "", isEmbed: false });
}

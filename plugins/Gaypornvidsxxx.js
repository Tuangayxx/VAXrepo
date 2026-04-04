// =============================================================================
// PLUGIN GAYPORNVIDSXXX - VAAPP (BẢN V2 - BYPASS CLOUDFLARE HOÀN HẢO)
// =============================================================================

function getManifest() {
    return JSON.stringify({
        "id": "gaypornvidsxxx",
        "name": "GayPornVidsXXX",
        "version": "1.0.1",
        "baseUrl": "https://www.gaypornvidsxxx.com",
        "iconUrl": "https://raw.githubusercontent.com/Tuangayxx/VAXrepo/main/plugins/gpvx.png", 
        "isEnabled": true,
        "isAdult": true,
        "type": "MOVIE",
        "playerType": "auto",
        "layoutType": "HORIZONTAL"
    });
}

function getHomeSections() {
    return JSON.stringify([
        { slug: 'home', title: 'Mới Cập Nhật', type: 'Horizontal', path: '' },
        { slug: 'home?tag=Japanese', title: 'Japanese', type: 'Horizontal', path: '' },
        { slug: 'home?tag=Chinese', title: 'Chinese', type: 'Horizontal', path: '' },
        { slug: 'home?tag=Gay Movie', title: 'Gay Movie', type: 'Horizontal', path: '' },
        { slug: 'home?tag=Onlyfans', title: 'Onlyfans', type: 'Horizontal', path: '' }
    ]);
}

function getPrimaryCategories() {
    return JSON.stringify([
        { name: 'Trang Chủ', slug: 'home' },
        { name: 'Japanese', slug: 'home?tag=Japanese' },
        { name: 'Chinese', slug: 'home?tag=Chinese' },
        { name: 'Gay Movie', slug: 'home?tag=Gay Movie' },
        { name: 'Onlyfans', slug: 'home?tag=Onlyfans' }
    ]);
}

function getFilterConfig() { return "{}"; }

function getUrlList(slug, filtersJson) {
    var page = JSON.parse(filtersJson || "{}").page || 1;
    var url = "https://www.gaypornvidsxxx.com/" + slug; 
    
    if (page > 1) { 
        url += (slug.indexOf("?") !== -1) ? "&page=" + page : "?page=" + page;
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
    try {
        var items = [];
        var blocks = html.split('<article class="hentry');
        
        for (var i = 1; i < blocks.length; i++) {
            var block = blocks[i];
            
            var linkMatch = block.match(/href="([^"]+)"/i);
            if (!linkMatch) continue;
            
            var id = linkMatch[1];
            if (id.indexOf('http') === 0) {
                id = id.replace(/https?:\/\/[^\/]+\//i, '');
            } else if (id.indexOf('/') === 0) {
                id = id.substring(1); 
            }

            var imgMatch = block.match(/data-src="([^"]+)"/i) || block.match(/<img[^>]+src="([^"]+)"/i);
            var posterUrl = imgMatch ? imgMatch[1] : "";

            var titleMatch = block.match(/<h1 class="blog-title">[\s\S]*?<a[^>]*>([^<]+)<\/a>/i) || block.match(/alt="([^"]+)"/i);
            var title = titleMatch ? titleMatch[1].trim() : "Không có tiêu đề";

            items.push({
                id: id,
                title: title,
                posterUrl: posterUrl,
                quality: "HD" 
            });
        }

        return JSON.stringify({ items: items, pagination: { currentPage: 1, totalPages: 1 } });
    } catch (e) {
        return JSON.stringify({ items: [], pagination: { currentPage: 1, totalPages: 1 } });
    }
}

function parseSearchResponse(html) {
    return parseListResponse(html);
}

function parseMovieDetail(html) {
    try {
        var titleMatch = html.match(/<title>([^<]+)<\/title>/i);
        var title = titleMatch ? titleMatch[1].replace('–', '-').split('-')[0].trim() : "Unknown Title";

        var imgMatch = html.match(/data-src="([^"]+)"/i) || html.match(/<img[^>]+src="([^"]+)"/i) || html.match(/<meta property="og:image" content="([^"]+)"/i);
        var posterUrl = imgMatch ? imgMatch[1] : "";

        // Lấy đường dẫn hiện tại của trang phim để dùng làm "vỏ bọc"
        var currentUrlMatch = html.match(/<meta property="og:url" content="([^"]+)"/i);
        var currentUrl = currentUrlMatch ? currentUrlMatch[1] : "https://www.gaypornvidsxxx.com/";

        var servers = [];
        var btnRegex = /onclick="changeServer\(this,\s*'([^']+)'\)"[^>]*>([^<]+)<\/button>/g;
        var match;
        var count = 1;
        var hasServers = false;
        
        while ((match = btnRegex.exec(html)) !== null) {
            hasServers = true;
            var linkEmbed = match[1]; 
            var serverName = match[2].trim() || "Server " + count;

            servers.push({
                "name": serverName,
                "episodes": [{
                    // TUYỆT CHIÊU: Gắn Link Embed ẩn sau trang chủ để App fetch thành công!
                    "id": currentUrl + "?server_embed=" + encodeURIComponent(linkEmbed), 
                    "name": "Full",
                    "slug": linkEmbed
                }]
            });
            count++;
        }

        // Dự phòng nếu không có nút chuyển server, lấy iframe mặc định
        if (!hasServers) {
            var iframeMatch = html.match(/<iframe[^>]+id="video-frame"[^>]+src="([^"]+)"/i) || html.match(/<iframe[^>]+src="([^"]+)"/i);
            if (iframeMatch) {
                servers.push({
                    "name": "Server 1",
                    "episodes": [{
                        "id": currentUrl + "?server_embed=" + encodeURIComponent(iframeMatch[1]),
                        "name": "Full",
                        "slug": iframeMatch[1]
                    }]
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
    } catch (e) {
        return JSON.stringify({ id: "", title: "Lỗi Tải Phim", servers: [] });
    }
}

function parseDetailResponse(html, sourceUrl) {
    try {
        var url = "";

        // 1. Lấy link Embed từ tham số vỏ bọc mà ta đã gài ở trên (Bảo toàn mọi Server)
        if (sourceUrl && sourceUrl.indexOf("server_embed=") !== -1) {
            url = decodeURIComponent(sourceUrl.split("server_embed=")[1]);
        } 
        
        // 2. Dự phòng: Nếu sourceUrl bị miss, bóc iframe mặc định từ HTML trang chủ
        if (!url) {
            var iframeMatch = html.match(/<iframe[^>]+id="video-frame"[^>]+src="([^"]+)"/i) || html.match(/<iframe[^>]+src="([^"]+)"/i);
            if (iframeMatch) {
                url = iframeMatch[1];
            }
        }

        return JSON.stringify({
            url: url, // Ném link Embed cho VAAPP
            isEmbed: false, // Ép VAAPP hiểu đây là đích đến, nó sẽ tự động kích hoạt WebView để vượt Cloudflare!
            mimeType: "", 
            headers: {
                "Referer": "https://www.gaypornvidsxxx.com/", 
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
            },
            subtitles: []
        });
    } catch (e) {
        return JSON.stringify({ url: "", isEmbed: false });
    }
}

function parseEmbedResponse(html, sourceUrl) {
    return JSON.stringify({ url: "", isEmbed: false });
}
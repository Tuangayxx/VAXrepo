// =============================================================================
// CONFIGURATION & METADATA
// =============================================================================

const BASE_URL = "https://missav123.com";

function getManifest() {
    return JSON.stringify({
        "id": "missav",
        "name": "MissAV",
        "version": "1.0.5",
        "baseUrl": BASE_URL,
        "iconUrl": "https://stpaulclinic.vn/vaapp/plugins/missav.ico",
        "isEnabled": true,
        "isAdult": true,
        "type": "VIDEO",
        "layoutType": "HORIZONTAL",
        "subtitleCat": true
    });
}

function getHomeSections() {
    return JSON.stringify([
        { slug: 'vi/today-hot', title: 'Hot Hôm Nay', type: 'Horizontal', path: '' },
        { slug: 'vi/weekly-hot', title: 'Hot Trong Tuần', type: 'Horizontal', path: '' },
        { slug: 'vi/monthly-hot', title: 'Hot Trong Tháng', type: 'Horizontal', path: '' },
        { slug: 'vi/uncensored-leak', title: 'Không Che (Rò Rỉ)', type: 'Horizontal', path: '' },
        { slug: 'vi/release', title: 'Mới Cập Nhật', type: 'Grid', path: '' }
    ]);
}

function getPrimaryCategories() {
    return JSON.stringify([
        { name: 'Mới cập nhật', slug: 'vi/new' },
        { name: 'Nữ diễn viên', slug: 'vi/actresses' },
        { name: 'Thể loại', slug: 'vi/genres' },
        { name: 'Không che', slug: 'vi/uncensored-leak' },
        { name: "FC2", slug: "vi/fc2" },
        { name: "HEYZO", slug: "vi/heyzo" },
        { name: "Tokyo Hot", slug: "vi/tokyohot" },
        { name: "1pondo", slug: "vi/1pondo" },
        { name: "Caribbeancom", slug: "vi/caribbeancom" },
        { name: "Caribbeancompr", slug: "vi/caribbeancompr" },
        { name: "10musume", slug: "vi/10musume" },
        { name: "pacopacomama", slug: "vi/pacopacomama" },
        { name: "Gachinco", slug: "vi/gachinco" },
        { name: "XXX-AV", slug: "vi/xxx-av" },
        { name: "MarriedSlash", slug: "vi/marriedslash" },
        { name: "Naughty4610", slug: "vi/naughty4610" },
        { name: "Naughty0930", slug: "vi/naughty0930" }
    ]);
}

function getFilterConfig() {
    return JSON.stringify({
        sort: [
            { name: 'Mới nhất', value: 'new' },
            { name: 'Xem nhiều', value: 'views' },
            { name: 'Hôm nay', value: 'today_views' },
            { name: 'Tuần này', value: 'weekly_views' },
            { name: 'Tháng này', value: 'monthly_views' }
        ],
        category: [
            { name: "Tất cả thể loại", value: "vi/genres" },
            { name: "Mới cập nhật", value: "vi/new" },
            { name: "VR", value: "vi/genres/VR" },
            { name: "Phụ đề Anh", value: "vi/english-subtitle" },
            { name: "Phụ đề China", value: "vi/chinese-subtitle" }
        ]
    });
}

// =============================================================================
// URL GENERATION
// =============================================================================

function getUrlList(slug, filtersJson) {
    var filters = JSON.parse(filtersJson || "{}");
    var page = filters.page || 1;
    var path = slug || "vi/new";

    if (path.indexOf("/") === 0) path = path.substring(1);
    var url = BASE_URL + "/" + path + "?page=" + page;

    if (filters.sort && filters.sort !== 'new' && filters.sort !== 'hot') {
        url += "&sort=" + filters.sort;
    } else if (filters.sort === 'hot') {
        url += "&sort=views";
    }
    return url;
}

function getUrlSearch(keyword, filtersJson) {
    var filters = JSON.parse(filtersJson || "{}");
    var page = filters.page || 1;
    return BASE_URL + "/vi/search/" + encodeURIComponent(keyword) + "?page=" + page;
}

function getUrlDetail(slug) {
    if (!slug) return BASE_URL;
    if (slug.indexOf("http") === 0) return slug;
    
    var path = slug;
    if (path.indexOf("/") !== 0) path = "/" + path;
    
    // Khắc phục lỗi lặp domain: Luôn trả về path bắt đầu bằng / để app tự nối BASE_URL
    // hoặc trả về full URL nếu app yêu cầu. Ở đây tôi dùng full URL chuẩn.
    return BASE_URL + path;
}

function getUrlCategories() { return BASE_URL + "/vi/genres"; }
function getUrlCountries() { return ""; }
function getUrlYears() { return ""; }

// =============================================================================
// PARSERS
// =============================================================================

var PluginUtils = {
    cleanText: function (text) {
        if (!text) return "";
        return text.replace(/<[^>]*>/g, "").replace(/&amp;/g, "&").replace(/&quot;/g, '"')
            .replace(/&#039;/g, "'").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
            .replace(/\s+/g, " ").trim();
    },
    getMeta: function (html, property) {
        var regex = new RegExp('property="' + property + '"\\s+content="([^"]+)"', 'i');
        var match = html.match(regex);
        return match ? match[1] : "";
    }
};

function parseListResponse(html) {
    var movies = [];
    
    // 1. Kiểm tra trang Nữ diễn viên
    var isActressesPage = (html.match(/href="[^"]*\/actresses\/[^"]+"/g) || []).length > 5;
    if (isActressesPage) {
        var liRegex = /<li[\s\S]*?<\/li>/gi;
        var match;
        while ((match = liRegex.exec(html)) !== null) {
            var itemHtml = match[0];
            var urlMatch = itemHtml.match(/href="([^"]*\/actresses\/[^"]+)"/);
            if (!urlMatch) continue;
            var nameMatch = itemHtml.match(/<h4[^>]*>([\s\S]*?)<\/h4>/);
            var imgMatch = itemHtml.match(/<img[^>]+src="([^"]+)"/);
            
            var slug = urlMatch[1].replace(BASE_URL, "").replace("https://missav.ai", "");
            if (slug.indexOf("/") !== 0) slug = "/" + slug;
            
            movies.push({
                id: slug,
                title: PluginUtils.cleanText(nameMatch ? nameMatch[1] : "Actress"),
                posterUrl: imgMatch ? imgMatch[1] : "",
                quality: "ACTRESS"
            });
        }
    }

    // 2. Kiểm tra trang Thể loại
    var isGenresPage = html.indexOf(':đếm video') !== -1;
    if (movies.length === 0 && isGenresPage) {
        var genreRegex = /<a[^>]+href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi;
        var gMatch;
        while ((gMatch = genreRegex.exec(html)) !== null) {
            if (gMatch[1].indexOf('/genres/') !== -1 && gMatch[2].indexOf(':đếm') === -1) {
                var gSlug = gMatch[1].replace(BASE_URL, "").replace("https://missav.ai", "");
                if (gSlug.indexOf("/") !== 0) gSlug = "/" + gSlug;
                movies.push({ id: gSlug, title: PluginUtils.cleanText(gMatch[2]), quality: "CAT" });
            }
        }
    }

    // 3. Trang danh sách phim chuẩn
    if (movies.length === 0) {
        var parts = html.split('thumbnail group');
        for (var i = 1; i < parts.length; i++) {
            var itemHtml = parts[i];
            var linkMatch = itemHtml.match(/href="([^"]+)"/);
            if (!linkMatch) continue;
            
            var slug = linkMatch[1].replace(BASE_URL, "").replace("https://missav.ai", "");
            if (slug.indexOf("/") !== 0) slug = "/" + slug;

            var codeMatch = itemHtml.match(/class="[^"]*text-nord13[^"]*"[^>]*>([\s\S]*?)<\/a>/);
            var imgMatch = itemHtml.match(/data-src="([^"]+)"/) || itemHtml.match(/src="([^"]+)"/);

            if (!slug.includes("actresses") && !slug.includes("genres")) {
                movies.push({
                    id: slug,
                    title: codeMatch ? PluginUtils.cleanText(codeMatch[1]) : "Video",
                    posterUrl: imgMatch ? imgMatch[1] : "",
                    quality: itemHtml.indexOf("Không kiểm duyệt") !== -1 ? "K.K.Duyệt" : "HD",
                    lang: codeMatch ? PluginUtils.cleanText(codeMatch[1]) : ""
                });
            }
        }
    }

    // Phân trang đơn giản
    var currentPage = 1;
    var pageMatch = html.match(/page=(\d+)/);
    if (pageMatch) currentPage = parseInt(pageMatch[1]);

    return JSON.stringify({
        items: movies,
        pagination: { currentPage: currentPage, totalPages: 100 }
    });
}

function parseSearchResponse(html) { return parseListResponse(html); }

function parseMovieDetail(html) {
    try {
        var title = PluginUtils.getMeta(html, "og:title");
        var thumb = PluginUtils.getMeta(html, "og:image");
        var desc = PluginUtils.getMeta(html, "og:description");
        
        // Trích xuất mã số
        var codeMatch = html.match(/<span>(?:Mã số|Code):<\/span>[\s\S]*?>(.*?)<\/div>/i);
        var code = codeMatch ? PluginUtils.cleanText(codeMatch[1]) : "";

        // Trích xuất link Stream
        var uuidMatch = html.match(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i);
        var streamUrl = uuidMatch ? "https://surrit.com/" + uuidMatch[0] + "/playlist.m3u8" : "";

        var servers = [];
        if (streamUrl) {
            servers.push({
                name: "Stream",
                episodes: [{ id: streamUrl, name: "Full", slug: "full" }]
            });
        }

        return JSON.stringify({
            id: code,
            title: PluginUtils.cleanText(title),
            posterUrl: thumb,
            description: PluginUtils.cleanText(desc),
            servers: servers,
            quality: "HD",
            lang: "Vietsub"
        });
    } catch (e) { return "null"; }
}

function parseDetailResponse(html) {
    var movieDetail = JSON.parse(parseMovieDetail(html));
    if (!movieDetail) return JSON.stringify({ url: "" });
    
    var streamUrl = (movieDetail.servers && movieDetail.servers.length > 0) ? movieDetail.servers[0].episodes[0].id : "";
    
    var subtitles = [];
    if (movieDetail.id) {
        subtitles.push({
            url: "subtitlecat://" + movieDetail.id + "?domain=https://www.subtitlecat.com",
            lang: "Vietnamese (SubtitleCat)"
        });
    }

    return JSON.stringify({
        url: streamUrl,
        headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
            "Referer": BASE_URL + "/"
        },
        subtitles: subtitles
    });
}

function parseCategoriesResponse(html) { return "[]"; }
function parseCountriesResponse(html) { return "[]"; }
function parseYearsResponse(html) { return "[]"; }

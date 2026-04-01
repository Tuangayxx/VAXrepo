// =============================================================================
// CONFIGURATION & METADATA
// =============================================================================

function getManifest() {
    return JSON.stringify({
        "id": "javhd",
        "name": "JavHD",
        "version": "1.0.0",
        "baseUrl": "https://javhd.today",
        "iconUrl": "https://javhd.today/favicon.ico",
        "isEnabled": true,
        "isAdult": true,
        "type": "VIDEO",
        "playerType": "embed",
        "layoutType": "HORIZONTAL"
    });
}

function getPrimaryCategories() {
    return JSON.stringify([
        { name: 'Mới cập nhật', slug: 'recent' },
        { name: 'Không Che', slug: 'uncensored-jav' },
        { name: 'Khử Che', slug: 'reducing-mosaic' },
        { name: 'Vietsub', slug: 'jav-sub' },
        { name: 'Nghiệp Dư', slug: 'amateur' }
    ]);
}

function getHomeSections() {
    return JSON.stringify([
        { slug: 'recent', title: 'Video Mới Cập Nhật', type: 'Grid', path: '' },
        { slug: 'popular/today', title: 'Xem Nhiều Hôm Nay', type: 'Horizontal', path: '' },
        { slug: 'uncensored-jav', title: 'Jav Uncensored', type: 'Horizontal', path: '' },
        { slug: 'reducing-mosaic', title: 'Reducing Mosaic', type: 'Horizontal', path: '' },
        { slug: 'jav-sub', title: 'Jav Sub', type: 'Horizontal', path: '' }
    ]);
}

function getFilterConfig() {
    return JSON.stringify({
        sort: [
            { name: 'Mới nhất', value: 'recent' },
            { name: 'Xem nhiều hôm nay', value: 'popular/today' },
            { name: 'Xem nhiều trong tuần', value: 'popular/week' },
            { name: 'Xem nhiều trong tháng', value: 'popular/month' },
            { name: 'Xem nhiều tất cả', value: 'popular/year' },
            { name: 'Nhiều lượt thích', value: 'rated/year' }
        ],
        category: [
            { name: "Uncensored Jav", value: "uncensored-jav" },
            { name: "Reducing Mosaic", value: "reducing-mosaic" },
            { name: "Jav Sub", value: "jav-sub" },
            { name: "Chinese Sub", value: "chinese-subtitle" },
            { name: "Creampie", value: "creampie" },
            { name: "Big Tits", value: "big-tits" },
            { name: "Amateur", value: "amateur" },
            { name: "Married Woman", value: "married-woman" },
            { name: "Beautiful Girl", value: "beautiful-girl" },
            { name: "Mature Woman", value: "mature-woman" },
            { name: "Cuckold", value: "cuckold" },
            { name: "Squirting", value: "squirting" },
            { name: "Nasty", value: "nasty" },
            { name: "Hardcore", value: "hardcore" }
        ]
    });
}

// =============================================================================
// URL GENERATION
// =============================================================================

function getUrlList(slug, filtersJson) {
    var filters = JSON.parse(filtersJson || "{}");
    var page = filters.page || 1;
    var sortPath = (filters.sort && filters.sort !== 'recent') ? (filters.sort + '/') : '';
    
    if (filters.category) {
        return "https://javhd.today/" + filters.category + "/" + sortPath + "?page=" + page;
    }

    if (!slug || slug === 'recent') {
        return "https://javhd.today/recent/?page=" + page;
    }

    // Handles absolute slugs
    if (slug.indexOf("http") === 0) {
        return slug + (slug.indexOf("?") === -1 ? "?" : "&") + "page=" + page;
    }

    if (slug.indexOf("/") === 0) {
        return "https://javhd.today" + slug + (slug.indexOf("?") === -1 ? "?" : "&") + "page=" + page;
    }

    // Combine slug and sort
    if(slug.indexOf('/') !== -1) {
        // e.g., 'popular/today'
        return "https://javhd.today/" + slug + "/?page=" + page;
    }

    return "https://javhd.today/" + slug + "/" + sortPath + "?page=" + page;
}

function getUrlSearch(keyword, filtersJson) {
    var filters = JSON.parse(filtersJson || "{}");
    var page = filters.page || 1;
    return "https://javhd.today/search/video/?s=" + encodeURIComponent(keyword) + "&page=" + page;
}

function getUrlDetail(slug) {
    if (slug.indexOf("http") === 0) return slug;
    if (slug.indexOf("/") === 0) return "https://javhd.today" + slug;
    return "https://javhd.today/" + slug;
}

function getUrlCategories() { return "https://javhd.today/categories/"; }
function getUrlCountries() { return "https://javhd.today/"; }
function getUrlYears() { return "https://javhd.today/"; }

// =============================================================================
// PARSERS
// =============================================================================

var PluginUtils = {
    cleanText: function (text) {
        if (!text) return "";
        return text.replace(/<[^>]*>/g, "")
            .replace(/&amp;/g, "&")
            .replace(/&quot;/g, '"')
            .replace(/&#039;/g, "'")
            .replace(/\s+/g, " ")
            .trim();
    }
};

function parseListResponse(html) {
    var moviesMap = {};
    var parts = html.split(/<li[^>]*id=["']video-[^"']*["'][^>]*>/);

    for (var i = 1; i < parts.length; i++) {
        var itemHtml = parts[i];

        var titleMatch = itemHtml.match(/<a[^>]*class=["']thumbnail["'][^>]*title=["']([^"']*)["']/);
        var title = titleMatch ? titleMatch[1].trim() : "";

        var linkMatch = itemHtml.match(/<a[^>]*class=["']thumbnail["'][^>]*href=["']([^"']+)["']/);
        var fullUrl = linkMatch ? linkMatch[1] : "";

        var slug = fullUrl;
        if(slug && slug.indexOf('/') === 0) slug = slug.substring(1);

        var thumbMatch = itemHtml.match(/<img[^>]*src=["']([^"']+)["']/);
        var thumb = thumbMatch ? thumbMatch[1] : "";
        if(thumbMatch) {
            var lazyMatch = itemHtml.match(/<img[^>]*data-src=["']([^"']+)["']/);
            if(lazyMatch) thumb = lazyMatch[1];
        }

        if (slug) {
            var rawTitle = PluginUtils.cleanText(title);

            // Extract labels
            var durationMatch = itemHtml.match(/<span[^>]*class=["']video-overlay badge transparent["'][^>]*>([\s\S]*?)<\/span>/);
            var duration = durationMatch ? PluginUtils.cleanText(durationMatch[1]) : "";
            
            var codeMatch = itemHtml.match(/<span[^>]*class=["']video-overlay1 badge transparent["'][^>]*>([\s\S]*?)<\/span>/);
            var code = codeMatch ? PluginUtils.cleanText(codeMatch[1]) : "";

            var labels = [];
            if(duration) labels.push(duration);
            if(code) labels.push(code);

            var labelText = labels.join(" | ") || "HD";

            if (!moviesMap[slug]) {
                moviesMap[slug] = {
                    id: slug,
                    title: rawTitle || "Phim không tiêu đề",
                    posterUrl: thumb,
                    backdropUrl: thumb,
                    year: 0,
                    quality: "HD",
                    episode_current: labelText,
                    lang: "Vietsub"
                };
            }
        }
    }

    var movies = [];
    for (var key in moviesMap) {
        if (moviesMap.hasOwnProperty(key)) {
            movies.push(moviesMap[key]);
        }
    }

    var totalPages = 1;
    var pagesMatch = html.match(/page=(\d+)/g);

    if (pagesMatch) {
        for (var j = 0; j < pagesMatch.length; j++) {
            var pMatch = pagesMatch[j].match(/page=(\d+)/);
            if (pMatch) {
                var p = parseInt(pMatch[1]);
                if (p > totalPages) totalPages = p;
            }
        }
    }

    return JSON.stringify({
        items: movies,
        pagination: {
            currentPage: 1,
            totalPages: totalPages || 1,
            totalItems: movies.length,
            itemsPerPage: 20
        }
    });
}

function parseSearchResponse(html) {
    return parseListResponse(html);
}

function parseMovieDetail(html) {
    try {
        var titleMatch = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/);
        var title = titleMatch ? titleMatch[1].trim() : "";

        var descMatch = html.match(/<p[^>]*class=["']description["'][^>]*>([\s\S]*?)<\/p>/);
        var description = descMatch ? PluginUtils.cleanText(descMatch[1]) : "";

        var servers = [];
        var serverMap = {};

        // Extract native Servers from .button_choice_server
        var btnRegex = /class=["'][^"']*button_choice_server[^"']*["'][^>]*data-embed=["']([^"']+)["'][^>]*data-name=["']([^"']+)["']/g;
        var btnMatch;
        while ((btnMatch = btnRegex.exec(html)) !== null) {
            var rawEmbed = btnMatch[1];
            var sname = btnMatch[2].replace(/VIP|PRO|HOST|LIVE/g, '').trim();
            if(rawEmbed) {
                try {
                    // Try to decode Base64
                    // Note: Base64 decode ATob equivalent in simple JS function if atob is not global:
                    var url = typeof atob !== 'undefined' ? atob(rawEmbed) : rawEmbed;
                    
                    if (!serverMap[url]) {
                        serverMap[url] = true;
                        servers.push({
                            name: sname || "Server " + (servers.length + 1),
                            episodes: [{
                                id: url,
                                name: "Full",
                                slug: "full"
                            }]
                        });
                    }
                } catch(e) {}
            }
        }

        var fallbackEmbedMatch = html.match(/id=["']embed-code["'][^>]*>[\s\S]*?src=["']([^"']+)["']/);
        if(servers.length === 0 && fallbackEmbedMatch) {
            servers.push({
                name: "Embed",
                episodes: [{
                    id: fallbackEmbedMatch[1],
                    name: "Full",
                    slug: "full"
                }]
            });
        }

        var thumbMatch = html.match(/<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']+)["']/);
        var thumb = thumbMatch ? thumbMatch[1] : "";

        // Status / Code
        var codeMatch = html.match(/Label:\s*<a[^>]*>([\s\S]*?)<\/a>/i);
        var code = codeMatch ? PluginUtils.cleanText(codeMatch[1]) : "Full";

        var categoryRegex = /<a[^>]*href=["']\/([^"']+)["'][^>]*><i[^>]*class=["']fa fa-th-list["'][^>]*><\/i>([^<]+)<\/a>/g;
        var categoriesArr = [];
        var catMatch;
        while((catMatch = categoryRegex.exec(html)) !== null) {
            categoriesArr.push(PluginUtils.cleanText(catMatch[2]));
        }

        return JSON.stringify({
            id: "", 
            title: PluginUtils.cleanText(title),
            posterUrl: thumb,
            backdropUrl: thumb,
            description: description,
            servers: servers,
            quality: "HD",
            lang: "Vietsub",
            year: 0,
            rating: 0,
            casts: "",
            director: "",
            country: "",
            category: categoriesArr.join(", "),
            status: code
        });
    } catch (e) {
        return "null";
    }
}

function parseDetailResponse(html, fallbackUrl) {
    try {
        // If the URL from episode id was already the decoded iframe URL (like doodstream),
        // we can just return it as embedUrl.
        return JSON.stringify({
            url: fallbackUrl || "",
            headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
                "Referer": "https://javhd.today/"
            },
            subtitles: [],
            isEmbed: true,
            embedRegex: "['\"](https?:\\/\\/[^\\s'\"]+\\.m3u8[^'\"]*)['\"]"
        });
    } catch (e) {
        return JSON.stringify({ url: fallbackUrl || "", headers: {}, subtitles: [] });
    }
}

function parseEmbedResponse(html, fallbackUrl) {
    // If the streaming link is doodstream or streamwish, the app core might handle it
    // Or if `parseDetailResponse` marked `isEmbed = true`, App's engine intercepts it.
    // If we need to extract raw mp4/m3u8 from the iframe body, add logic here.
    return JSON.stringify({
        url: fallbackUrl || "",
        headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            "Referer": "https://javhd.today/"
        },
        subtitles: [],
        isEmbed: false 
    });
}

function parseCategoriesResponse(html) {
    return "[]";
}
function parseCountriesResponse(html) { return "[]"; }
function parseYearsResponse(html) { return "[]"; }

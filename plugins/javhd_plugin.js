const javhd_plugin = {
    getManifest: function () {
        return {
            id: 'javhd',
            name: 'JavHD',
            version: '1.0.0',
            description: 'Plugin xem phim từ javhd.today',
            author: 'Developer',
            webUrl: 'https://javhd.today',
            logo: 'https://javhd.today/favicon.ico',
            type: 'video', // 'video' hoặc 'manga'
            primaryCategory: null,
            hasSearch: true,
            hasFilter: true,
            hasEpisodes: false, // Site crawl này server nằm ngay trang detail or nhúng
        };
    },

    getPrimaryCategories: function () {
        return [
            { id: 'best-jav', title: 'Best Jav', url: '/recent/' },
            { id: 'uncensored-jav', title: 'Jav Uncensored', url: '/uncensored-jav/' },
            { id: 'reducing-mosaic', title: 'Reducing Mosaic', url: '/reducing-mosaic/' },
            { id: 'jav-sub', title: 'Jav Sub', url: '/jav-sub/' },
            { id: 'amateur', title: 'Amateur', url: '/amateur/' }
        ];
    },

    getHomeSections: function () {
        return [
            { id: 'recent', title: 'Video Mới Cập Nhật', url: '/recent/', type: 'grid' },
            { id: 'popular', title: 'Xem Nhiều Hôm Nay', url: '/popular/today/', type: 'grid' },
            { id: 'uncensored', title: 'Jav Uncensored', url: '/uncensored-jav/', type: 'grid' },
            { id: 'mosaic', title: 'Reducing Mosaic', url: '/reducing-mosaic/', type: 'grid' },
            { id: 'sub', title: 'Jav Sub', url: '/jav-sub/', type: 'grid' },
        ];
    },

    getFilterConfig: function () {
        return {
            sort: [
                { id: 'recent', title: 'Latest Updates', type: '' },
                { id: 'popular/today', title: 'Most Viewed Today', type: '' },
                { id: 'popular/week', title: 'Most Viewed Week', type: '' },
                { id: 'popular/month', title: 'Most Viewed Month', type: '' },
                { id: 'popular/year', title: 'Most Viewed All', type: '' },
                { id: 'rated/year', title: 'Most Like', type: '' },
            ],
            categories: [
                { id: 'uncensored-jav', title: 'Uncensored Jav' },
                { id: 'reducing-mosaic', title: 'Reducing Mosaic' },
                { id: 'jav-sub', title: 'Jav Sub' },
                { id: 'chinese-subtitle', title: 'Chinese Sub' },
                { id: 'creampie', title: 'Creampie' },
                { id: 'big-tits', title: 'Big tits' },
                { id: 'amateur', title: 'Amateur' },
                { id: 'married-woman', title: 'Married Woman' },
                { id: 'beautiful-girl', title: 'Beautiful Girl' },
                { id: 'mature-woman', title: 'Mature Woman' },
                { id: 'cuckold', title: 'Cuckold' },
                { id: 'squirting', title: 'Squirting' },
                { id: 'nasty', title: 'Nasty' },
                { id: 'hardcore', title: 'Hardcore' }
            ]
        };
    },

    getUrlList: function (categoryId, page, sort = '', filter = {}) {
        let basePath = 'https://javhd.today';

        // Handle filter/categories mapping
        let currentCatId = categoryId;
        if (filter.categories && filter.categories !== 'all') {
            currentCatId = filter.categories;
        }

        basePath += '/' + currentCatId + '/';

        let sortPath = '';
        if (sort && sort !== 'recent') {
            sortPath = sort + '/';
            // JavHD paths look like: /uncensored-jav/popular/year/
            // Or /popular/today/ (for 'recent/best-jav')
            if (categoryId === 'best-jav' || categoryId === 'recent') {
                basePath = 'https://javhd.today/';
                sortPath = sort + '/';
            }
        }

        return `${basePath}${sortPath}?page=${page}`;
    },

    getUrlSearch: function (query, page) {
        return `https://javhd.today/search/video/?s=${encodeURIComponent(query)}&page=${page}`;
    },

    getUrlDetail: function (slug) {
        if (slug.startsWith('http')) return slug;
        return `https://javhd.today/${slug}`;
    },

    parseListResponse: function (html, url) {
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        const items = [];

        const videoElements = doc.querySelectorAll('li[id^="video-"] .video');

        videoElements.forEach(el => {
            const anchor = el.querySelector('a.thumbnail');
            if (!anchor) return;

            const href = anchor.getAttribute('href');
            let slug = href;
            if (slug.startsWith('/')) {
                slug = slug.substring(1);
            }

            const title = anchor.getAttribute('title') || '';
            const imgEl = el.querySelector('img');
            const thumbnail = imgEl ? (imgEl.getAttribute('data-src') || imgEl.getAttribute('src')) : '';

            // Extract overlays (time, quality, code)
            let quality = '';
            let duration = '';
            let code = '';
            let viewCount = '';

            // Example: <span class="video-overlay badge transparent"> HD 02:05:00 </span>
            const overlayBadge = el.querySelector('.video-overlay.badge.transparent');
            if (overlayBadge) {
                const text = overlayBadge.textContent.trim().replace(/\s+/g, ' ');
                const parts = text.split(' ');
                if (parts.length >= 2) {
                    quality = parts[0];
                    duration = parts[1];
                } else if (parts.length == 1) {
                    duration = parts[0];
                }
            }

            // Example: <span class="video-overlay1 badge transparent"> JURA-87-mosaic </span>
            const codeBadge = el.querySelector('.video-overlay1');
            if (codeBadge) {
                code = codeBadge.textContent.trim();
            }

            // Example: <span class="left"><i class="fa fa-eye"></i> 2019 ...</span>
            const viewCountEl = el.querySelector('.badgetime .left');
            if (viewCountEl) {
                viewCount = viewCountEl.textContent.trim();
            }

            items.push({
                slug: slug,
                id: slug, // use slug as ID
                title: title,
                thumbnail: thumbnail,
                subtitle: duration ? `${quality} ${duration}` : '',
                chapterCount: viewCount,
                type: 'video',
                badges: [code].filter(Boolean)
            });
        });

        // Parse pagination
        let hasNextPage = false;
        const pagination = doc.querySelector('.pagination');
        if (pagination) {
            const nextLink = pagination.querySelector('li:not(.disabled) a[href*="page="]');
            // A more robust way: check if there's a link with text `»` or `Next` that isn't parent disabled
            const activePageNode = pagination.querySelector('li.active');
            if (activePageNode && activePageNode.nextElementSibling && !activePageNode.nextElementSibling.classList.contains('disabled')) {
                hasNextPage = true;
            }
        } else {
            // JavHD uses pagination component
            // If the grid has exactly 24 or more items, we might have next page. Just a fallback.
            if (items.length >= 20) hasNextPage = true;
        }

        return { items, hasNextPage };
    },

    parseSearchResponse: function (html, url) {
        return this.parseListResponse(html, url);
    },

    parseMovieDetail: function (html, url) {
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        const details = {
            title: '',
            thumbnail: '',
            description: '',
            episodes: [],
            actors: [],
            categories: [],
            director: '',
            views: '',
            tags: [],
            servers: []
        };

        const titleEl = doc.querySelector('h1');
        if (titleEl) details.title = titleEl.textContent.trim();

        // Find cover image
        const imgEl = doc.querySelector('img[src*="javhd.today"][alt*="' + details.title.substring(0, 10).replace(/["']/g, "") + '"]');
        if (imgEl) {
            details.thumbnail = imgEl.getAttribute('src');
        } else {
            const genericImg = doc.querySelector('.content-container img[src*="/videos/tmb/"]');
            if (genericImg) details.thumbnail = genericImg.getAttribute('src');
        }

        // Parse information blocks
        const infoDivs = doc.querySelectorAll('.content-container .col-md-8');
        infoDivs.forEach(div => {
            const textContent = div.textContent.trim();
            if (textContent.includes('Genre:')) {
                const anchors = div.querySelectorAll('a');
                anchors.forEach(a => details.categories.push(a.textContent.trim()));
            }
            else if (textContent.includes('Release Day:')) {
                const t = textContent.replace('Release Day:', '').trim();
                details.releaseDate = t;
            }
            else if (textContent.includes('Studio:')) {
                const a = div.querySelector('a.tagnote');
                if (a) details.studio = a.textContent.trim();
            }
            else if (textContent.includes('Director:')) {
                const a = div.querySelector('a');
                if (a && a.textContent.trim() !== '----') details.director = a.textContent.trim();
            }
            else if (textContent.includes('Label:')) {
                const a = div.querySelector('a');
                if (a) details.label = a.textContent.trim();
            }
            else if (textContent.includes('Tags:')) {
                const anchors = div.querySelectorAll('a');
                anchors.forEach(a => details.tags.push({ name: a.textContent.trim(), slug: a.getAttribute('href') }));
            }
        });

        const descEl = doc.querySelector('.description');
        if (descEl) details.description = descEl.textContent.trim();

        const viewsEl = doc.querySelector('#view');
        if (viewsEl) details.views = viewsEl.textContent.trim();

        // Actors are often in categories/tags or in description. The site doesn't seem to have a dedicated "Actors/Pornstars" block in detail HTML explicitly labeled other than inside tags or title.
        // We leave actors empty or extract if clearly marked.

        // Extract native Servers embedded in the HTML
        const serverButtons = doc.querySelectorAll('.button_choice_server');
        if (serverButtons && serverButtons.length > 0) {
            serverButtons.forEach(btn => {
                let encodedSrc = btn.getAttribute('data-embed');
                let name = btn.getAttribute('data-name') || btn.textContent.trim();
                name = name.replace(/VIP|PRO|HOST|LIVE/g, '').trim();
                if (encodedSrc) {
                    try {
                        let decoded = atob(encodedSrc);
                        // Decode again if it's double encoded or just URL
                        details.servers.push({
                            serverName: name || 'Doodstream / HLS',
                            url: decoded
                        });
                    } catch (e) { }
                }
            });
        }

        // Often JavHD embeds iframe links directly inside #embed-code
        const embedCode = doc.querySelector('#embed-code');
        if (embedCode) {
            const iframeSrcMatch = embedCode.textContent.match(/src="([^"]+)"/);
            if (iframeSrcMatch && iframeSrcMatch[1]) {
                details.embedUrl = iframeSrcMatch[1];
                // We could potentially fetch this embed URL to find more servers if `serverButtons` is empty.
            }
        }

        // Create one single episode since it's a movie
        details.episodes.push({
            title: "Full Video",
            link: url,
            servers: details.servers
        });

        return details;
    },

    parseEmbedResponse: async function (html, url, scriptingPort) {
        // If there are multiple servers parsed we can use them directly on frontend (depending on app logic).
        // If the platform expects us to extract HLS streaming from the iframe, we might need more logic here
        // But many servers like mycloudz, doodstream needs specific extraction or are rendered as iframes.

        let servers = [];
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');

        const serverButtons = doc.querySelectorAll('.button_choice_server');
        if (serverButtons && serverButtons.length > 0) {
            serverButtons.forEach(btn => {
                let encodedSrc = btn.getAttribute('data-embed');
                let name = btn.getAttribute('data-name') || btn.textContent.trim();
                name = name.replace(/VIP|PRO|HOST|LIVE/g, '').trim();

                if (encodedSrc) {
                    try {
                        let decoded = atob(encodedSrc);
                        servers.push({
                            serverName: name || 'JavHD Server',
                            url: decoded,
                            type: 'iframe' // Usually these are direct iframes for third-party hosts
                        });
                    } catch (e) { }
                }
            });
        }

        return { servers };
    },

    parseCategoriesResponse: function (html, url) {
        // Not widely used in generic scraper, return empty or implement if needed
        return [];
    }
};

if (typeof module !== 'undefined' && module.exports) {
    module.exports = javhd_plugin;
} else if (typeof window !== 'undefined') {
    window.javhd_plugin = javhd_plugin;
}

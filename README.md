# Lưu ý: Đây là nguồn plugins để học tập và tham khảo của tôi
# Vui lòng không tạo các tiện ích mở rộng bất hợp pháp hoặc sử dụng bất kỳ tiện ích mở rộng nào chứa nội dung có bản quyền.

# Hướng Dẫn Tự Build Nguồn 🚀

VAX sử dụng một hệ thống Plugin linh hoạt bằng **JavaScript nguyên thuỷ (Vanilla JS)** cho phép bạn cào dữ liệu (scraping) bất kỳ một trang xem phim hay đọc truyện nào trên mạng đưa vào ứng dụng sử dụng.

Khi xây dựng xong một file `.js`, bạn chỉ việc lưu trữ nó ở bất cứ đâu (thường là GitHub Raw, Pastebin, Cloud...) và khai báo lại vào file `plugins.json`.

---

## 1. Cấu Trúc File Cấp Phát (plugins.json)

Là danh sách (Menu) các Plugin để người dùng nhìn thấy trong phần Cài Đặt của Ứng dụng. Bạn thêm một object vào array `plugins`:

```json
{
    "version": 1,
    "plugins": [
        {
            "id": "myplugin1",
            "name": "Nguồn Phim ABCD",
            "version": "1.0.0",
            "scriptUrl": "https://raw.githubusercontent.com/.../my_plugin.js",
            "iconUrl": "https://raw.githubusercontent.com/.../icon.png"
        }
    ]
}
```

*   `id`: Chuỗi định danh duy nhất (không dấu, không khoảng trắng). VD: `ophim`. Đầu vào của App để lưu trữ history.
*   `name`: Tên Nguồn hiển thị trong hệ thống.
*   `version`: Chuỗi phiên bản, thay đổi tự động update.
*   `scriptUrl`: URL trực tiếp đến đoạn mã logic `.js`.
*   `iconUrl`: URL icon ảnh (hình vuông, trong suốt).

---

## 2. Cách Viết Một File Plugin (File `.js`) ⚛️

Mã JS không sử dụng các thư viện như jQuery. Tất cả là Vanilla JS. Nhiệm vụ chính của một script là nhận một yêu cầu từ Ứng dụng (Android) và trả về một chuỗi `JSON`. Hệ sinh thái Script có 3 nhóm hàm chính:

### A. Nhóm Config & Metadata (Bắt buộc)
Cấu hình giao diện và cấu trúc ban đầu:
- `getManifest()`: Khai báo tổng quát Plugin (Tên, ID, BASE URL, TYPE=MOVIE/COMIC, Layout=HORIZONTAL/VERTICAL).
- `getHomeSections()`: Cấu hình các mục ngoài màn hình hình Trang chủ của App (Ví dụ: "Hành động", "Tình cảm", "Mới cập nhật"). Phải trả về list Object `{ slug, title, type, path }`.
- `getPrimaryCategories()`: Danh sách các thể loại phân nhóm thanh menu.
- `getFilterConfig()`: Bộ lọc (Năm, Sort, Quốc gia, ...).

### B. Nhóm Sinh Mẫu Đường Dẫn URL (Bắt buộc)
Hệ thống cho Android biết phải gửi **Request HTTP GET/POST** vào đường dẫn nào.
- `getUrlList(slug, filtersJson)`: Nối slug, param filters, pages thành API hoặc trang HTML danh sách.  
- `getUrlSearch(keyword, filtersJson)`: Sinh link tìm kiếm từ khoá nhập trên thanh Search.
- `getUrlDetail(slug)`: Trả ra URL lấy thông tin cho Trang Chi Tiết phim.
- `getUrlCategories()`, `getUrlCountries()`, `getUrlYears()`: Option bổ trợ cấu hình API lấy filter.

### C. Nhóm Phân Tích Dữ Liệu - PARSERS (Quan trọng nhất)
Khi điện thoại tải thành công URL từ bước `B`, nó sẽ ném khối văn bản HTTP Response (chuỗi JSON thô hoặc HTML website) cho các hàm Parser này xử lý. **Nhiệm vụ của hàm là tách đúng các trường dữ liệu và trả ra một mảng JSON tiêu chuẩn.**

*   `parseListResponse(apiResponseJson)`: Đầu ra bắt buộc là JSON mảng `items` gồm `{ id, title, posterUrl, backdropUrl, year }`. Thường dùng JSON.parse() để bóc tách hoặc API RegExp với web HTML.
*   `parseSearchResponse(apiResponseJson)`: Tương tự list response.
*   `parseMovieDetail(apiResponseJson)`: Bóc thông tin Chi tiết (Tác giả, Đạo diễn, Thể loại) và mảng **Epsiodes** (Danh sách các Mùa, Các Tập phim, Link xem chứa Server).
*   `parseDetailResponse(apiResponseJson)`: Nhận chi tiết link ở trên (hỗ trợ .m3u8, embed link) và trả về Object kèm theo `headers` (User-Agent, Referer) để App vượt rào bảo vệ (nếu có). 

> **Mẹo bóc tách (Parsing):**
> 1. Nếu trang nguồn có API (như OPhim): Cảm tạ thần linh, bạn chỉ việc dùng hàm `JSON.parse(apiResponseJson)` để lấy dữ liệu.
> 2. Nếu trang trả về Web tĩnh: Dùng Biểu thức chính quy `RegExp.exec()` hoặc tách chuỗi cơ bản với `.split()` hoặc tìm String Index để móc nối URL ảnh và tiêu đề bài đăng.

### Đoạn code minh hoạ đơn giản:
```javascript
function getManifest() {
    return JSON.stringify({
        "id": "myplugin",
        "name": "Demo Phim",
        "version": "1.0",
        "type": "MOVIE"
    });
}
function getUrlList(slug, filtersJson) {
    var filters = JSON.parse(filtersJson || "{}");
    return "https://api.domain.com/movies?page=" + (filters.page || 1);
}
function parseListResponse(html) {
    try {
        var data = JSON.parse(html);
        var movies = data.items.map(function(item) {
            return {
                id: item.url_slug,
                title: item.title,
                posterUrl: item.img_src
            };
        });
        return JSON.stringify({ items: movies });
    } catch(e) { return JSON.stringify({ items: [] }); }
}
```

Chúc bạn thành công!

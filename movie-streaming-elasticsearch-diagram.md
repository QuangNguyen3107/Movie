# Sơ Đồ Tổng Quan - Hệ Thống Xem Phim & Tìm Kiếm Thông Minh với Elasticsearch

## 🎬 Kiến Trúc Tổng Quan

```mermaid
graph TB
    %% User Interface Layer
    subgraph "Frontend - Next.js"
        UI[User Interface]
        SEARCH[Search Page]
        MOVIE[Movie Detail Page]
        NAVBAR[Navigation Bar]
    end

    %% Backend Services
    subgraph "Backend - Node.js/Express"
        API[API Gateway]
        SEARCH_CTRL[Search Controller]
        MOVIE_CTRL[Movie Controller]
        ADMIN_CTRL[Admin Search Controller]
    end

    %% Search Services
    subgraph "Search Services"
        ES_SERVICE[Elasticsearch Service]
        MONGO_FALLBACK[MongoDB Fallback]
    end

    %% Data Storage
    subgraph "Data Layer"
        ES[Elasticsearch<br/>Search Index]
        MONGO[(MongoDB<br/>Main Database)]
        EXTERNAL[External Movie APIs<br/>ophim1.com]
    end

    %% User Interactions
    UI --> SEARCH
    UI --> MOVIE
    NAVBAR --> SEARCH

    %% API Calls
    SEARCH --> API
    MOVIE --> API
    
    %% Backend Processing
    API --> SEARCH_CTRL
    API --> MOVIE_CTRL
    API --> ADMIN_CTRL

    %% Search Logic
    SEARCH_CTRL --> ES_SERVICE
    ES_SERVICE --> ES
    ES_SERVICE -.->|Fallback| MONGO_FALLBACK
    MONGO_FALLBACK --> MONGO

    %% Data Flow
    MOVIE_CTRL --> MONGO
    MOVIE_CTRL --> EXTERNAL
    ADMIN_CTRL --> ES_SERVICE

    style ES fill:#f9f,stroke:#333,stroke-width:3px
    style ES_SERVICE fill:#bbf,stroke:#333,stroke-width:2px
    style SEARCH_CTRL fill:#bfb,stroke:#333,stroke-width:2px
```

## 🔍 Luồng Tìm Kiếm Thông Minh

```mermaid
sequenceDiagram
    participant User as Người Dùng
    participant UI as Frontend UI
    participant API as API Gateway
    participant SearchCtrl as Search Controller
    participant ESService as Elasticsearch Service
    participant ES as Elasticsearch
    participant MongoDB as MongoDB Fallback
    participant External as External APIs

    User->>UI: Nhập từ khóa tìm kiếm
    UI->>API: GET /api/search?q=keyword
    API->>SearchCtrl: handleSearch()
    
    SearchCtrl->>SearchCtrl: Phân tích query (field prefix)
    
    SearchCtrl->>ESService: searchMovies()
    
    alt Elasticsearch Available
        ESService->>ES: Execute search query
        ES-->>ESService: Search results
        ESService-->>SearchCtrl: Formatted results
    else Elasticsearch Unavailable
        ESService->>MongoDB: Fallback search
        MongoDB-->>ESService: MongoDB results
        ESService-->>SearchCtrl: Formatted results
    end
    
    SearchCtrl-->>API: JSON response
    API-->>UI: Search results
    UI-->>User: Hiển thị kết quả
    
    Note over User,External: Người dùng chọn phim để xem
    User->>UI: Click vào phim
    UI->>API: GET /movie/[slug]
    API->>External: Fetch movie details
    External-->>API: Movie data + episodes
    API-->>UI: Movie details
    UI-->>User: Trang xem phim
```

## 🎯 Các Tính Năng Tìm Kiếm Thông Minh

### 1. **Multi-Field Search**
```javascript
// Hỗ trợ tìm kiếm theo nhiều trường
const supportedFields = [
    'name',         // Tên phim
    'origin_name',  // Tên gốc
    'actor',        // Diễn viên
    'director',     // Đạo diễn
    'content',      // Nội dung
    'category',     // Thể loại
    'country',      // Quốc gia
    'year',         // Năm
    'lang',         // Ngôn ngữ
    'status',       // Trạng thái
    'type',         // Loại phim
    'slug'          // Slug
];
```

### 2. **Smart Query Parsing**
```
name:Avengers          // Tìm trong trường name
actor:Tom Cruise       // Tìm theo diễn viên
category:Action        // Tìm theo thể loại
year:2023             // Tìm theo năm
```

### 3. **Advanced Filtering**
- Thể loại (Category)
- Quốc gia (Country)
- Năm sản xuất (Year)
- Loại phim (Series/Single)
- Trạng thái (Active/Inactive)

## 🎮 Luồng Xem Phim

```mermaid
flowchart TD
    START[Người dùng truy cập trang phim] --> FETCH[Fetch movie details from API]
    FETCH --> CHECK{Phim có tồn tại?}
    
    CHECK -->|Có| DISPLAY[Hiển thị thông tin phim]
    CHECK -->|Không| ERROR[Hiển thị lỗi 404]
    
    DISPLAY --> EPISODES{Có episodes?}
    EPISODES -->|Có| SHOW_PLAYER[Hiển thị video player]
    EPISODES -->|Không| SHOW_TRAILER[Hiển thị trailer]
    
    SHOW_PLAYER --> USER_ACTIONS[User Actions]
    USER_ACTIONS --> FAVORITE[Thêm yêu thích]
    USER_ACTIONS --> WATCHLATER[Xem sau]
    USER_ACTIONS --> RATING[Đánh giá]
    USER_ACTIONS --> COMMENT[Bình luận]
    USER_ACTIONS --> SHARE[Chia sẻ]
    USER_ACTIONS --> REPORT[Báo cáo]
    
    DISPLAY --> RELATED[Hiển thị phim liên quan]
    RELATED --> ES_RELATED[Tìm phim cùng thể loại qua ES]
    
    style SHOW_PLAYER fill:#f96,stroke:#333,stroke-width:2px
    style ES_RELATED fill:#f9f,stroke:#333,stroke-width:2px
```

## 🏗️ Cấu Trúc Database & Index

### MongoDB Schema
```javascript
// Movie Schema
{
  _id: ObjectId,
  name: String,           // Tên phim
  origin_name: String,    // Tên gốc
  slug: String,           // URL slug
  content: String,        // Mô tả nội dung
  type: String,           // "series" hoặc "single"
  status: String,         // Trạng thái phim
  poster_url: String,     // URL poster
  thumb_url: String,      // URL thumbnail
  trailer_url: String,    // URL trailer
  time: String,           // Thời lượng
  episode_current: String,// Tập hiện tại
  episode_total: String,  // Tổng số tập
  quality: String,        // Chất lượng
  lang: String,           // Ngôn ngữ
  year: Number,           // Năm sản xuất
  actor: [String],        // Diễn viên
  director: [String],     // Đạo diễn
  category: [{            // Thể loại
    name: String,
    slug: String
  }],
  country: [{             // Quốc gia
    name: String,
    slug: String
  }],
  episodes: [{            // Danh sách tập phim
    server_name: String,
    server_data: [{
      name: String,
      slug: String,
      filename: String,
      link_embed: String,
      link_m3u8: String
    }]
  }],
  isHidden: Boolean,      // Ẩn/hiện phim
  createdAt: Date,
  updatedAt: Date
}
```

### Elasticsearch Mapping
```javascript
// Elasticsearch Index Mapping
{
  "mappings": {
    "properties": {
      "name": {
        "type": "text",
        "analyzer": "standard",
        "fields": {
          "keyword": {
            "type": "keyword"
          }
        }
      },
      "origin_name": {
        "type": "text",
        "analyzer": "standard"
      },
      "content": {
        "type": "text",
        "analyzer": "standard"
      },
      "actor": {
        "type": "text",
        "analyzer": "standard"
      },
      "director": {
        "type": "text", 
        "analyzer": "standard"
      },
      "category": {
        "type": "nested",
        "properties": {
          "name": {
            "type": "text",
            "analyzer": "standard"
          },
          "slug": {
            "type": "keyword"
          }
        }
      },
      "country": {
        "type": "nested", 
        "properties": {
          "name": {
            "type": "text",
            "analyzer": "standard"
          },
          "slug": {
            "type": "keyword"
          }
        }
      },
      "year": {
        "type": "integer"
      },
      "type": {
        "type": "keyword"
      },
      "status": {
        "type": "keyword" 
      },
      "isHidden": {
        "type": "boolean"
      }
    }
  }
}
```

## 🚀 API Endpoints

### Search APIs
```
GET /api/search?q=keyword&page=1&size=20
GET /api/search?q=name:Avengers&category=Action&year=2023
GET /api/suggestions?q=Av&limit=5
```

### Movie APIs  
```
GET /api/movies/:slug
GET /api/movies?category=action&limit=12
GET /movie/[slug] (Frontend route)
```

### Admin APIs
```
GET /api/admin/search?search=keyword&category=action
GET /api/admin/elasticsearch/status
```

## 🔧 Các Tính Năng Đặc Biệt

### 1. **Fallback Mechanism**
- Tự động chuyển sang MongoDB khi Elasticsearch không khả dụng
- Đảm bảo hệ thống luôn hoạt động ổn định

### 2. **Smart Query Processing**  
- Hỗ trợ tiền tố trường: `name:keyword`, `actor:name`
- Tự động phân tích và tối ưu query

### 3. **Advanced Filtering**
- Lọc theo thể loại, quốc gia, năm
- Hỗ trợ kết hợp nhiều bộ lọc

### 4. **Performance Optimization**
- Caching kết quả tìm kiếm
- Pagination hiệu quả
- Loại bỏ kết quả trùng lặp

### 5. **User Experience**
- Auto-suggestions khi gõ
- Related movies thông minh
- Responsive design cho mobile

## 🎥 Tính Năng Xem Phim

### 1. **Video Player**
- Hỗ trợ nhiều server
- Chọn chất lượng video
- Điều khiển tốc độ phát
- Fullscreen mode

### 2. **Episode Management**
- Danh sách tập phim
- Tự động chuyển tập
- Lưu tiến độ xem

### 3. **User Interactions**
- Thêm vào yêu thích
- Đánh dấu xem sau  
- Đánh giá phim
- Bình luận và thảo luận
- Chia sẻ phim
- Báo cáo lỗi

### 4. **Recommendations**
- Phim cùng thể loại
- Phim được đề xuất
- Phim mới cập nhật

---

## 📊 Luồng Dữ Liệu Chi Tiết

```mermaid
graph LR
    subgraph "Data Sources"
        EXT[External APIs<br/>ophim1.com]
        USER[User Input]
    end

    subgraph "Data Processing"
        CRAWLER[Movie Crawler]
        INDEXER[ES Indexer]
        VALIDATOR[Data Validator]
    end

    subgraph "Storage"
        MONGO[(MongoDB<br/>Primary DB)]
        ES[(Elasticsearch<br/>Search Index)]
    end

    subgraph "Search Processing"
        QUERY[Query Parser]
        SEARCH_ENGINE[Search Engine]
        FILTER[Result Filter]
    end

    subgraph "Frontend"
        SEARCH_UI[Search Interface]
        MOVIE_UI[Movie Player]
        RESULTS[Search Results]
    end

    EXT --> CRAWLER
    CRAWLER --> VALIDATOR
    VALIDATOR --> MONGO
    MONGO --> INDEXER
    INDEXER --> ES

    USER --> SEARCH_UI
    SEARCH_UI --> QUERY
    QUERY --> SEARCH_ENGINE
    SEARCH_ENGINE --> ES
    SEARCH_ENGINE --> MONGO
    SEARCH_ENGINE --> FILTER
    FILTER --> RESULTS
    RESULTS --> MOVIE_UI

    style ES fill:#f9f,stroke:#333,stroke-width:3px
    style SEARCH_ENGINE fill:#bbf,stroke:#333,stroke-width:2px
```

Sơ đồ này mô tả chi tiết kiến trúc và luồng hoạt động của hệ thống xem phim với tìm kiếm thông minh sử dụng Elasticsearch trong dự án của bạn.

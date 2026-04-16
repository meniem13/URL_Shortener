# 🔗 Full-Stack URL Shortener

## ✨ Features

- **Custom Aliases**: Users can choose their own short link name.
- **Auto-Generated Links**: Generates highly collision-resistant short codes using `nanoid`.
- **Link Expiration**: Set optional time-to-live (TTL) for short links (e.g. valid for 24 hours).
- **High Performance**: Integrated with **Redis** to cache database results for lightning-fast redirects.
- **Robust Security**: Rate limiting and strict input validation.

### Environment Setup

```env
PORT=5000
BASE_URL=http://localhost:5000
MONGO_URI=mongodb://127.0.0.1:27017/urlshortener
REDIS_URL=rediss://default:YOUR_PASSWORD@your-endpoint.upstash.io:32400
```

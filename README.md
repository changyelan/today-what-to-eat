This is a Next.js project bootstrapped with create-next-app.

## Getting Started

First, create your local environment file:

```bash
copy .env.local.example .env.local
```

Then fill in your AMap Web Service key in `.env.local`:

```env
AMAP_WEB_SERVICE_KEY=your_key_here
```

Run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Routes

- `/` 首页推荐
- `/restaurants` 附近餐馆列表
- `/add` 手动添加餐馆

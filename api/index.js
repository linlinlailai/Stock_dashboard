// api/index.js

// 判斷是否在本地開發環境，只有在本地才載入 dotenv
if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config();
}

const express = require('express');
const axios = require('axios');
const app = express();

// 允許所有來源的跨域請求，方便本地開發
const cors = require('cors');
app.use(cors());

const API_KEY = process.env.ALPHA_VANTAGE_API_KEY;

// API 路由：現在可以接收動態的股票代碼
app.get('/api/data', async (req, res) => {
    // 從前端的查詢參數中獲取 symbol，如果沒有提供，則預設為 'SPY'
    const symbol = req.query.symbol || 'SPY';

    if (!API_KEY) {
        return res.status(500).json({ error: 'API key is not configured.' });
    }

    try {
        // 1. 根據傳入的 symbol 獲取每日股價數據
        const stockPromise = axios.get(`https://www.alphavantage.co/query`, {
            params: {
                function: 'TIME_SERIES_DAILY',
                symbol: symbol, // 使用從前端傳來的 symbol
                outputsize: 'compact',
                apikey: API_KEY
            }
        } );

        // 2. 根據傳入的 symbol 獲取市場新聞
        const newsPromise = axios.get(`https://www.alphavantage.co/query`, {
            params: {
                function: 'NEWS_SENTIMENT',
                tickers: symbol, // 使用從前端傳來的 symbol
                limit: '5',
                apikey: API_KEY
            }
        } );

        // 平行發送兩個請求，加快速度
        const [stockResponse, newsResponse] = await Promise.all([stockPromise, newsPromise]);

        // 增強的錯誤檢查：檢查股票 API 是否回傳了錯誤或提示
        // Alpha Vantage 找到無效代碼時，回傳的不是 Error Message 而是 Note
        if (stockResponse.data['Note'] || stockResponse.data['Error Message']) {
             return res.status(400).json({ error: `無法獲取 '${symbol}' 的股票數據。請檢查股票代碼是否正確，或您的 API 使用頻率可能已達上限。` });
        }

        // 3. 整理數據並回傳
        const timeSeries = stockResponse.data['Time Series (Daily)'];
        const dates = Object.keys(timeSeries).slice(0, 30).reverse();
        const prices = dates.map(date => timeSeries[date]['4. close']);

        // 如果 newsResponse.data.feed 不存在，給一個空陣列，避免錯誤
        const newsFeed = newsResponse.data.feed || [];
        const highlights = newsFeed.map(item => ({
            title: item.title,
            url: item.url,
            summary: item.summary,
            source: item.source
        }));

        // ***【關鍵修改】*** 將回傳的資料結構化，並附上查詢的 symbol
        res.status(200).json({
            symbol: symbol, // 把當前查詢的 symbol 回傳給前端
            chartData: {
                dates: dates,
                prices: prices
            },
            newsData: { // 將 newsData 包裝成物件
                items: highlights,
                count: highlights.length // 附上新聞數量
            }
        });

    } catch (error) {
        // 捕捉處理過程中的其他未知錯誤
        res.status(500).json({ error: '伺服器在處理請求時發生錯誤。', details: error.message });
    }
});

// 導出 app 供 Vercel 使用
module.exports = app;

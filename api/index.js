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

// API 路由：獲取股票和新聞數據
app.get('/api/data', async (req, res) => {
    if (!API_KEY) {
        return res.status(500).json({ error: 'API key is not configured.' });
    }

    try {
        // 1. 獲取 S&P 500 (SPY) 的每日股價數據
        const stockPromise = axios.get(`https://www.alphavantage.co/query`, {
            params: {
                function: 'TIME_SERIES_DAILY',
                symbol: 'SPY', // SPY 是追蹤 S&P 500 的 ETF ，很具代表性
                outputsize: 'compact', // 最近 100 天的數據
                apikey: API_KEY
            }
        });

        // 2. 獲取市場新聞
        const newsPromise = axios.get(`https://www.alphavantage.co/query`, {
            params: {
                function: 'NEWS_SENTIMENT',
                tickers: 'SPY', // 可以指定相關標的
                limit: '5', // 獲取最新的 5 條新聞
                apikey: API_KEY
            }
        } );

        // 平行發送兩個請求，加快速度
        const [stockResponse, newsResponse] = await Promise.all([stockPromise, newsPromise]);

        // 檢查 API 回應是否成功
        if (stockResponse.data['Error Message'] || newsResponse.data['Error Message']) {
             return res.status(500).json({ error: 'Failed to fetch data from Alpha Vantage API. Check your API key or usage limit.' });
        }

        // 3. 整理數據並回傳
        const timeSeries = stockResponse.data['Time Series (Daily)'];
        const dates = Object.keys(timeSeries).slice(0, 30).reverse(); // 取最近30天並反轉，讓圖表從左到右是時間遞增
        const prices = dates.map(date => timeSeries[date]['4. close']);

        const newsFeed = newsResponse.data.feed || [];
        const highlights = newsFeed.map(item => ({
            title: item.title,
            url: item.url,
            summary: item.summary,
            source: item.source
        }));

        res.status(200).json({
            chartData: {
                dates: dates,
                prices: prices
            },
            newsData: highlights
        });

    } catch (error) {
        res.status(500).json({ error: 'An error occurred while fetching data.', details: error.message });
    }
});

// 導出 app 供 Vercel 使用
module.exports = app;

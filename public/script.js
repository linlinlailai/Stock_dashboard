// public/script.js

document.addEventListener('DOMContentLoaded', () => {
    // --- 【第1步：獲取所有新的 HTML 元素】 ---
    const searchBtn = document.getElementById('search-btn');
    const symbolInput = document.getElementById('symbol-input');
    const currentSymbolSpan = document.getElementById('current-symbol');
    const loadingIndicator = document.getElementById('loading');
    const chartContainer = document.getElementById('chart');
    const newsList = document.getElementById('news-list');

    // 初始化 ECharts
    const myChart = echarts.init(chartContainer);

    // --- 【第2步：升級 fetchData 函式，讓它可以接收股票代碼】 ---
    const fetchData = async (symbol) => {
        // 顯示加載動畫並禁用按鈕
        loadingIndicator.classList.remove('hidden');
        searchBtn.disabled = true;
        symbolInput.disabled = true; // 查詢期間也禁用輸入框
        myChart.clear();
        newsList.innerHTML = '';
        chartContainer.innerHTML = ''; // 清空可能存在的錯誤訊息

        try {
            // 動態地將 symbol 作為查詢參數附加到 API 請求中
            const response = await fetch(`/api/data?symbol=${symbol}`);
            const data = await response.json();

            // 如果後端回傳了錯誤 (例如 400 或 500)，就拋出錯誤並顯示後端提供的 error 訊息
            if (!response.ok) {
                throw new Error(data.error || `請求失敗，狀態碼: ${response.status}`);
            }

            // 更新頁面內容
            currentSymbolSpan.textContent = data.symbol.toUpperCase();
            renderChart(data.chartData, data.symbol); // 將 symbol 傳給圖表函式以更新標題
            renderNews(data.newsData); // 將新的 newsData 物件傳給新聞函式

        } catch (error) {
            console.error("Fetch error:", error);
            // 將後端傳來的更詳細的錯誤訊息顯示在圖表區
            chartContainer.innerHTML = `<p style="color: red; text-align: center; padding-top: 50px;">${error.message}</p>`;
        } finally {
            // 無論成功或失敗，都隱藏加載動畫並重新啟用按鈕和輸入框
            loadingIndicator.classList.add('hidden');
            searchBtn.disabled = false;
            symbolInput.disabled = false;
        }
    };

    // --- 【第3步：升級 renderChart 函式，讓標題可以動態變化】 ---
    const renderChart = (chartData, symbol) => {
        const option = {
            title: {
                text: `${symbol.toUpperCase()} 近30日收盤價`,
                left: 'center',
                textStyle: {
                    color: '#333'
                }
            },
            tooltip: { trigger: 'axis' },
            xAxis: {
                type: 'category',
                data: chartData.dates
            },
            yAxis: {
                type: 'value',
                scale: true
            },
            series: [{
                data: chartData.prices,
                type: 'line',
                smooth: true,
                itemStyle: { color: '#1a73e8' },
                areaStyle: { // 加上面積圖樣式，讓圖表更好看
                    color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [{
                        offset: 0,
                        color: 'rgba(26, 115, 232, 0.3)'
                    }, {
                        offset: 1,
                        color: 'rgba(26, 115, 232, 0)'
                    }])
                }
            }]
        };
        myChart.setOption(option);
    };

    // --- 【第4步：升級 renderNews 函式，以處理新的資料結構】 ---
    const renderNews = (newsData) => {
        // 根據 newsData.count 來判斷是否有新聞
        if (!newsData || newsData.count === 0) {
            newsList.innerHTML = '<li>目前沒有找到相關新聞。</li>';
            return;
        }

        // 遍歷 newsData.items 陣列
        newsData.items.forEach(item => {
            const li = document.createElement('li');
            li.className = 'news-item';
            // 加上 rel="noopener noreferrer" 增加安全性，並為空摘要提供後備文字
            li.innerHTML = `
                <a href="${item.url}" target="_blank" rel="noopener noreferrer">${item.title}</a>
                <p>${item.summary || '<i>(無摘要資訊)</i>'}</p>
                <span class="source">來源: ${item.source}</span>
            `;
            newsList.appendChild(li);
        });
    };

    // --- 【第5步：綁定新的查詢按鈕和輸入框事件】 ---
    searchBtn.addEventListener('click', () => {
        const symbol = symbolInput.value.trim().toUpperCase();
        if (symbol) {
            fetchData(symbol);
        } else {
            alert('請輸入美股代碼！');
        }
    });
    
    // 讓使用者在輸入框中按下 Enter 鍵也能觸發查詢
    symbolInput.addEventListener('keyup', (event) => {
        if (event.key === 'Enter') {
            searchBtn.click(); // 模擬點擊查詢按鈕
        }
    });

    // 頁面首次載入時，預設獲取 SPY 的數據
    fetchData('SPY');
});

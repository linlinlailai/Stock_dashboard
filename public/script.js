// public/script.js (最終偵錯版)

document.addEventListener('DOMContentLoaded', () => {
    // ... (其他部分和您貼的程式碼完全一樣，無需改動) ...
    const searchBtn = document.getElementById('search-btn');
    const symbolInput = document.getElementById('symbol-input');
    const currentSymbolSpan = document.getElementById('current-symbol');
    const loadingIndicator = document.getElementById('loading');
    const chartContainer = document.getElementById('chart');
    const newsList = document.getElementById('news-list');
    const myChart = echarts.init(chartContainer);

    // --- 【唯一的修改在這裡：fetchData 函式】 ---
    const fetchData = async (symbol) => {
        loadingIndicator.classList.remove('hidden');
        searchBtn.disabled = true;
        symbolInput.disabled = true;
        myChart.clear();
        newsList.innerHTML = '';
        chartContainer.innerHTML = '';

        try {
            const response = await fetch(`/api/data?symbol=${symbol}`);
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || `請求失敗，狀態碼: ${response.status}`);
            }

            // --- 【關鍵的檢查點】---
            // 在渲染圖表前，先檢查 chartData 和其內容是否存在且不為空
            if (data.chartData && data.chartData.dates && data.chartData.dates.length > 0) {
                currentSymbolSpan.textContent = data.symbol.toUpperCase();
                renderChart(data.chartData, data.symbol);
            } else {
                // 如果 chartData 是空的或有問題，就主動拋出一個錯誤，讓使用者知道
                throw new Error(`無法獲取 '${symbol}' 的有效圖表數據。這可能是因為 API 達到使用上限，請稍後再試。`);
            }
            // --- 【檢查結束】---

            renderNews(data.newsData);

        } catch (error) {
            console.error("Fetch error:", error);
            chartContainer.innerHTML = `<p style="color: red; text-align: center; padding-top: 50px;">${error.message}</p>`;
        } finally {
            loadingIndicator.classList.add('hidden');
            searchBtn.disabled = false;
            symbolInput.disabled = false;
        }
    };

    // ... (renderChart, renderNews, 和事件監聽器都和您貼的程式碼一樣，無需改動) ...
    const renderChart = (chartData, symbol) => {
        const option = {
            title: { text: `${symbol.toUpperCase()} 近30日收盤價`, left: 'center', textStyle: { color: '#333' } },
            tooltip: { trigger: 'axis' },
            xAxis: { type: 'category', data: chartData.dates },
            yAxis: { type: 'value', scale: true },
            series: [{
                data: chartData.prices,
                type: 'line',
                smooth: true,
                itemStyle: { color: '#1a73e8' },
                areaStyle: { color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [{ offset: 0, color: 'rgba(26, 115, 232, 0.3)' }, { offset: 1, color: 'rgba(26, 115, 232, 0)' }]) }
            }]
        };
        myChart.setOption(option);
    };

    const renderNews = (newsData) => {
        if (!newsData || newsData.count === 0) {
            newsList.innerHTML = '<li>目前沒有找到相關新聞。</li>';
            return;
        }
        newsData.items.forEach(item => {
            const li = document.createElement('li');
            li.className = 'news-item';
            li.innerHTML = `<a href="${item.url}" target="_blank" rel="noopener noreferrer">${item.title}</a><p>${item.summary || '<i>(無摘要資訊)</i>'}</p><span class="source">來源: ${item.source}</span>`;
            newsList.appendChild(li);
        });
    };

    searchBtn.addEventListener('click', () => {
        const symbol = symbolInput.value.trim().toUpperCase();
        if (symbol) { fetchData(symbol); } else { alert('請輸入美股代碼！'); }
    });
    
    symbolInput.addEventListener('keyup', (event) => {
        if (event.key === 'Enter') { searchBtn.click(); }
    });

    fetchData('SPY');
});

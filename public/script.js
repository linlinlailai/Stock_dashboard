// public/script.js (修復版本)

document.addEventListener('DOMContentLoaded', () => {
    const searchBtn = document.getElementById('search-btn');
    const symbolInput = document.getElementById('symbol-input');
    const currentSymbolSpan = document.getElementById('current-symbol');
    const loadingIndicator = document.getElementById('loading');
    const chartContainer = document.getElementById('chart');
    const newsList = document.getElementById('news-list');

    // 將 myChart 宣告為變數，稍後動態初始化
    let myChart;

    // 強化的 ECharts 初始化函式
    const initChart = async () => {
        // 如果已經有實例，先銷毀它
        if (myChart) {
            myChart.dispose();
        }
        
        // 確保容器有尺寸
        if (chartContainer.offsetWidth === 0 || chartContainer.offsetHeight === 0) {
            // 等待一小段時間讓 DOM 完全渲染
            await new Promise(resolve => setTimeout(resolve, 100));
        }
        
        try {
            myChart = echarts.init(chartContainer);
            console.log('ECharts 初始化成功:', myChart);
        } catch (error) {
            console.error('ECharts 初始化失敗:', error);
            // 如果初始化失敗，再試一次
            await new Promise(resolve => setTimeout(resolve, 200));
            try {
                myChart = echarts.init(chartContainer);
                console.log('ECharts 重新初始化成功:', myChart);
            } catch (retryError) {
                console.error('ECharts 重新初始化也失敗:', retryError);
            }
        }
    };

    const fetchData = async (symbol) => {
        // 確保 ECharts 實例存在
        if (!myChart) {
            await initChart();
        }

        loadingIndicator.classList.remove('hidden');
        searchBtn.disabled = true;
        symbolInput.disabled = true;
        
        if (myChart) {
            myChart.clear();
        }
        
        newsList.innerHTML = '';
        chartContainer.innerHTML = '';

        try {
            const response = await fetch(`/api/data?symbol=${symbol}`);
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || `請求失敗，狀態碼: ${response.status}`);
            }

            // 檢查 chartData 和其內容是否存在且不為空
            if (data.chartData && data.chartData.dates && data.chartData.dates.length > 0) {
                currentSymbolSpan.textContent = data.symbol.toUpperCase();
                
                // 確保 myChart 存在才渲染圖表
                if (myChart) {
                    renderChart(data.chartData, data.symbol);
                } else {
                    throw new Error('圖表初始化失敗，請重新整理頁面再試。');
                }
            } else {
                throw new Error(`無法獲取 '${symbol}' 的有效圖表數據。這可能是因為 API 達到使用上限，請稍後再試。`);
            }

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

    const renderChart = (chartData, symbol) => {
        if (!myChart) {
            console.error('myChart 實例不存在，無法渲染圖表');
            return;
        }

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
                areaStyle: {
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
        
        try {
            myChart.setOption(option);
            console.log('圖表渲染成功');
        } catch (error) {
            console.error('圖表渲染失敗:', error);
        }
    };

    const renderNews = (newsData) => {
        if (!newsData || newsData.count === 0) {
            newsList.innerHTML = '<li>目前沒有找到相關新聞。</li>';
            return;
        }

        newsData.items.forEach(item => {
            const li = document.createElement('li');
            li.className = 'news-item';
            li.innerHTML = `
                <a href="${item.url}" target="_blank" rel="noopener noreferrer">${item.title}</a>
                <p>${item.summary || '<i>(無摘要資訊)</i>'}</p>
                <span class="source">來源: ${item.source}</span>
            `;
            newsList.appendChild(li);
        });
    };

    // 綁定事件監聽器
    searchBtn.addEventListener('click', () => {
        const symbol = symbolInput.value.trim().toUpperCase();
        if (symbol) {
            fetchData(symbol);
        } else {
            alert('請輸入美股代碼！');
        }
    });
    
    symbolInput.addEventListener('keyup', (event) => {
        if (event.key === 'Enter') {
            searchBtn.click();
        }
    });

    // 頁面載入後初始化圖表並獲取預設數據
    initChart().then(() => {
        fetchData('SPY');
    });

    // 視窗大小改變時重新調整圖表大小
    window.addEventListener('resize', () => {
        if (myChart) {
            myChart.resize();
        }
    });
});


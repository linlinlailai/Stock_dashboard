document.addEventListener('DOMContentLoaded', () => {
    const updateBtn = document.getElementById('update-btn');
    const loadingIndicator = document.getElementById('loading');
    const chartContainer = document.getElementById('chart');
    const newsList = document.getElementById('news-list');

    // 初始化 ECharts
    const myChart = echarts.init(chartContainer);

    const fetchData = async () => {
        // 顯示加載動畫並禁用按鈕
        loadingIndicator.classList.remove('hidden');
        updateBtn.disabled = true;
        myChart.clear(); // 清空舊圖表
        newsList.innerHTML = ''; // 清空舊新聞

        try {
            // 呼叫我們自己的後端 API
            const response = await fetch('/api/data');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();

            // 渲染圖表
            renderChart(data.chartData);

            // 渲染新聞
            renderNews(data.newsData);

        } catch (error) {
            console.error("Fetch error:", error);
            chartContainer.innerHTML = '<p style="color: red;">無法載入數據，請稍後再試。</p>';
        } finally {
            // 隱藏加載動畫並啟用按鈕
            loadingIndicator.classList.add('hidden');
            updateBtn.disabled = false;
        }
    };

    const renderChart = (chartData) => {
        const option = {
            tooltip: { trigger: 'axis' },
            xAxis: {
                type: 'category',
                data: chartData.dates
            },
            yAxis: {
                type: 'value',
                scale: true // Y軸會自動縮放以適應數據
            },
            series: [{
                data: chartData.prices,
                type: 'line',
                smooth: true,
                itemStyle: { color: '#1a73e8' }
            }]
        };
        myChart.setOption(option);
    };

    const renderNews = (newsData) => {
        if (newsData.length === 0) {
            newsList.innerHTML = '<li>暫無新聞</li>';
            return;
        }
        newsData.forEach(item => {
            const li = document.createElement('li');
            li.className = 'news-item';
            li.innerHTML = `
                <a href="${item.url}" target="_blank">${item.title}</a>
                <p>${item.summary}</p>
                <span class="source">來源: ${item.source}</span>
            `;
            newsList.appendChild(li);
        });
    };

    // 綁定按鈕點擊事件
    updateBtn.addEventListener('click', fetchData);

    // 頁面載入後自動獲取一次數據
    fetchData();
});

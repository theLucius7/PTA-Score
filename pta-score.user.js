// ==UserScript==
// @name         PTA 隐藏成绩查询
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  抓取并显示 PTA (Pintia) 隐藏的考试成绩，右下角悬浮窗展示。
// @author       theLucius7
// @match        https://pintia.cn/problem-sets/*/exam/overview
// @grant        none
// @run-at       document-start
// @license      MIT
// ==/UserScript==

(function() {
    'use strict';

    console.log('[PTA成绩查询] 脚本已加载');

    // 成绩数据获取
    const originalFetch = window.fetch;
    window.fetch = async function(...args) {
        const response = await originalFetch.apply(this, args);
        try {
            const clone = response.clone();
            clone.json().then(data => {
                checkAndDisplayScore(args[0], data);
            }).catch(() => {});
        } catch (e) {
            console.error('[PTA成绩查询] 数据获取异常:', e);
        }
        return response;
    };

    const originalOpen = XMLHttpRequest.prototype.open;
    XMLHttpRequest.prototype.open = function(method, url) {
        this._interceptedUrl = url;
        return originalOpen.apply(this, arguments);
    };

    const originalSend = XMLHttpRequest.prototype.send;
    XMLHttpRequest.prototype.send = function(body) {
        this.addEventListener('load', function() {
            if (this._interceptedUrl) {
                try {
                    const data = JSON.parse(this.responseText);
                    checkAndDisplayScore(this._interceptedUrl, data);
                } catch (e) {}
            }
        });
        return originalSend.apply(this, arguments);
    };

    // 成绩展示逻辑
    function checkAndDisplayScore(url, data) {
        const urlString = typeof url === 'string' ? url : (url?.url || '');
        if (urlString.includes('/exams') && data?.exam?.score !== undefined) {
            displayScore(data.exam.score);
        }
    }

    // 渲染右下角悬浮 UI
    function displayScore(score) {
        if (!document.body) {
            setTimeout(() => displayScore(score), 50);
            return;
        }

        console.log('[PTA成绩查询] 获取成功，当前成绩:', score);

        let scoreElement = document.getElementById('pta-score-display-final');
        if (!scoreElement) {
            scoreElement = document.createElement('div');
            scoreElement.id = 'pta-score-display-final';

            Object.assign(scoreElement.style, {
                position: 'fixed',
                bottom: '30px',
                right: '30px',
                backgroundColor: '#ffffff',
                color: '#333333',
                padding: '12px 20px',
                borderRadius: '8px',
                zIndex: '999999',
                fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                fontSize: '14px',
                boxShadow: '0 4px 16px rgba(0, 0, 0, 0.15)',
                borderLeft: '4px solid #4CAF50',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                userSelect: 'none',
                transition: 'opacity 0.3s ease, transform 0.3s ease'
            });

            const textSpan = document.createElement('span');
            textSpan.id = 'pta-score-text-final';
            scoreElement.appendChild(textSpan);

            const closeBtn = document.createElement('div');
            closeBtn.innerHTML = '✕';
            Object.assign(closeBtn.style, {
                cursor: 'pointer',
                fontSize: '14px',
                color: '#999',
                padding: '4px',
                lineHeight: '1',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.2s'
            });

            closeBtn.onmouseover = () => { 
                closeBtn.style.color = '#333'; 
                closeBtn.style.backgroundColor = '#f0f0f0'; 
            };
            closeBtn.onmouseout = () => { 
                closeBtn.style.color = '#999'; 
                closeBtn.style.backgroundColor = 'transparent'; 
            };
            
            closeBtn.onclick = () => {
                scoreElement.style.opacity = '0';
                scoreElement.style.transform = 'translateY(10px)';
                setTimeout(() => scoreElement.remove(), 300);
            };

            scoreElement.appendChild(closeBtn);
            document.body.appendChild(scoreElement);
        }

        const textSpan = scoreElement.querySelector('#pta-score-text-final');
        if (textSpan) {
            textSpan.innerHTML = `当前成绩：<strong style="color: #4CAF50; font-size: 18px; margin: 0 4px;">${score}</strong> 分`;
        }
    }
})();
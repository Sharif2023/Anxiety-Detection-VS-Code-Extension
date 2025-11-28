(function() {
    const vscode = acquireVsCodeApi();
    let currentMetrics = {};
    
    // Elements
    const anxietyGauge = document.getElementById('anxietyGauge');
    const keystrokeRate = document.getElementById('keystrokeRate');
    const keystrokeVariance = document.getElementById('keystrokeVariance');
    const backspaceRate = document.getElementById('backspaceRate');
    const activeTime = document.getElementById('activeTime');
    const idleRatio = document.getElementById('idleRatio');
    const focusSwitches = document.getElementById('focusSwitches');
    const errorFrequency = document.getElementById('errorFrequency');
    const resolutionTime = document.getElementById('resolutionTime');
    const consecutiveErrors = document.getElementById('consecutiveErrors');
    const sessionDuration = document.getElementById('sessionDuration');
    const filesOpened = document.getElementById('filesOpened');
    const totalKeystrokes = document.getElementById('totalKeystrokes');
    const dataConfidence = document.getElementById('dataConfidence');
    
    // Controls
    const exportBtn = document.getElementById('exportBtn');
    const collectionToggle = document.getElementById('collectionToggle');
    
    // Event listeners
    exportBtn.addEventListener('click', () => {
        vscode.postMessage({ type: 'exportData' });
    });
    
    collectionToggle.addEventListener('change', (e) => {
        vscode.postMessage({ 
            type: 'toggleCollection', 
            value: e.target.checked 
        });
    });
    
    // Handle messages from extension
    window.addEventListener('message', event => {
        const message = event.data;
        
        switch (message.type) {
            case 'currentMetrics':
                currentMetrics = message.data;
                updateDashboard();
                break;
        }
    });
    
    function updateDashboard() {
        // Update anxiety gauge
        updateAnxietyGauge(currentMetrics.anxietyScore || 0);
        
        // Update metric values
        updateMetric(keystrokeRate, currentMetrics.keystrokeRate, 'keys/min');
        updateMetric(keystrokeVariance, currentMetrics.keystrokeVariance, '', 2);
        updateMetric(backspaceRate, currentMetrics.backspaceRate, '%', 1);
        updateMetric(activeTime, currentMetrics.activeTime, 'min');
        updateMetric(idleRatio, currentMetrics.idleRatio, '', 2);
        updateMetric(focusSwitches, currentMetrics.focusSwitches, 'switches');
        updateMetric(errorFrequency, currentMetrics.errorFrequency, 'errors/min', 2);
        updateMetric(resolutionTime, currentMetrics.resolutionTime, 'sec');
        updateMetric(consecutiveErrors, currentMetrics.consecutiveErrors, 'errors');
        
        // Update session info
        updateMetric(sessionDuration, currentMetrics.sessionDuration, 'min');
        updateMetric(filesOpened, currentMetrics.filesOpened, 'files');
        updateMetric(totalKeystrokes, currentMetrics.totalKeystrokes, 'keys');
        updateMetric(dataConfidence, currentMetrics.dataConfidence, '%', 1);
        
        // Update collection toggle
        collectionToggle.checked = currentMetrics.collectionActive !== false;
    }
    
    function updateAnxietyGauge(score) {
        const gaugeValue = anxietyGauge.querySelector('.gauge-value');
        const gaugeLabel = anxietyGauge.querySelector('.gauge-label');
        
        const percentage = Math.round(score * 100);
        gaugeValue.textContent = `${percentage}%`;
        
        // Determine anxiety level and color
        let level, colorClass;
        if (score < 0.3) {
            level = 'Low';
            colorClass = 'anxiety-low';
        } else if (score < 0.7) {
            level = 'Medium';
            colorClass = 'anxiety-medium';
        } else {
            level = 'High';
            colorClass = 'anxiety-high';
        }
        
        gaugeLabel.textContent = level;
        gaugeLabel.className = `gauge-label ${colorClass}`;
        gaugeValue.className = `gauge-value ${colorClass}`;
        
        // Update gauge visualization (simplified)
        anxietyGauge.style.background = `conic-gradient(
            var(--vscode-${getColorForScore(score)}) 0% ${percentage}%,
            var(--vscode-input-background) ${percentage}% 100%
        )`;
        anxietyGauge.style.borderRadius = '50%';
    }
    
    function getColorForScore(score) {
        if (score < 0.3) return 'testing-iconPassed';
        if (score < 0.7) return 'testing-iconQueued';
        return 'testing-iconFailed';
    }
    
    function updateMetric(element, value, suffix = '', precision = 0) {
        if (value === undefined || value === null) {
            element.textContent = '--';
            return;
        }
        
        let displayValue;
        if (typeof value === 'number') {
            displayValue = value.toFixed(precision);
        } else {
            displayValue = value;
        }
        
        element.textContent = suffix ? `${displayValue} ${suffix}` : displayValue;
    }
    
    // Request initial metrics
    vscode.postMessage({ type: 'getCurrentMetrics' });
    
    // Update metrics periodically
    setInterval(() => {
        vscode.postMessage({ type: 'getCurrentMetrics' });
    }, 2000);
})();
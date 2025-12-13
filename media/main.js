(function() {
    const vscode = acquireVsCodeApi();
    let currentMetrics = {};
    let anxietyHistory = [];
    const maxHistoryLength = 30;
    
    // DOM Elements
    const elements = {
        anxietyValue: document.getElementById('anxietyValue'),
        anxietyLabel: document.getElementById('anxietyLabel'),
        anxietyProgress: document.getElementById('anxietyProgress'),
        keystrokeRate: document.getElementById('keystrokeRate'),
        keystrokeVariance: document.getElementById('keystrokeVariance'),
        backspaceRate: document.getElementById('backspaceRate'),
        activeTime: document.getElementById('activeTime'),
        idleRatio: document.getElementById('idleRatio'),
        focusSwitches: document.getElementById('focusSwitches'),
        errorFrequency: document.getElementById('errorFrequency'),
        resolutionTime: document.getElementById('resolutionTime'),
        consecutiveErrors: document.getElementById('consecutiveErrors'),
        totalCompilations: document.getElementById('totalCompilations'),
        compilationSuccessRate: document.getElementById('compilationSuccessRate'),
        currentFileAttempts: document.getElementById('currentFileAttempts'),
        totalUndos: document.getElementById('totalUndos'),
        totalRedos: document.getElementById('totalRedos'),
        undoRedoRatio: document.getElementById('undoRedoRatio'),
        sessionDuration: document.getElementById('sessionDuration'),
        filesOpened: document.getElementById('filesOpened'),
        totalKeystrokes: document.getElementById('totalKeystrokes'),
        dataConfidence: document.getElementById('dataConfidence'),
        currentFile: document.getElementById('currentFile'),
        collectionStatus: document.getElementById('collectionStatus'),
        collectionToggle: document.getElementById('collectionToggle'),
        exportBtn: document.getElementById('exportBtn'),
        refreshBtn: document.getElementById('refreshBtn'),
        insightsContainer: document.getElementById('insightsContainer'),
        activityTimeline: document.getElementById('activityTimeline'),
        anxietyTimeline: document.getElementById('anxietyTimeline')
    };

    // Initialize
    function initialize() {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', initializeEventListeners);
        } else {
            initializeEventListeners();
        }
        requestMetrics();
        
        // Set up periodic updates
        setInterval(requestMetrics, 2000);
    }

    // Event Listeners
    function initializeEventListeners() {
        if (elements.collectionToggle) {
            elements.collectionToggle.addEventListener('change', function(e) {
                vscode.postMessage({
                    type: 'toggleCollection',
                    value: e.target.checked
                });
            });
        }

        if (elements.exportBtn) {
            elements.exportBtn.addEventListener('click', function() {
                vscode.postMessage({
                    type: 'exportData'
                });
            });
        }

        if (elements.refreshBtn) {
            elements.refreshBtn.addEventListener('click', function() {
                requestMetrics();
            });
        }

        // Handle messages from extension
        window.addEventListener('message', function(event) {
            const message = event.data;
            
            switch (message.type) {
                case 'currentMetrics':
                    currentMetrics = message.data || {};
                    updateDashboard();
                    break;
                case 'collectionStatus':
                    updateCollectionStatus(message.active);
                    break;
            }
        });
    }

    // Request metrics from extension
    function requestMetrics() {
        vscode.postMessage({
            type: 'getCurrentMetrics'
        });
    }

    // Update dashboard with current metrics
    function updateDashboard() {
        updateAnxietyGauge();
        updateKeystrokeMetrics();
        updateActivityMetrics();
        updateErrorMetrics();
        updateCompilationMetrics();
        updateUndoRedoMetrics();
        updateSessionInfo();
        updateInsights();
        updateActivityTimeline();
    }

    // Update anxiety gauge
    function updateAnxietyGauge() {
        if (!elements.anxietyValue || !elements.anxietyLabel || !elements.anxietyProgress) return;
        
        const anxietyScore = currentMetrics.anxietyScore || 0;
        const percentage = Math.round(anxietyScore * 100);
        
        elements.anxietyValue.textContent = `${percentage}%`;
        elements.anxietyProgress.style.width = `${percentage}%`;
        
        // Update label and color
        let level, colorClass;
        if (anxietyScore < 0.3) {
            level = 'Low Anxiety';
            colorClass = 'anxiety-low';
        } else if (anxietyScore < 0.7) {
            level = 'Medium Anxiety';
            colorClass = 'anxiety-medium';
        } else {
            level = 'High Anxiety';
            colorClass = 'anxiety-high';
        }
        
        elements.anxietyLabel.textContent = level;
        elements.anxietyLabel.className = `gauge-label ${colorClass}`;
        elements.anxietyValue.className = `gauge-value ${colorClass}`;
        
        // Update anxiety history for chart
        anxietyHistory.push(anxietyScore);
        if (anxietyHistory.length > maxHistoryLength) {
            anxietyHistory.shift();
        }
        
        updateAnxietyChart();
    }

    // Update keystroke metrics
    function updateKeystrokeMetrics() {
        updateMetric(elements.keystrokeRate, currentMetrics.keystrokeRate, 'keys/min', 1);
        updateMetric(elements.keystrokeVariance, currentMetrics.keystrokeVariance, '', 2);
        updateMetric(elements.backspaceRate, currentMetrics.backspaceRate, '%', 1);
        
        // Update progress bar based on backspace rate
        const backspaceProgress = Math.min((currentMetrics.backspaceRate || 0) * 300, 100);
        const progressBar = document.getElementById('keystrokeProgress');
        if (progressBar) {
            progressBar.style.width = `${backspaceProgress}%`;
        }
    }

    // Update activity metrics
    function updateActivityMetrics() {
        updateMetric(elements.activeTime, currentMetrics.activeTime, 'min', 0);
        updateMetric(elements.idleRatio, currentMetrics.idleRatio, '', 2);
        updateMetric(elements.focusSwitches, currentMetrics.focusSwitches, '', 0);
        
        // Update progress bar based on focus switches
        const focusProgress = Math.min((currentMetrics.focusSwitches || 0) * 5, 100);
        const progressBar = document.getElementById('activityProgress');
        if (progressBar) {
            progressBar.style.width = `${focusProgress}%`;
        }
    }

    // Update error metrics
    function updateErrorMetrics() {
        updateMetric(elements.errorFrequency, currentMetrics.errorFrequency, 'errors/min', 2);
        updateMetric(elements.resolutionTime, currentMetrics.resolutionTime, 'sec', 0);
        updateMetric(elements.consecutiveErrors, currentMetrics.consecutiveErrors, 'errors', 0);
        
        // Update progress bar based on error frequency
        const errorProgress = Math.min((currentMetrics.errorFrequency || 0) * 100, 100);
        const progressBar = document.getElementById('errorProgress');
        if (progressBar) {
            progressBar.style.width = `${errorProgress}%`;
        }
    }

    // Update compilation metrics
    function updateCompilationMetrics() {
        updateMetric(elements.totalCompilations, currentMetrics.totalCompilationAttempts, '', 0);
        updateMetric(elements.compilationSuccessRate, currentMetrics.compilationSuccessRate, '%', 1);
        updateMetric(elements.currentFileAttempts, currentMetrics.currentFileAttempts, '', 0);
        
        // Update progress bar based on compilation attempts
        const compilationProgress = Math.min((currentMetrics.currentFileAttempts || 0) * 20, 100);
        const progressBar = document.getElementById('compilationProgress');
        if (progressBar) {
            progressBar.style.width = `${compilationProgress}%`;
        }
    }

    // Update undo/redo metrics
    function updateUndoRedoMetrics() {
        updateMetric(elements.totalUndos, currentMetrics.totalUndos, '', 0);
        updateMetric(elements.totalRedos, currentMetrics.totalRedos, '', 0);
        updateMetric(elements.undoRedoRatio, currentMetrics.undoRedoRatio, '', 2);
        
        // Update progress bar based on undo/redo ratio
        const undoRedoProgress = Math.min((currentMetrics.undoRedoRatio || 0) * 20, 100);
        const progressBar = document.getElementById('undoRedoProgress');
        if (progressBar) {
            progressBar.style.width = `${undoRedoProgress}%`;
        }
    }

    // Update session information
    function updateSessionInfo() {
        updateMetric(elements.sessionDuration, currentMetrics.sessionDuration, 'min', 0);
        updateMetric(elements.filesOpened, currentMetrics.filesOpened, '', 0);
        updateMetric(elements.totalKeystrokes, currentMetrics.totalKeystrokes, '', 0);
        updateMetric(elements.dataConfidence, currentMetrics.dataConfidence, '%', 1);
        
        // Update current file
        if (elements.currentFile) {
            const filePath = currentMetrics.currentFile || '--';
            elements.currentFile.textContent = filePath;
        }
        
        // Update collection status
        updateCollectionStatus(currentMetrics.collectionActive);
    }

    // Update collection status
    function updateCollectionStatus(active) {
        if (!elements.collectionStatus || !elements.collectionToggle) return;
        
        const statusElement = elements.collectionStatus;
        const indicator = statusElement.querySelector('.status-indicator');
        const textNodes = Array.from(statusElement.childNodes).filter(node => node.nodeType === Node.TEXT_NODE);
        const textNode = textNodes[textNodes.length - 1];
        
        if (indicator) {
            if (active !== false) {
                indicator.className = 'status-indicator status-active';
                if (textNode) textNode.textContent = ' Active';
                elements.collectionToggle.checked = true;
            } else {
                indicator.className = 'status-indicator status-inactive';
                if (textNode) textNode.textContent = ' Paused';
                elements.collectionToggle.checked = false;
            }
        }
    }

    // Update insights and recommendations
    function updateInsights() {
        if (!elements.insightsContainer) return;
        
        const anxietyScore = currentMetrics.anxietyScore || 0;
        const insights = [];
        
        if (anxietyScore > 0.7) {
            insights.push(
                "High anxiety detected. Consider taking a short break to reset.",
                "Multiple error patterns observed. Focus on resolving one issue at a time.",
                "Your typing patterns show signs of stress. Try deep breathing exercises.",
                "Frequent undo/redo actions suggest uncertainty. Consider writing pseudocode first."
            );
        } else if (anxietyScore > 0.4) {
            insights.push(
                "Moderate anxiety levels detected. Monitor your pace and take micro-breaks.",
                "Consider breaking down complex tasks into smaller, manageable pieces.",
                "Your activity patterns show some stress. Stay hydrated and maintain good posture."
            );
        } else {
            insights.push(
                "Low anxiety levels detected. Maintain your current productive workflow.",
                "Good coding rhythm observed. Continue with your current approach.",
                "Balanced activity patterns. Consider setting incremental goals."
            );
        }
        
        // Add specific insights based on metrics
        if ((currentMetrics.backspaceRate || 0) > 0.3) {
            insights.push("High backspace rate detected. This may indicate uncertainty in code structure.");
        }
        
        if ((currentMetrics.errorFrequency || 0) > 0.5) {
            insights.push("Frequent errors detected. Consider using more defensive programming techniques.");
        }
        
        if ((currentMetrics.focusSwitches || 0) > 10) {
            insights.push("Frequent context switching detected. Try focusing on one task at a time.");
        }
        
        // Update insights container
        elements.insightsContainer.innerHTML = insights
            .map(insight => `<div class="insight-item">${insight}</div>`)
            .join('');
    }

    // Update activity timeline
    function updateActivityTimeline() {
        if (!elements.activityTimeline) return;
        
        // Generate activity data based on metrics
        const activityData = [];
        for (let i = 0; i < 20; i++) {
            // Use anxiety history if available, otherwise generate based on current metrics
            if (anxietyHistory.length > 0) {
                const index = Math.floor((i / 20) * anxietyHistory.length);
                activityData.push((anxietyHistory[index] || 0) * 100);
            } else {
                activityData.push(Math.random() * 100);
            }
        }
        
        elements.activityTimeline.innerHTML = activityData
            .map(height => `<div class="timeline-bar" style="height: ${height}%"></div>`)
            .join('');
    }

    // Update anxiety chart
    function updateAnxietyChart() {
        if (!elements.anxietyTimeline) return;
        
        // Create canvas if it doesn't exist
        let canvas = document.getElementById('anxietyChart');
        if (!canvas) {
            canvas = document.createElement('canvas');
            canvas.id = 'anxietyChart';
            elements.anxietyTimeline.innerHTML = '';
            elements.anxietyTimeline.appendChild(canvas);
        }
        
        const ctx = canvas.getContext('2d');
        const container = elements.anxietyTimeline;
        const width = container.clientWidth || 400;
        const height = container.clientHeight || 120;
        
        canvas.width = width;
        canvas.height = height;
        
        // Clear canvas
        ctx.clearRect(0, 0, width, height);
        
        if (anxietyHistory.length < 2) {
            // Show placeholder text
            ctx.fillStyle = '#969696';
            ctx.font = '12px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('Collecting data...', width / 2, height / 2);
            return;
        }
        
        // Draw chart
        const maxValue = Math.max(...anxietyHistory, 0.1); // Avoid division by zero
        const xStep = width / (anxietyHistory.length - 1);
        
        ctx.beginPath();
        ctx.moveTo(0, height - (anxietyHistory[0] / maxValue) * height * 0.8);
        
        anxietyHistory.forEach((value, index) => {
            const x = index * xStep;
            const y = height - (value / maxValue) * height * 0.8;
            ctx.lineTo(x, y);
        });
        
        ctx.strokeStyle = getAnxietyColor(currentMetrics.anxietyScore || 0);
        ctx.lineWidth = 2;
        ctx.stroke();
    }

    // Helper function to get anxiety color
    function getAnxietyColor(score) {
        if (score < 0.3) return '#89d185';
        if (score < 0.7) return '#cca700';
        return '#f48771';
    }

    // Helper function to update metric values
    function updateMetric(element, value, suffix = '', precision = 0) {
        if (!element) return;
        
        if (value === undefined || value === null) {
            element.textContent = '--';
            return;
        }
        
        let displayValue;
        if (typeof value === 'number') {
            if (suffix === '%') {
                displayValue = (value * 100).toFixed(precision);
            } else {
                displayValue = value.toFixed(precision);
            }
        } else {
            displayValue = value;
        }
        
        element.textContent = suffix ? `${displayValue}${suffix}` : displayValue;
    }

    // Initialize anxiety chart on resize
    window.addEventListener('resize', updateAnxietyChart);
    
    // Start initialization
    initialize();
})();
